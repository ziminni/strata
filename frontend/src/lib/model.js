// STRATA crop model — POST {MODEL_BASE_URL}/api/v1/prescribe (proxied by Vite at /model, see vite.config.js).
// In:  crop + planting window + GPS (+ optional soil pH, irrigation, drainage)
// Out: planting_likelihood (high|moderate|low), climate_compatible_score (0–1), most_compatible_date, telemetry
// The full response is ~130 KB (per-year history); slim() keeps only what the app shows.
import { addDays, parseYmd, ymd } from './format'

const MODEL_API = import.meta.env.VITE_MODEL_API || '/model'
const TIMEOUT_MS = 60e3 // the model takes ~20 s
const SEARCH_DAYS = 60 // look this far past the chosen start date for a better one

const CROP = { rice: 'rice', mais: 'corn', tabako: 'tobacco' }
const IRRIGATION = { canal: 'irrigated', rainfed: 'rainfed', limited: 'unknown' }
const DRAINAGE = { good: 'well', mod: 'moderate', poor: 'poor' }
export const LIKELIHOOD_TIER = { high: 'recommended', moderate: 'possible', low: 'not_recommended' }
export const LIKELIHOOD_VERDICT = { high: 'good', moderate: 'okay', low: 'poor' }
/** Plain-language reason lines ({text, warn}) from the model's score breakdown. */
export function modelReasons(m) {
  const out = []
  const where = m.station ? ` around ${m.station}` : ''
  if (m.window_temp_score != null)
    out.push(m.window_temp_score >= 80
      ? { text: `Temperatures in this window suit the crop well (${Math.round(m.window_temp_score)}/100)${where}.`, warn: false }
      : { text: `Temperatures in this window are not ideal (${Math.round(m.window_temp_score)}/100)${where}.`, warn: true })
  if (m.dry_spell_days != null && m.dry_spell_days >= 10) out.push({ text: `Expect dry spells of about ${Math.round(m.dry_spell_days)} days. Plan your water.`, warn: true })
  if (m.heavy_rain_days != null && m.heavy_rain_days >= 5) out.push({ text: `About ${Math.round(m.heavy_rain_days)} heavy-rain days are usual in this window. Keep drains clear.`, warn: true })
  if (m.heat_days != null && m.heat_days >= 3) out.push({ text: `About ${Math.round(m.heat_days)} very hot days (over 36°C) are usual in this window.`, warn: true })
  if (m.ph_score != null && m.ph_score < 60) out.push({ text: `Your soil pH is not ideal for this crop (${Math.round(m.ph_score)}/100).`, warn: true })
  else if (m.ph_score != null && m.ph_score >= 90) out.push({ text: 'Your soil pH suits this crop.', warn: false })
  return out
}


/** Keep the parts the app uses. */
function slim(r) {
  const b = r.telemetry?.score_breakdown || {}
  return {
    likelihood: r.planting_likelihood,
    score: Math.round(r.climate_compatible_score * 100),
    best_date: r.most_compatible_date,
    scientific_name: r.scientific_name,
    station: r.telemetry?.reference_station?.name ?? null,
    window_temp_score: b.window_temperature_compatibility_score ?? null,
    climate_score: b.annual_climate_baseline_score ?? null,
    dry_spell_days: b.dry_spell_days ?? null,
    heavy_rain_days: b.heavy_rain_days ?? null,
    heat_days: b.heat_exceedance_days ?? null,
    ph_score: r.telemetry?.measured_soil_ph_compatibility_score ?? null,
    years: r.telemetry?.reference_station?.reference_years ?? null, // [first, last]
    cycle_days: r.telemetry?.requested_window?.model_cycle_days ?? null,
    // past weather for the 120-day season starting on the best date (same calendar date, earlier years)
    // the model's candidate days, ranked the way it picks the best one (highest temperature fit); top 5 kept
    window_days: (r.telemetry?.future_planting_date_historical_analogues || []).length || null,
    top_days: [...(r.telemetry?.future_planting_date_historical_analogues || [])]
      .sort((a, b) => b.historical_temperature_compatibility - a.historical_temperature_compatibility)
      .slice(0, 5)
      .map((a) => ({ date: a.proposed_planting_date, temp: a.historical_temperature_compatibility, rain_mm: a.historical_window_rain_mm, dry_spell: a.historical_max_dry_spell_days, hot_days: a.historical_days_tmax_over_36c })),
    best_analogue: (() => {
      const a = (r.telemetry?.future_planting_date_historical_analogues || []).find((x) => x.proposed_planting_date === r.most_compatible_date)
      return a ? { temp: a.historical_temperature_compatibility, rain_mm: a.historical_window_rain_mm, dry_spell: a.historical_max_dry_spell_days, hot_days: a.historical_days_tmax_over_36c } : null
    })(),
    version: r.telemetry?.model_version ?? null,
  }
}

/**
 * Ask the model about one crop. `planted` = 'YYYY-MM-DD'; `farm` supplies pH / water / drainage.
 * Resolves to the slim result, or throws (network, timeout, 422).
 */
export async function prescribe({ crop, planted, end, lat, lon, farm = {}, days = SEARCH_DAYS }) {
  if (!CROP[crop]) throw new Error(`Model has no crop "${crop}"`)
  const body = {
    crop: CROP[crop],
    time_start: planted,
    time_end: end && end > planted ? end : ymd(addDays(parseYmd(planted), days)), // farmer's range, else start + days
    lat,
    long: lon,
    soil_ph: Number.isFinite(+farm.ph) ? +farm.ph : null,
    irrigation: IRRIGATION[farm.water] || 'unknown',
    soil_drainage: DRAINAGE[farm.drain] || 'unknown',
  }
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${MODEL_API}/api/v1/prescribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctl.signal,
    })
    if (!res.ok) throw new Error(`Model request failed (${res.status})`)
    return slim(await res.json())
  } finally {
    clearTimeout(t)
  }
}

export const MODEL_CROPS = Object.keys(CROP)

const cache = new Map() // same question → same answer for this session (the model is deterministic)

/** prescribe() with a session cache, so re-renders and revisits don't re-run the ~20 s model. */
export function prescribeCached(args) {
  const { crop, planted, lat, lon, farm = {}, days = SEARCH_DAYS } = args
  const key = [crop, planted, days, (+lat).toFixed(3), (+lon).toFixed(3), farm.ph, farm.water, farm.drain].join('|')
  if (!cache.has(key)) cache.set(key, prescribe(args).catch((e) => { cache.delete(key); throw e }))
  return cache.get(key)
}
