// api/cambio.js

// Formata data para BCB PTAX: MM-DD-YYYY
function formatBCB(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${mm}-${dd}-${date.getFullYear()}`
}

// Formata data para SML BCB: DD/MM/YYYY
function formatSML(date) {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${date.getFullYear()}`
}

// Retorna o último dia útil anterior (pula fins de semana)
function getDiaAnterior(date) {
  const d = new Date(date)
  d.setDate(d.getDate() - 1)
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() - 1)
  }
  return d
}

const MOEDAS = {
  USD: 'Dólar Americano',
  EUR: 'Euro',
  UYU: 'Peso Uruguaio',
  ARS: 'Peso Argentino',
  PYG: 'Guarani Paraguaio',
}

const CODIGOS_BCU = { USD: '2225', EUR: '1111', ARS: '2109' }

async function getCotacaoPTAX(moeda, data) {
  const dataStr = formatBCB(data)
  const url = moeda === 'USD'
    ? `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@d)?@d='${dataStr}'&$top=1&$orderby=dataHoraCotacao%20desc&$format=json&$select=cotacaoVenda`
    : `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@m,dataCotacao=@d)?@m='${moeda}'&@d='${dataStr}'&$top=1&$orderby=dataHoraCotacao%20desc&$format=json&$select=cotacaoVenda`
  const res  = await fetch(url)
  const json = await res.json()
  return json?.value?.[0]?.cotacaoVenda ?? null
}

async function getCotacaoSML_PYG(data) {
  const dataStr = formatSML(data)
  const url = `https://olinda.bcb.gov.br/olinda/servico/SML/versao/v1/odata/ObterCotacaoRealGuaranii(dataCotacao=@d)?@d='${dataStr}'&$format=json`
  const res  = await fetch(url)
  const json = await res.json()
  const taxaVenda = json?.value?.[0]?.taxaVenda
  if (!taxaVenda) return null
  return 1 / taxaVenda
}

async function getCotacaoBCU(moeda, data) {
  const codigo = CODIGOS_BCU[moeda]
  if (!codigo) return null
  const dd   = String(data.getDate()).padStart(2, '0')
  const mm   = String(data.getMonth() + 1).padStart(2, '0')
  const yyyy = data.getFullYear()
  const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Execute xmlns="http://intermediate.bcu.gub.uy">
      <Entrada>
        <Monedas><Item>${codigo}</Item></Monedas>
        <FechaDesde>${yyyy}${mm}${dd}</FechaDesde>
        <FechaHasta>${yyyy}${mm}${dd}</FechaHasta>
        <Grupo>0</Grupo>
      </Entrada>
    </Execute>
  </soap:Body>
</soap:Envelope>`
  const res = await fetch(
    'https://cotizaciones.bcu.gub.uy/wscotizaciones/servlet/awsbcucotizaciones',
    { method: 'POST', headers: { 'Content-Type': 'text/xml; charset=utf-8' }, body: soapBody }
  )
  const xml   = await res.text()
  const match = xml.match(/<TCV>([\d.]+)<\/TCV>/)
  return match ? parseFloat(match[1]) : null
}

async function getCotacaoARS_BRL(data) {
  const yyyy = data.getFullYear()
  const mm   = String(data.getMonth() + 1).padStart(2, '0')
  const dd   = String(data.getDate()).padStart(2, '0')
  const urlBNA = `https://api.argentinadatos.com/v1/cotizaciones/dolares/oficial/${yyyy}/${mm}/${dd}`
  const [resBNA, usdBrl] = await Promise.all([
    fetch(urlBNA),
    getCotacaoPTAX('USD', data),
  ])
  if (!resBNA.ok) return null
  const jsonBNA = await resBNA.json()
  const usdArs  = jsonBNA?.venta
  if (!usdArs || !usdBrl) return null
  return usdBrl / usdArs
}

export default async function handler(req, res) {
  const moeda     = (req.query.moeda || '').toUpperCase()
  const base      = (req.query.base  || 'BRL').toUpperCase()
  const dataParam = req.query.data

  if (!moeda || !MOEDAS[moeda]) {
    return res.status(400).json({
      error: 'Moeda inválida.',
      suportadas: Object.entries(MOEDAS).map(([codigo, label]) => ({ codigo, label }))
    })
  }

  if (!['BRL', 'UYU'].includes(base)) {
    return res.status(400).json({ error: 'Base inválida. Use BRL ou UYU.' })
  }

  const dataOperacao = dataParam ? new Date(dataParam + 'T12:00:00') : new Date()
  const dataConsulta = getDiaAnterior(dataOperacao)

  try {
    let taxa  = null
    let fonte = ''

    if (base === 'BRL') {
      if (moeda === 'PYG') {
        taxa  = await getCotacaoSML_PYG(dataConsulta)
        fonte = 'BCB SML'
      } else if (moeda === 'ARS') {
        taxa  = await getCotacaoARS_BRL(dataConsulta)
        fonte = 'Banco Nación Argentina + BCB PTAX'
      } else {
        taxa  = await getCotacaoPTAX(moeda, dataConsulta)
        fonte = 'BCB PTAX'
      }
    } else {
      if (moeda === 'PYG' || moeda === 'UYU') {
        return res.status(422).json({ error: `Par ${moeda}/${base} não disponível.` })
      }
      taxa  = await getCotacaoBCU(moeda, dataConsulta)
      fonte = 'BCU'
    }

    if (taxa === null) {
      return res.status(404).json({
        error: 'Cotação não encontrada. Pode ser feriado — tente o dia anterior.',
        dataConsulta: dataConsulta.toISOString().split('T')[0],
      })
    }

    return res.status(200).json({
      moeda,
      moedaLabel:   MOEDAS[moeda],
      base,
      taxa:         Number(taxa.toFixed(8)),
      dataConsulta: dataConsulta.toISOString().split('T')[0],
      fonte,
    })

  } catch (err) {
    console.error('[cambio]', err)
    return res.status(500).json({ error: 'Erro ao consultar câmbio.' })
  }
}
