// api/cambio.js

// ─── Configuração centralizada ────────────────────────────────────────────────

const MOEDAS = {
  USD: 'Dólar Americano',
  EUR: 'Euro',
  UYU: 'Peso Uruguaio',
  ARS: 'Peso Argentino',
  PYG: 'Guarani Paraguaio',
}

// Códigos BCU para pares com base UYU
const CODIGOS_BCU = { USD: '2225', EUR: '1111', ARS: '2109', BRL: '1500' }

// ─── Utilitários de data ──────────────────────────────────────────────────────

function formatBCB(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${mm}-${dd}-${date.getFullYear()}`
}

function getDiaAnterior(date) {
  const d = new Date(date)
  d.setDate(d.getDate() - 1)
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() - 1)
  }
  return d
}

// ─── Fontes de câmbio ────────────────────────────────────────────────────────

// BCB PTAX — USD, EUR vs BRL
async function getCotacaoPTAX(moeda, data) {
  const dataStr = formatBCB(data)
  const url = moeda === 'USD'
    ? `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@d)?@d='${dataStr}'&$top=1&$orderby=dataHoraCotacao%20desc&$format=json&$select=cotacaoVenda`
    : `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@m,dataCotacao=@d)?@m='${moeda}'&@d='${dataStr}'&$top=1&$orderby=dataHoraCotacao%20desc&$format=json&$select=cotacaoVenda`
  const res = await fetch(url)
  const json = await res.json()
  return json?.value?.[0]?.cotacaoVenda ?? null
}

// BCU SOAP — qualquer moeda vs UYU
async function getCotacaoBCU(moeda, data) {
  const codigo = CODIGOS_BCU[moeda]
  if (!codigo) return null
  const dd = String(data.getDate()).padStart(2, '0')
  const mm = String(data.getMonth() + 1).padStart(2, '0')
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
  const xml = await res.text()
  const match = xml.match(/<TCV>([\d.]+)<\/TCV>/)
  return match ? parseFloat(match[1]) : null
}

// BNA (ArgentinaDatos) — ARS vs BRL via triangulação USD
async function getCotacaoARS_BRL(data) {
  const yyyy = data.getFullYear()
  const mm = String(data.getMonth() + 1).padStart(2, '0')
  const dd = String(data.getDate()).padStart(2, '0')
  const urlBNA = `https://api.argentinadatos.com/v1/cotizaciones/dolares/oficial/${yyyy}/${mm}/${dd}`
  const [resBNA, usdBrl] = await Promise.all([
    fetch(urlBNA),
    getCotacaoPTAX('USD', data),
  ])
  if (!resBNA.ok) return null
  const jsonBNA = await resBNA.json()
  const usdArs = jsonBNA?.venta
  if (!usdArs || !usdBrl) return null
  return usdBrl / usdArs
}

// PYG vs BRL via Frankfurter
async function getCotacaoPYG_BRL(data) {
  const yyyy = data.getFullYear()
  const mm = String(data.getMonth() + 1).padStart(2, '0')
  const dd = String(data.getDate()).padStart(2, '0')
  const [resPYG, usdBrl] = await Promise.all([
    fetch(`https://api.frankfurter.app/${yyyy}-${mm}-${dd}?from=USD&to=PYG`),
    getCotacaoPTAX('USD', data),
  ])
  if (!resPYG.ok) return null
  const jsonPYG = await resPYG.json()
  const usdPyg = jsonPYG?.rates?.PYG
  if (!usdPyg || !usdBrl) return null
  return usdBrl / usdPyg
}

// ─── Lógica de resolução por par moeda/base ────────────────────────────────

async function resolverTaxa(moeda, base, data) {
  // Mesmo par
  if (moeda === base) return 1

  // Base BRL
  if (base === 'BRL') {
    if (moeda === 'USD') return await getCotacaoPTAX('USD', data)
    if (moeda === 'EUR') return await getCotacaoPTAX('EUR', data)
    if (moeda === 'UYU') {
      // UYU/BRL = (USD/BRL) ÷ (USD/UYU via BCU)
      const [usdBrl, usdUyu] = await Promise.all([
        getCotacaoPTAX('USD', data),
        getCotacaoBCU('USD', data),
      ])
      if (!usdBrl || !usdUyu) return null
      return usdBrl / usdUyu
    }
    if (moeda === 'ARS') return await getCotacaoARS_BRL(data)
    if (moeda === 'PYG') return await getCotacaoPYG_BRL(data)
  }

  // Base UYU
  if (base === 'UYU') {
    if (moeda === 'USD') return await getCotacaoBCU('USD', data)
    if (moeda === 'EUR') return await getCotacaoBCU('EUR', data)
    if (moeda === 'ARS') return await getCotacaoBCU('ARS', data)
    if (moeda === 'BRL') return await getCotacaoBCU('BRL', data)
    if (moeda === 'PYG') {
      // PYG/UYU = (USD/UYU via BCU) ÷ (USD/PYG via Frankfurter)
      const yyyy = data.getFullYear()
      const mm = String(data.getMonth() + 1).padStart(2, '0')
      const dd = String(data.getDate()).padStart(2, '0')
      const [usdUyu, resPYG] = await Promise.all([
        getCotacaoBCU('USD', data),
        fetch(`https://api.frankfurter.app/${yyyy}-${mm}-${dd}?from=USD&to=PYG`),
      ])
      if (!usdUyu || !resPYG.ok) return null
      const jsonPYG = await resPYG.json()
      const usdPyg = jsonPYG?.rates?.PYG
      if (!usdPyg) return null
      return usdUyu / usdPyg
    }
  }

  // Base USD — triangulação via BRL
  if (base === 'USD') {
    const [taxaEmBRL, usdBrl] = await Promise.all([
      resolverTaxa(moeda, 'BRL', data),
      getCotacaoPTAX('USD', data),
    ])
    if (!taxaEmBRL || !usdBrl) return null
    return taxaEmBRL / usdBrl
  }

  return null
}

// ─── Handler principal ────────────────────────────────────────────────────────

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

  const basesValidas = ['BRL', 'UYU', 'USD']
  if (!basesValidas.includes(base)) {
    return res.status(400).json({ error: `Base inválida. Use: ${basesValidas.join(', ')}` })
  }

  const dataOperacao = dataParam ? new Date(dataParam + 'T12:00:00') : new Date()
  const dataConsulta = getDiaAnterior(dataOperacao)

  try {
    const taxa = await resolverTaxa(moeda, base, dataConsulta)

    if (taxa === null) {
      return res.status(404).json({
        error: 'Cotação não encontrada. Pode ser feriado — tente o dia anterior.',
        dataConsulta: dataConsulta.toISOString().split('T')[0],
      })
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
