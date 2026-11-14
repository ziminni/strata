import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { MoreLink, Pill, Section } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { addDays, fmtD, ymd } from '../../lib/format'
import { PHASE_LEGEND, stateOn, taskText, upcoming } from '../../lib/season'

function CycleRing({ st, crops }) {
  const n = crops[st.seg.crop].days
  const C = 2 * Math.PI * 62
  const fl = Math.round(n * 0.55) - st.day
  const hv = Math.round(n * 0.92) - st.day
  return (
    <>
      <div className="relative mx-auto my-1.5 size-[150px]">
        <svg viewBox="0 0 150 150" className="size-full">
          <circle cx="75" cy="75" r="62" fill="none" stroke="var(--color-surface2)" strokeWidth="12" />
          <circle cx="75" cy="75" r="62" fill="none" stroke={st.color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(C * st.day) / n} ${C}`} transform="rotate(-90 75 75)" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="note">Day</span>
          <b className="font-display text-[28px] leading-none font-bold">{st.day}</b>
          <span className="note">of {n}</span>
        </div>
      </div>
      <p className="m-0 text-center">
        <b>{crops[st.seg.crop].fil}</b> · <Pill style={{ background: st.color, color: '#fff' }}>{st.phase}</Pill>
      </p>
      <ul className="mt-2">
        {st.seg.crop !== 'sesbania' && fl > 0 && <TaskRow d={`${fl} days`}>until flowering</TaskRow>}
        {hv > 0 ? (
          <TaskRow d={`${hv} days`}>until the harvest window opens ({fmtD(addDays(st.seg.start, Math.round(n * 0.92)))})</TaskRow>
        ) : (
          <TaskRow d="Now">Harvest window is open</TaskRow>
        )}
      </ul>
    </>
  )
}

function TaskRow({ d, children }) {
  return (
    <li className="flex items-start gap-2.5 border-b border-dashed border-line py-2.5 last:border-0">
      <span className="h-fit min-w-[58px] flex-none rounded-lg bg-surface2 px-[7px] py-0.5 text-center font-mono text-[11px] whitespace-nowrap text-muted tabular-nums">{d}</span>
      <span>{children}</span>
    </li>
  )
}

function Calendar() {
  const { season, crops, logs, openLog } = useApp()
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const logCount = useMemo(() => logs.reduce((m, l) => m.set(l.date, (m.get(l.date) || 0) + 1), new Map()), [logs])
  const today = new Date()
  const start = addDays(month, -month.getDay())
  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i)
    if (i >= 35 && d.getMonth() !== month.getMonth()) break
    cells.push(d)
  }
  const shift = (n) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))

  return (
    <>
      <p className="note my-2">
        Following: <b>{season.plan.name}</b>
        {!season.plan.adopted && ' (your current practice; tap "Use this plan" below to switch)'} · Tap a day to log what happened.
      </p>
      <div className="my-1.5 flex items-center gap-1.5">
        <button type="button" className="btn btn-sm" onClick={() => shift(-1)} aria-label="Previous month">←</button>
        <h3 className="m-0 flex-1 text-center text-[15px] font-semibold">{month.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}</h3>
        <button type="button" className="btn btn-sm" onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</button>
        <button type="button" className="btn btn-sm" onClick={() => shift(1)} aria-label="Next month">→</button>
      </div>
      <div className="grid grid-cols-7 gap-[3px]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-1 text-center font-mono text-[10px] text-muted">{d}</div>
        ))}
        {cells.map((d) => {
          const st = stateOn(season.segs, crops, d)
          const n = logCount.get(ymd(d)) || 0
          const isToday = d.toDateString() === today.toDateString()
          return (
            <button
              key={d.getTime()}
              type="button"
              onClick={() => openLog(d)}
              aria-label={`Log for ${d.toDateString()}`}
              className={`relative flex min-h-11 flex-col gap-[3px] rounded-[10px] px-1 py-[3px] text-left ${isToday ? 'bg-white ring-2 ring-leaf' : 'bg-surface2'} ${d.getMonth() !== month.getMonth() ? 'opacity-40' : ''}`}
            >
              <span className="font-mono text-[11px]">{d.getDate()}</span>
              {st && <span className="h-[5px] rounded-[3px]" style={{ background: st.color }} />}
              {n > 0 && (
                <span className="absolute top-1.5 right-1.5 flex gap-0.5">
                  {Array.from({ length: Math.min(n, 3) }, (_, i) => <i key={i} className="size-[7px] rounded-full bg-sun" />)}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-2.5 text-[11.5px] text-muted">
        {PHASE_LEGEND.map(([l, c]) => (
          <span key={l} className="inline-flex items-center gap-1"><i className="inline-block h-2 w-3 rounded-[2px]" style={{ background: c }} />{l}</span>
        ))}
        <span className="inline-flex items-center gap-1"><i className="inline-block size-2 rounded-full bg-sun" />Your logs</span>
      </div>
    </>
  )
}

export default function SeasonSection() {
  const { season, crops, todayState: st, openLog } = useApp()
  if (!season) return null
  const today = new Date()
  const next = season.segs.find((s) => s.start > today)
  const tasks = upcoming(season.segs, crops, today, 30)

  return (
    <Section id="s_season" icon="calendar" title="Your season" action={<MoreLink onClick={() => openLog(new Date())}>+ Log today</MoreLink>}>
      <div className="card">
        {st && !st.prep ? (
          <CycleRing st={st} crops={crops} />
        ) : st?.prep ? (
          <p><b>Land preparation</b> for {crops[st.seg.crop].fil}. Planting in <b>{st.day} days</b> ({fmtD(st.seg.start)}).</p>
        ) : (
          <>
            <p>Field is resting. {next && <>Next: <b>{crops[next.crop].fil}</b> on {fmtD(next.start)}.</>}</p>
            <p className="note">Bare soil loses moisture and organic matter. A short legume or green manure could cover this gap; see Rotation plans.</p>
          </>
        )}
        {next && (
          <div className="mt-2.5 flex items-start gap-3 rounded-2xl bg-water-soft p-3">
            <span className="text-water"><Icon name="leaf" /></span>
            <div><b className="block">Best planting window</b>{crops[next.crop].fil}: {fmtD(addDays(next.start, -5))} – {fmtD(addDays(next.start, 10))}</div>
          </div>
        )}
        <ul className="mt-1.5">
          {tasks.length ? (
            tasks.map((t, i) => <TaskRow key={i} d={fmtD(t.d)}>{taskText(t, crops)}</TaskRow>)
          ) : (
            <li className="note py-2.5">Nothing scheduled in the next 30 days.</li>
          )}
        </ul>
        <details className="disclosure">
          <summary>Show crop calendar ▾</summary>
          <Calendar />
        </details>
      </div>
    </Section>
  )
}
