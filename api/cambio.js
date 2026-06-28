// api/cambio.js

const MOEDAS = {
  USD: 'Dólar Americano',
  EUR: 'Euro',
  UYU: 'Peso Uruguaio',
  ARS: 'Peso Argentino',
  PYG: 'Guarani Paraguaio',
}

// Códigos BCU
const CODIGOS_BCU = { USD: '2225', EUR: '1111', ARS: '2109', BRL: '1500' }

// ─── Utilitários de data ──────────────────────────────────────────────────────

function formatBCB(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${mm}-${dd}-${date.getFullYear()}`
}

function formatISO(date) {
  return date.toISOString().split('T')[0] // YYYY-MM-DD para BCU e Frankfurter
}

function diaUtilAnterior(date) {
  const d = new Date(date)
  d.setDate(d.getDate() - 1)
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() - 1)
  }
  return d
}

// ─── Fontes de câmbio ────────────────────────────────────────────────────────

async function getCotacaoPTAX(moeda, data) {
  const dataStr = formatBCB(data)
  const url = moeda === 'USD'
    ? `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@d)?@d='${dataStr}'&$top=1&$orderby=dataHoraCotacao%20desc&$format=json&$select=cotacaoVenda`
    : `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@m,dataCotacao=@d)?@m='${moeda}'&@d='${dataStr}'&$top=1&$orderby=dataHoraCotacao%20desc&$format=json&$select=cotacaoVenda`
  try {
    const res = await fetch(url)
    const json = await res.json()
    return json?.value?.[0]?.cotacaoVenda ?? null
  } catch { return null }
}

// BCU com formato XML correto (namespace cot: e data YYYY-MM-DD)
async function getCotacaoBCU(moeda, data) {
  const codigo = CODIGOS_BCU[moeda]
  if (!codigo) return null
  const dataStr = formatISO(data)
  const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cot="Cotiza">
  <soapenv:Header/>
  <soapenv:Body>
    <cot:wsbcucotizaciones.Execute>
      <cot:Entrada>
        <cot:Moneda>
          <cot:item>${codigo}</cot:item>
        </cot:Moneda>
        <cot:FechaDesde>${dataStr}</cot:FechaDesde>
        <cot:FechaHasta>${dataStr}</cot:FechaHasta>
        <cot:Grupo>0</cot:Grupo>
      </cot:Entrada>
    </cot:wsbcucotizaciones.Execute>
  </soapenv:Body>
</soapenv:Envelope>`
  try {
    const res = await fetch(
      'https://cotizaciones.bcu.gub.uy/wscotizaciones/servlet/awsbcucotizaciones',
      { method: 'POST', headers: { 'Content-Type': 'text/xml; charset=utf-8' }, body: soapBody }
    )
    const xml = await res.text()
    const match = xml.match(/<TCV>([\d.]+)<\/TCV>/)
    return match ? parseFloat(match[1]) : null
  } catch { return null }
}

async function getCotacaoARS_BRL(data) {
  const yyyy = data.getFullYear()
  const mm = String(data.getMonth() + 1).padStart(2, '0')
  const dd = String(data.getDate()).padStart(2, '0')
  try {
    const [resBNA, usdBrl] = await Promise.all([
      fetch(`https://api.argentinadatos.com/v1/cotizaciones/dolares/oficial/${yyyy}/${mm}/${dd}`),
      getCotacaoPTAX('USD', data),
    ])
    if (!resBNA.ok) return null
    const jsonBNA = await resBNA.json()
    const usdArs = jsonBNA?.venta
    if (!usdArs || !usdBrl) return null
    return usdBrl / usdArs
  } catch { return null }
}

async function getCotacaoPYG_BRL(data) {
  const dataStr = formatISO(data)
  try {
    const [resPYG, usdBrl] = await Promise.all([
      fetch(`https://api.frankfurter.app/${dataStr}?from=USD&to=PYG`),
      getCotacaoPTAX('USD', data),
    ])
    if (!resPYG.ok) return null
    const jsonPYG = await resPYG.json()
    const usdPyg = jsonPYG?.rates?.PYG
    if (!usdPyg || !usdBrl) return null
    return usdBrl / usdPyg
  } catch { return null }
}

// ─── Resolução de taxa para uma data específica ───────────────────────────────

async function resolverTaxaParaData(moeda, base, data) {
  if (moeda === base) return 1

  if (base === 'BRL') {
    if (moeda === 'USD') return await getCotacaoPTAX('USD', data)
    if (moeda === 'EUR') return await getCotacaoPTAX('EUR', data)
    if (moeda === 'ARS') return await getCotacaoARS_BRL(data)
    if (moeda === 'PYG') return await getCotacaoPYG_BRL(data)
    if (moeda === 'UYU') {
      const [usdBrl, usdUyu] = await Promise.all([
        getCotacaoPTAX('USD', data),
        getCotacaoBCU('USD', data),
      ])
      if (!usdBrl || !usdUyu) return null
      return usdBrl / usdUyu
    }
  }

  if (base === 'UYU') {
    if (moeda === 'USD') return await getCotacaoBCU('USD', data)
    if (moeda === 'EUR') return await getCotacaoBCU('EUR', data)
    if (moeda === 'ARS') return await getCotacaoBCU('ARS', data)
    if (moeda === 'BRL') return await getCotacaoBCU('BRL', data)
    if (moeda === 'PYG') {
      const dataStr = formatISO(data)
      const [usdUyu, resPYG] = await Promise.all([
        getCotacaoBCU('USD', data),
        fetch(`https://api.frankfurter.app/${dataStr}?from=USD&to=PYG`),
      ])
      if (!usdUyu || !resPYG.ok) return null
      const jsonPYG = await resPYG.json()
      const usdPyg = jsonPYG?.rates?.PYG
      if (!usdPyg) return null
      return usdUyu / usdPyg
    }
  }

  if (base === 'USD') {
    const [taxaEmBRL, usdBrl] = await Promise.all([
      resolverTaxaParaData(moeda, 'BRL', data),
      getCotacaoPTAX('USD', data),
    ])
    if (!taxaEmBRL || !usdBrl) return null
    return taxaEmBRL / usdBrl
  }

  return null
}

// ─── Handler principal com retry automático ───────────────────────────────────

export default async function handler(req, res) {
  const moeda = (req.query.moeda || '').toUpperCase()
  const base = (req.query.base || 'BRL').toUpperCase()
  const dataParam = req.query.data

  if (!moeda || !MOEDAS[moeda]) {
    return res.status(400).json({
      error: 'Moeda inválida.',
      suportadas: Object.entries(MOEDAS).map(([codigo, label]) => ({ codigo, label }))
    })
  }

  if (!['BRL', 'UYU', 'USD'].includes(base)) {
    return res.status(400).json({ error: 'Base inválida. Use: BRL, UYU ou USD' })
  }

  const dataInicio = dataParam ? new Date(dataParam + 'T12:00:00') : new Date()

  try {
    // Retry: tenta até 5 dias úteis anteriores
    let taxa = null
    let dataConsulta = null
    let d = diaUtilAnterior(dataInicio)

    for (let i = 0; i < 5; i++) {
      taxa = await resolverTaxaParaData(moeda, base, d)
      if (taxa !== null) { dataConsulta = d; break }
      d = diaUtilAnterior(d)
    }

    if (taxa === null) {
      return res.status(404).json({ error: 'Cotação não encontrada após 5 tentativas.' })
    }

    const fontes = {
      'USD/BRL': 'BCB PTAX', 'EUR/BRL': 'BCB PTAX',
      'UYU/BRL': 'BCB PTAX + BCU (triangulação via USD)',
      'ARS/BRL': 'Banco Nación Argentina + BCB PTAX',
      'PYG/BRL': 'Frankfurter + BCB PTAX',
      'USD/UYU': 'BCU', 'EUR/UYU': 'BCU', 'ARS/UYU': 'BCU', 'BRL/UYU': 'BCU',
      'PYG/UYU': 'BCU + Frankfurter (triangulação via USD)',
    }

    return res.status(200).json({
      moeda,
      moedaLabel: MOEDAS[moeda],
      base,
      taxa: Number(taxa.toFixed(8)),
      dataConsulta: dataConsulta.toISOString().split('T')[0],
      fonte: fontes[`${moeda}/${base}`] ?? 'Triangulação',
    })

  } catch (err) {
    console.error('[cambio]', err)
    return res.status(500).json({ error: 'Erro ao consultar câmbio.' })
  }
}
