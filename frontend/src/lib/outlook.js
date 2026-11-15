// Prototype seasonal outlook: NASA POWER monthly normals plus a deterministic anomaly per province/season.
// Swap for a PAGASA / NASA seasonal forecast feed in production.
import { DS_MONTHS, MON } from '../mock/data'
import { tr } from './i18n'
import { rng } from './weather'

export function seasonOutlook(prov, clim, from = new Date()) {
  const m0 = from.getMonth()
  const dry = DS_MONTHS.includes(m0)
  const year = dry && m0 < 6 ? from.getFullYear() - 1 : from.getFullYear()
  const r = rng(`${prov}|${year}|${dry ? 'ds' : 'ws'}`)
  const rainPct = Math.round(-28 + r() * 40) // -28 … +12 %
  const dT = Math.round((0.2 + r() * 0.9) * 10) / 10 // +0.2 … +1.1 °C
  const months = [0, 1, 2, 3].map((i) => {
    const m = (m0 + i) % 12
    const wobble = 1 + rainPct / 100 + (r() - 0.5) * 0.12
    return { m, label: tr(MON[m]), normal: clim.P[m], expected: Math.max(0, Math.round(clim.P[m] * wobble)) }
  })
  const season = dry ? tr('This dry season') : tr('This wet season')
  const feel = rainPct <= -10 ? tr('drier') : rainPct >= 8 ? tr('wetter') : tr('about normal')
  let tip
  if (dry && rainPct <= -10) tip = tr('Save water: use AWD for palay, or plant mais or tabako that need less water.')
  else if (dry) tip = tr('Good water year for the dry season. Irrigated palay is a safe choice.')
  else if (rainPct >= 8) tip = tr('Expect flooding in low fields. Clear your drainage canals early.')
  else tip = tr('Normal rains expected. Plant on time with the first steady rains.')
  return { season, feel, rainPct, dT, months, tip }
}
