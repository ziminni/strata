import { useState } from 'react'
import { fmtD, parseYmd } from '../lib/format'
import { Icon } from './Icon'

// STRATA crop model result (see src/lib/model.js): planting likelihood, climate score, best planting date.
const LIKELIHOOD = {
  high: { label: 'High', pill: 'bg-leaf-soft text-leaf-ink', bar: 'bg-leaf' },
  moderate: { label: 'Moderate', pill: 'bg-sun-soft text-sun-ink', bar: 'bg-sun' },
  low: { label: 'Low', pill: 'bg-danger-soft text-danger', bar: 'bg-danger' },
}

const n0 = (x) => Math.round(x)
const yrs = (m) => (m.years ? `${m.years[0]}–${m.years[1]}` : 'the past 10 years')
const at = (m) => (m.station ? ` at ${m.station}` : '')

/** One short "why" per row, only from numbers the model returned. */
function whyLikelihood(m, crop) {
  const parts = []
  if (m.window_temp_score != null) parts.push(`temperature fit ${n0(m.window_temp_score)}/100`)
  if (m.climate_score != null) parts.push(`yearly climate ${n0(m.climate_score)}/100`)
  if (m.dry_spell_days != null) parts.push(`dry spells ~${n0(m.dry_spell_days)} days`)
  if (m.heavy_rain_days != null) parts.push(`${n0(m.heavy_rain_days)} heavy-rain days`)
  if (m.heat_days != null) parts.push(`${n0(m.heat_days)} days over 36°C`)
  const lead = { high: `${crop} usually does well here in this window.`, moderate: `${crop} can grow here, with some risk.`, low: `${crop} often struggles here in this window.` }[m.likelihood] || ''
  return `${lead} Past seasons (${yrs(m)}): ${parts.join(', ')}.`
}

function whyScore(m, crop) {
  const temp = m.window_temp_score != null ? ` Temperatures fit well (${n0(m.window_temp_score)}/100)` : ''
  const year = m.climate_score != null ? `${temp ? ';' : ' Yearly'} rain and heat score ${n0(m.climate_score)}/100.` : temp ? '.' : ''
  return `How well the climate${at(m)} suits ${crop}, from 0 (poor) to 1 (ideal), using NASA weather from ${yrs(m)}.${temp}${year}`
}

function whyDate(m, planted) {
  const a = m.best_analogue
  const past = a ? ` In past years, seasons starting then had ~${n0(a.rain_mm)} mm of rain, dry spells of ~${n0(a.dry_spell)} days and ${n0(a.hot_days)} days over 36°C.` : ''
  const span = m.window_days ? `${m.window_days} days` : 'days the model checked'
  if (planted && m.best_date === planted) return `Your start date is already the best of the ${span} from it, based on ${yrs(m)}.${past}`
  return `Of the ${span} from ${planted ? fmtD(parseYmd(planted)) : 'your start date'}, this day had the best temperature fit in ${yrs(m)}.${past}`
}

/** Top planting days the model checked (best first). Shown in the "Analysis complete" popup. */
export function BestDays({ m }) {
  if (!m.top_days?.length) return null
  return (
    <div className="mt-4 text-left">
      <h3 className="mb-2 text-[14px] font-extrabold">Best days to plant</h3>
      <ol className="m-0 list-none space-y-1.5 p-0">
        {m.top_days.slice(0, 3).map((d, i) => (
          <li key={d.date} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${i === 0 ? 'bg-leaf-soft' : 'bg-surface2'}`}>
            <span className={`font-display text-[15px] font-extrabold ${i === 0 ? 'text-leaf-ink' : ''}`}>{fmtD(parseYmd(d.date))}{i === 0 && <span className="ml-1.5 text-[11.5px] font-bold">Best</span>}</span>
            <span className="text-[12.5px] text-muted tabular-nums">~{n0(d.rain_mm)} mm rain · dry spells ~{n0(d.dry_spell)} d</span>
          </li>
        ))}
      </ol>
      <p className="mt-1.5 mb-0 text-[11.5px] text-muted">Ranked by temperature fit in {yrs(m)}. Rain and dry spells are for the {m.cycle_days || 120}-day season after each date.</p>
    </div>
  )
}

function Row({ label, why, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-line py-3.5 text-left first:border-t-0 first:pt-0 last:pb-0">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 text-left">
        <span className="text-[14px] font-semibold text-muted">{label}</span>
        <span className="flex items-center gap-2">
          <span className="text-right">{children}</span>
          <span className={`flex-none text-muted transition-transform duration-300 [&_.ic]:size-[18px] ${open ? 'rotate-180' : ''}`} aria-hidden="true">
            <Icon name="chevronDown" />
          </span>
          <span className="sr-only">{open ? 'Hide why' : 'Why?'}</span>
        </span>
      </button>
      {/* smooth height: grid rows 0fr → 1fr */}
      <div className="grid transition-[grid-template-rows] duration-300" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          <p className="mt-2 mb-0 rounded-xl bg-surface2 px-3 py-2 text-[13.5px] leading-[1.45] text-ink-soft">{why}</p>
        </div>
      </div>
    </div>
  )
}

/** The three model numbers as rows, each with a "why" arrow. `m` = plot.model, `crop` = display name, `planted` = 'YYYY-MM-DD'. */
export default function ModelResult({ m, crop = 'This crop', planted }) {
  const l = LIKELIHOOD[m.likelihood] || LIKELIHOOD.moderate
  return (
    <div>
      <Row label="Planting likelihood" why={whyLikelihood(m, crop)}>
        <span className={`inline-block rounded-full px-3 py-1 text-[14px] font-extrabold ${l.pill}`}>{l.label}</span>
      </Row>
      <Row label="Climate compatibility score" why={whyScore(m, crop)}>
        <span className="block font-display text-[22px] leading-none font-extrabold tabular-nums">{(m.score / 100).toFixed(2)}</span>
        <span className="mt-1.5 ml-auto block h-1.5 w-28 overflow-hidden rounded-full bg-line" role="meter" aria-label="Climate compatibility score" aria-valuenow={m.score} aria-valuemin={0} aria-valuemax={100}>
          <i className={`block h-full rounded-full ${l.bar}`} style={{ width: `${m.score}%` }} />
        </span>
      </Row>
      <Row label="Most compatible date to plant" why={whyDate(m, planted)}>
        <span className="font-display text-[19px] font-extrabold">{fmtD(parseYmd(m.best_date))}</span>
      </Row>
    </div>
  )
}
