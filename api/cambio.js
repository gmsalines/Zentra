// api/cambio.js

const MOEDAS = {
  USD: 'Dólar Americano',
  EUR: 'Euro',
  BRL: 'Real Brasileiro',
  UYU: 'Peso Uruguaio',
  ARS: 'Peso Argentino',
  PYG: 'Guarani Paraguaio',
}

// Códigos BCU: https://cotizaciones.bcu.gub.uy
const CODIGOS_BCU = { USD: 2225, EUR: 1111, ARS: 2109, BRL: 1500 }

// ─── Utilitários de data ──────────────────────────────────────────────────────

function formatBCB(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${mm}-${dd}-${date.getFullYear()}`
}

function formatISO(date) {
  return date.toISOString().split('T')[0]
}

function getDiaAnterior(date) {
  const d = new Date(date)
  d.setDate(d.getDate() - 1)
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() - 1)
  }
  return d
}

// ─── BCB PTAX ────────────────────────────────────────────────────────────────

async function getCotacaoPTAX(moeda, data) {
  const dataStr = formatBCB(data)
  const url = moeda === 'USD'
    ? `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@d)?@d='${dataStr}'&$top=1&$orderby=dataHoraCotacao%20desc&$format=json&$select=cotacaoVenda`
    : `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@m,dataCotacao=@d)?@m='${moeda}'&@d='${dataStr}'&$top=1&$orderby=dataHoraCotacao%20desc&$format=json&$select=cotacaoVenda`
  const res = await fetch(url)
  const json = await res.json()
  return json?.value?.[0]?.cotacaoVenda ?? null
}

// ─── BCU SOAP (formato correto conforme WSDL) ─────────────────────────────────

async function getCotacaoBCU(moedaCodigo, data) {
  const codigo = CODIGOS_BCU[moedaCodigo] ?? moedaCodigo
  const dataISO = formatISO(data)

  const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="Cotiza">
  <soap:Body>
    <tns:wsbcucotizaciones.Execute>
      <tns:Entrada>
        <tns:Moneda>
          <tns:item>${codigo}</tns:item>
        </tns:Moneda>
        <tns:FechaDesde>${dataISO}</tns:FechaDesde>
        <tns:FechaHasta>${dataISO}</tns:FechaHasta>
        <tns:Grupo>0</tns:Grupo>
      </tns:Entrada>
    </tns:wsbcucotizaciones.Execute>
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

// ─── BNA — ARS via triangulação USD ──────────────────────────────────────────

async function getCotacaoARS_BRL(data) {
  const yyyy = data.getFullYear()
  const mm = String(data.getMonth() + 1).padStart(2, '0')
  const dd = String(data.getDate()).padStart(2, '0')
  const [resBNA, usdBrl] = await Promise.all([
    fetch(`https://api.argentinadatos.com/v1/cotizaciones/dolares/oficial/${yyyy}/${mm}/${dd}`),
    getCotacaoPTAX('USD', data),
  ])
  if (!resBNA.ok) return null
  const jsonBNA = await resBNA.json()
  const usdArs = jsonBNA?.venta
  if (!usdArs || !usdBrl) return null
  return usdBrl / usdArs
}

// ─── PYG via Frankfurter ──────────────────────────────────────────────────────

async function getCotacaoPYG_BRL(data) {
  const dataISO = formatISO(data)
  const [resPYG, usdBrl] = await Promise.all([
    fetch(`https://api.frankfurter.app/${dataISO}?from=USD&to=PYG`),
    getCotacaoPTAX('USD', data),
  ])
  if (!resPYG.ok) return null
  const jsonPYG = await resPYG.json()
  const usdPyg = jsonPYG?.rates?.PYG
  if (!usdPyg || !usdBrl) return null
  return usdBrl / usdPyg
}

// ─── Resolver taxa por par moeda/base ────────────────────────────────────────

async function resolverTaxa(moeda, base, data) {
  if (moeda === base) return { taxa: 1, triangulado: false, pivot: null }

  const r = (taxa, triangulado = false, pivot = null) => ({ taxa, triangulado, pivot })

  // Base BRL
  if (base === 'BRL') {
    if (moeda === 'USD') return r(await getCotacaoPTAX('USD', data))
    if (moeda === 'EUR') return r(await getCotacaoPTAX('EUR', data))
    if (moeda === 'ARS') return r(await getCotacaoARS_BRL(data), true, 'USD via BNA + BCB PTAX')
    if (moeda === 'PYG') return r(await getCotacaoPYG_BRL(data), true, 'USD via Frankfurter + BCB PTAX')
    if (moeda === 'UYU') {
      const [usdBrl, usdUyu] = await Promise.all([
        getCotacaoPTAX('USD', data),
        getCotacaoBCU('USD', data),
      ])
      if (!usdBrl || !usdUyu) return r(null)
      return r(usdBrl / usdUyu, true, 'USD via BCB PTAX + BCU')
    }
  }

  // Base UYU
  if (base === 'UYU') {
    if (moeda === 'USD') return r(await getCotacaoBCU('USD', data))
    if (moeda === 'EUR') return r(await getCotacaoBCU('EUR', data))
    if (moeda === 'ARS') return r(await getCotacaoBCU('ARS', data))
    if (moeda === 'BRL') {
      const [usdUyu, usdBrl] = await Promise.all([
        getCotacaoBCU('USD', data),
        getCotacaoPTAX('USD', data),
      ])
      if (!usdUyu || !usdBrl) return r(null)
      return r(usdUyu / usdBrl, true, 'USD via BCU + BCB PTAX')
    }
    if (moeda === 'PYG') {
      const dataISO = formatISO(data)
      const [usdUyu, resPYG] = await Promise.all([
        getCotacaoBCU('USD', data),
        fetch(`https://api.frankfurter.app/${dataISO}?from=USD&to=PYG`),
      ])
      if (!usdUyu || !resPYG.ok) return r(null)
      const usdPyg = (await resPYG.json())?.rates?.PYG
      if (!usdPyg) return r(null)
      return r(usdUyu / usdPyg, true, 'USD via BCU + Frankfurter')
    }
  }

  // Base USD
  if (base === 'USD') {
    const [res, usdBrl] = await Promise.all([
      resolverTaxa(moeda, 'BRL', data),
      getCotacaoPTAX('USD', data),
    ])
    if (!res?.taxa || !usdBrl) return r(null)
    return r(res.taxa / usdBrl, true, `USD via BCB PTAX`)
  }

  return r(null)
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

  if (!['BRL', 'UYU', 'USD'].includes(base)) {
    return res.status(400).json({ error: 'Base inválida. Use: BRL, UYU ou USD.' })
  }

  const dataOperacao = dataParam ? new Date(dataParam + 'T12:00:00') : new Date()
  const dataConsulta = getDiaAnterior(dataOperacao)

  try {
    const resultado = await resolverTaxa(moeda, base, dataConsulta)

    if (!resultado?.taxa) {
      return res.status(404).json({
        error: 'Cotação não encontrada. Pode ser feriado — tente o dia anterior.',
        dataConsulta: dataConsulta.toISOString().split('T')[0],
      })
    }

    return res.status(200).json({
      moeda,
      moedaLabel: MOEDAS[moeda],
      base,
      taxa: Number(resultado.taxa.toFixed(8)),
      dataConsulta: dataConsulta.toISOString().split('T')[0],
      triangulado: resultado.triangulado,
      ...(resultado.triangulado && { aviso: `Taxa calculada via arbitragem (pivot: ${resultado.pivot}). Não é cotação direta oficial.` }),
    })

  } catch (err) {
    console.error('[cambio]', err)
    return res.status(500).json({ error: 'Erro ao consultar câmbio.' })
  }
}
