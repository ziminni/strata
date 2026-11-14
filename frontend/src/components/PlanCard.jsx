import { fmtD, MON, parseYmd } from '../lib/format'
import { GOALS } from '../lib/labels'
import { Pill } from './ui'

export function GoalBars({ r, cur }) {
  return (
    <div className="my-3 grid gap-1.5">
      {GOALS.map(([k, label, color]) => {
        const d = cur ? Math.round(r[k] - cur[k]) : 0
        return (
          <div key={k} className="grid grid-cols-[88px_1fr] items-center gap-x-2">
            <span className="text-[12px] text-muted">{label}</span>
            <b className="justify-self-end text-[12px]" style={{ color }}>
              {Math.round(r[k])}
              {cur && Math.abs(d) >= 1 && (
                <span className={`ml-1 rounded px-[5px] font-mono text-[11px] ${d > 0 ? 'bg-leaf-soft text-leaf-ink' : 'bg-danger-soft text-danger'}`}>
                  {d > 0 ? '+' : ''}{d}
                </span>
              )}
            </b>
            <div className="col-span-2 h-2 overflow-hidden rounded-full bg-surface2">
              <div className="h-full rounded-full" style={{ width: `${r[k]}%`, background: color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Jun→May strip of what grows in the field. `segs` have ISO date strings (reference year 2026). */
export function RotationStrip({ segs, crops }) {
  const parsed = segs.map((s) => ({ crop: s.crop, start: parseYmd(s.start), end: parseYmd(s.end) }))
  const cells = Array.from({ length: 12 }, (_, i) => {
    const m = (5 + i) % 12
    const mid = new Date(m >= 5 ? 2026 : 2027, m, 15)
    return { m, crop: parsed.find((s) => mid >= s.start && mid < s.end)?.crop ?? null }
  })
  const runs = []
  for (const c of cells) {
    const last = runs[runs.length - 1]
    if (last && last.crop === c.crop) last.n++
    else runs.push({ crop: c.crop, n: 1 })
  }
  return (
    <div>
      <div className="mt-2 mb-0.5 grid grid-cols-12 gap-[3px]">
        {runs.map((r, i) =>
          r.crop ? (
            <div key={i} className="flex h-[26px] items-center justify-center overflow-hidden rounded-lg text-[9.5px] font-bold whitespace-nowrap text-white" style={{ gridColumn: `span ${r.n}`, background: crops[r.crop].color }}>
              {r.n >= 2 ? crops[r.crop].fil : ''}
            </div>
          ) : (
            <div key={i} className="h-[26px] rounded-lg bg-[repeating-linear-gradient(-45deg,#e7ece7,#e7ece7_5px,#f3f6f3_5px,#f3f6f3_10px)]" style={{ gridColumn: `span ${r.n}` }} title="Bare field" />
          ),
        )}
      </div>
      <div className="grid grid-cols-12 gap-[3px] text-center font-mono text-[10px] text-muted">
        {cells.map((c, i) => <span key={i}>{MON[c.m][0]}</span>)}
      </div>
    </div>
  )
}

function Reasons({ items }) {
  return (
    <ul className="mt-2.5 list-disc pl-[18px] text-[13.5px]">
      {items.map((x, i) => <li key={i} className={`my-[3px] ${x.warn ? 'text-danger' : ''}`}>{x.text}</li>)}
    </ul>
  )
}

export function PlanCard({ r, cur, rank, adopted, crops, onAdopt, onExplain }) {
  const best = rank === 0
  return (
    <div className={`card mb-3.5 ${best ? 'shadow-[0_0_0_2px_var(--color-leaf),var(--shadow-card)]' : ''}`}>
      <div className="flex flex-wrap justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Pill tone={best ? 'ok' : undefined}>#{rank + 1}{best && ' · best fit'}</Pill>
          {adopted && <> <Pill tone="blue">In your calendar</Pill></>}
          <h3 className="my-0.5 text-[18px] font-bold">{r.name}</h3>
          <div className="note">
            {r.segs.slice(1).map((s) => `${crops[s.crop].fil} ${fmtD(parseYmd(s.start))}–${fmtD(parseYmd(s.end))}`).join(' · ')}
          </div>
        </div>
        <div className="text-right font-display text-[30px] leading-none font-extrabold text-leaf tabular-nums">
          {Math.round(r.total)}
          <small className="block font-sans text-[11px] font-medium text-muted">
            fit score · {r.total >= cur.total ? '+' : ''}{Math.round(r.total - cur.total)} vs now
          </small>
        </div>
      </div>
      <GoalBars r={r} cur={cur} />
      <RotationStrip segs={r.segs} crops={crops} />
      <Reasons items={r.reasons} />
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button type="button" className={`btn btn-sm ${adopted ? '' : 'btn-pri'}`} onClick={onAdopt}>{adopted ? 'Using this plan' : 'Use this plan'}</button>
        <button type="button" className="btn btn-sm" onClick={onExplain}>Explain in Filipino</button>
      </div>
    </div>
  )
}

export function CurrentPlanCard({ cur, crops }) {
  return (
    <div className="card mb-3.5 border-[1.5px] border-dashed border-[#cfd8cf] bg-surface2 shadow-none">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <Pill>Now</Pill>
          <h3 className="my-0.5 text-[18px] font-bold">{cur.name}</h3>
        </div>
        <div className="text-right font-display text-[30px] leading-none font-extrabold text-muted tabular-nums">
          {Math.round(cur.total)}
          <small className="block font-sans text-[11px] font-medium">fit score</small>
        </div>
      </div>
      <GoalBars r={cur} />
      <RotationStrip segs={cur.segs} crops={crops} />
      <Reasons items={cur.reasons} />
    </div>
  )
}
