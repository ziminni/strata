// Climate + rotation scoring, run in the browser. Mirrors backend/app/engine/*.py so
// responses have the same shape as the FastAPI endpoints.
import { BASE, CROPS, DS_MONTHS, MON, PLANS, PROV, SCEN, WS } from './data'

const IRRIGATION_MM = { canal: 900, limited: 350, rainfed: 0 }
const REFERENCE_YEAR = 2026 // wet season used when scoring plans

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)
const uniq = (a) => [...new Set(a)]
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const monthAt = (start, k) => addDays(start, k).getMonth()
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/* ---------- climate ---------- */
export function climate(prov, scen = 'now') {
  const p = PROV[prov] || PROV['Nueva Ecija']
  const s = SCEN[scen]
  const T = BASE.T.map((t) => t + p.dt + s.dT)
  const X = BASE.X.map((t) => t + p.dt + s.dT * 1.1)
  const P = BASE.P.map((r, i) => {
    const dry = DS_MONTHS.includes(i)
    let v = r * (dry ? p.ds : p.ws)
    if (prov === 'Aurora' && [9, 10, 11, 0, 1].includes(i)) v = r * p.ds + 120
    return Math.round(v * (1 + (dry ? s.dsP : s.wsP) / 100))
  })
  return { T, X, P }
}

export function climSummary(prov, scen = 'now') {
  const c = climate(prov, scen)
  const hot = Math.max(...c.X)
  const onset = c.P.findIndex((v, i) => i >= 3 && v >= 150)
  return {
    ann: c.P.reduce((a, b) => a + b, 0),
    ds: DS_MONTHS.reduce((a, i) => a + c.P[i], 0),
    dry: c.P.filter((v) => v < 60).length,
    hot,
    hot_month: MON[c.X.indexOf(hot)],
    onset: onset >= 0 ? MON[onset] : '—',
    series: c,
  }
}

/* ---------- rotation ---------- */
export function buildSegs(plan, year) {
  const segs = [{ crop: WS.crop, start: new Date(year, WS.m, WS.d) }]
  for (const [crop, m, d] of plan.segs) {
    if (crop === 'fallow') continue
    segs.push({ crop, start: new Date(m >= WS.m ? year : year + 1, m, d) })
  }
  for (const s of segs) s.end = addDays(s.start, CROPS[s.crop].days)
  return segs
}

export function currentPlan(farm) {
  const dry = farm.dry
  return {
    id: 'current',
    name: 'Your current practice: Palay → ' + (dry === 'fallow' ? 'fallow' : CROPS[dry].fil),
    segs: dry === 'fallow' ? [] : [[dry, dry === 'rice' ? 11 : 10, dry === 'rice' ? 1 : 15]],
    current: true,
  }
}

export function activePlan(farm) {
  return (farm.adopted && PLANS.find((p) => p.id === farm.adopted)) || currentPlan(farm)
}

function evalCrop(farm, crop, start, clim) {
  const c = CROPS[crop]
  const months = []
  for (let k = 0; k < c.days; k += 10) months.push(monthAt(start, k))
  const rain = uniq(months).reduce((a, m) => a + clim.P[m] * 0.7 * (months.filter((x) => x === m).length / 3), 0)
  const need = c.water
  const deficit = Math.max(0, need - rain)
  // flowering window: 55–75% of the cycle
  const fl = []
  for (let k = Math.floor(c.days * 0.55); k < c.days * 0.75; k += 7) fl.push(monthAt(start, k))
  const peak = Math.max(...fl.map((m) => clim.X[m]))
  let heat = 1
  if (peak > 33.5) heat = Math.max(0.35, 1 - (peak - 33.5) * 0.09 * (5.5 - c.heat) / 4)
  let soil = 1
  if (c.upland && farm.drain === 'poor') soil *= 0.72
  else if (c.upland && farm.drain === 'mod' && farm.tex === 'clay') soil *= 0.85
  if (c.upland && farm.tex === 'sandy' && !['mani', 'kamote', 'pakwan'].includes(crop)) soil *= 0.92
  if (farm.ph < c.ph[0]) soil *= Math.max(0.6, 1 - (c.ph[0] - farm.ph) * 0.25)
  if (farm.ph > c.ph[1]) soil *= Math.max(0.7, 1 - (farm.ph - c.ph[1]) * 0.2)
  if (crop === 'bawang' && farm.prov !== 'Aurora') soil *= 0.8 // garlic prefers cooler, drier Ilocos nights
  return { crop, need, rain, deficit, heat, soil, peak }
}

export function evaluatePlan(farm, plan, scen) {
  const clim = climate(farm.prov, scen)
  const segs = buildSegs(plan, REFERENCE_YEAR)
  let avail = IRRIGATION_MM[farm.water]
  const ds = segs.slice(1).map((s) => evalCrop(farm, s.crop, s.start, clim))
  let irrig = 0, short = 0
  for (const e of ds) {
    const use = Math.min(e.deficit, avail)
    avail -= use
    irrig += use
    e.short = e.deficit - use
    short += e.short
    const c = CROPS[e.crop]
    e.water = e.deficit > 0 ? Math.max(0, 1 - (e.short / e.need) * (1.25 - 0.18 * c.drought)) : 1
    e.suit = Math.max(0, e.water * e.heat * e.soil)
  }
  const crops = segs.map((s) => s.crop)
  const cover = new Set()
  for (const s of segs) for (let k = 0; k < CROPS[s.crop].days; k += 5) cover.add(monthAt(s.start, k))
  const covered = cover.size
  const legume = crops.some((c) => CROPS[c].legume)
  const gm = crops.includes('sesbania')
  const fams = new Set(crops.map((c) => CROPS[c].fam)).size
  const contRice = crops.filter((c) => c === 'rice' || c === 'awd').length >= 2
  const isCurrent = !!plan.current
  const straw = isCurrent ? farm.straw : 'incorporate'

  let soil = 18 + (legume ? 14 : 0) + (gm ? 10 : 0) + (straw === 'incorporate' ? 8 : straw === 'remove' ? 2 : -6) + covered * 2.3 + (fams - 1) * 7 - (contRice ? 12 : 0)
  if (farm.om < 1.5 && legume) soil += 4
  soil = clamp(soil)
  const needAll = ds.reduce((a, e) => a + e.need, 0) || 1
  const water = clamp(100 * (1 - irrig / 1050) - 60 * (short / needAll))
  const inc = clamp(((3 + ds.reduce((a, e) => a + CROPS[e.crop].value * e.suit * (CROPS[e.crop].cover ? 0 : 1), 0) - (gm ? 0.25 : 0) + (legume && !isCurrent ? 0.2 : 0)) / 10) * 100)

  // resilience: suitability kept under the worst scenario + tolerance + diversity
  const worst = climate(farm.prov, 'ssp585')
  const irrAll = IRRIGATION_MM[farm.water]
  const kept = avg(segs.slice(1).map((s) => {
    const e = evalCrop(farm, s.crop, s.start, worst)
    return e.heat * e.soil * (e.deficit > 0 ? Math.max(0, 1 - Math.max(0, e.deficit - irrAll) / e.need) : 1)
  })) || 0.5
  const tol = avg(ds.map((e) => (CROPS[e.crop].drought + CROPS[e.crop].heat) / 10)) || 0.4
  const res = clamp(100 * (0.42 * kept + 0.3 * tol + 0.28 * Math.min(1, (fams - 1) / 2)))

  const maxCap = Math.max(...ds.map((e) => CROPS[e.crop].capital), 2)
  const maxLab = Math.max(...ds.map((e) => CROPS[e.crop].labor), 2)
  const simp = clamp(100 - Math.max(0, maxCap - farm.budget) * 16 - Math.max(0, maxLab - farm.labor) * 13 - (segs.length - 1) * 7 - maxCap * 3)

  const W = farm.w
  const wsum = W.soil + W.water + W.inc + W.res + W.simp || 1
  const total = (soil * W.soil + water * W.water + inc * W.inc + res * W.res + simp * W.simp) / wsum
  return { plan, segs, ds, soil, water, inc, res, simp, total, irrig, short, covered, bare: 12 - covered, legume, gm, fams, straw }
}

function reasons(farm, r, cur) {
  const out = []
  const ok = (text) => out.push({ text, warn: false })
  const warn = (text) => out.push({ text, warn: true })
  if (r.legume) ok(`Adds nitrogen to your soil with ${uniq(r.segs.filter((s) => CROPS[s.crop].legume).map((s) => CROPS[s.crop].fil)).join(' and ')}, so your next palay needs less fertilizer.`)
  if (r.gm) ok('Sesbania green manure is plowed in before wet-season palay, which feeds the soil and adds organic matter.')
  ok(`Living roots cover the field ${r.covered} of 12 months${r.bare >= 3 ? ` (bare for about ${r.bare} months)` : ''}.`)
  if (r.straw === 'incorporate' && cur && farm.straw !== 'incorporate') ok('Plow the rice straw back in instead of burning it: it returns nutrients and organic matter.')
  if (r.irrig > 0) {
    const cmp = cur ? (cur.irrig - r.irrig > 0 ? ` (${Math.round(cur.irrig - r.irrig)} mm less than now)` : ' (similar to now)') : ''
    ok(`Needs about ${Math.round(r.irrig)} mm of irrigation in the dry season${cmp}.`)
  } else ok('Grows on leftover soil moisture and dry-season rain alone, so no irrigation is needed.')
  for (const e of r.ds) {
    const fil = CROPS[e.crop].fil
    if (e.short > 40) warn(`${fil}: about ${Math.round(e.short)} mm short of water with your irrigation, which is a yield risk.`)
    if (e.heat < 0.85) warn(`${fil} flowers when afternoons reach about ${Math.round(e.peak)} °C: heat stress risk; plant early.`)
    if (e.soil < 0.85) warn(`${fil} prefers well-drained soil or a different pH than yours; use raised beds or lime as needed.`)
  }
  if (Math.max(...r.ds.map((e) => CROPS[e.crop].capital), 0) > farm.budget) warn('Needs more capital than your budget setting. Ask about DA or Landbank production loans.')
  return out.slice(0, 7)
}

export const segView = (s) => ({ crop: s.crop, start: iso(s.start), end: iso(s.end) })

function planView(farm, r, cur) {
  const p = r.plan
  return {
    id: p.id, name: p.name, current: !!p.current,
    total: r.total, soil: r.soil, water: r.water, inc: r.inc, res: r.res, simp: r.simp,
    irrig: r.irrig, short: r.short, covered: r.covered, bare: r.bare, legume: r.legume, gm: r.gm,
    segs: r.segs.map(segView),
    ds: r.ds.map(({ crop, heat, soil, short, suit, peak }) => ({ crop, heat, soil, short, suit, peak })),
    reasons: reasons(farm, r, cur),
  }
}

export function rankedView(farm, scen) {
  const cur = evaluatePlan(farm, currentPlan(farm), scen)
  const ranked = PLANS.map((p) => evaluatePlan(farm, p, scen)).sort((a, b) => b.total - a.total)
  return { scenario: scen, current: planView(farm, cur), plans: ranked.map((r) => planView(farm, r, cur)) }
}
