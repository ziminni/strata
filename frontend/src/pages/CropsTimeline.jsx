import { Icon } from '../components/Icon'
import { Glow, Pill } from '../components/ui'
import { useApp } from '../context/AppContext'
import { addDays, dayDiff, fmtD } from '../lib/format'
import { QA_TYPES } from '../lib/labels'

// The PRD's three operational gates; each opens Diagnose for that crop.
const ACTIONS = [
  ['planting', 'rotate', { simple: 'Planting', detailed: 'Planting' }],
  ['fertilizing', 'note', { simple: 'Fertilizing', detailed: 'Fertilizing' }],
  ['harvesting', 'leaf', { simple: 'Harvesting', detailed: 'Harvesting' }],
]

const EN = {
    title: 'My crops', now: 'In the field now', resting: 'Field is resting', prep: 'Land preparation',
    day: (d, n) => `Day ${d} of ${n}`, plantIn: (n) => `Planting in ${n} days`, check: 'Check with NASA data',
    season: 'This season', plan: 'Plan', changePlan: 'Change', done: 'Done', current: 'Now', next: 'Next',
    logs: (n) => `${n} log${n === 1 ? '' : 's'}`, log: 'Log', nextCrop: 'Next crop', none: 'No crops planned.',
}
// English for now; a language picker comes later
const T = { simple: EN, detailed: EN }

function ActionRow({ t, mode, onPick }) {
  return (
    <div className="mt-4">
      <div className="mb-2 text-[12.5px] font-bold tracking-[0.06em] uppercase opacity-80 simple:text-[14px] simple:normal-case simple:tracking-normal">{t.check}</div>
      <div className="grid grid-cols-3 gap-2">
        {ACTIONS.map(([key, icon, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onPick(key)}
            className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl bg-white/18 px-1 py-2.5 text-[13px] font-bold text-white active:bg-white/28 simple:text-[14.5px] [&_.ic]:size-[22px]"
          >
            <Icon name={icon} />
            {label[mode]}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Parked "My crops" content (current-crop card with Planting/Fertilizing/Harvesting, season timeline).
 * Removed from the Farm tab on request — not rendered anywhere yet.
 * To bring it back, render <CropsTimeline /> inside CropsPage.
 */
export default function CropsTimeline() {
  const { season, crops, todayState: st, logs, farm, mode, go, openLog } = useApp()
  if (!season) return null
  const t = T[mode]
  const today = new Date()
  const next = season.segs.find((s) => s.start > today)
  const focusCrop = st ? st.seg.crop : next?.crop
  const diagnose = () => go('diagnose')

  // this season's crops: anything that ended in the last ~4 months through the next ~10
  const timeline = season.segs.filter((s) => s.end >= addDays(today, -120) && s.start <= addDays(today, 300))
  const logCount = (crop) => logs.filter((l) => l.crop === crop).length

  return (
    <section className="px-4 pt-1.5 pb-2.5" aria-label={t.title}>
      <h1 className="mt-2.5 mb-0.5 text-[28px] font-extrabold">{t.title}</h1>
      <p className="note m-0">{farm.mun}, {farm.prov} · {farm.area} ha</p>

      {/* the crop that matters right now */}
      <div className="relative mt-3.5 overflow-hidden rounded-[26px] bg-linear-135 from-leaf to-paddy px-5 py-5 text-white shadow-hero">
        <Glow />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-[5px] text-[13px] font-bold simple:text-[14px]">
          <Icon name="sprout" />
          {st && !st.prep ? t.now : st?.prep ? t.prep : t.resting}
        </span>
        {focusCrop ? (
          <>
            {!st && <div className="mt-3 text-[13px] font-bold tracking-[0.06em] uppercase opacity-80 simple:text-[14px] simple:normal-case simple:tracking-normal">{t.nextCrop}</div>}
            <div className={`${st ? 'mt-3' : 'mt-1'} font-display text-[36px] leading-none font-extrabold tracking-[-0.02em]`}>{crops[focusCrop].fil}</div>
            <div className="mt-1 text-[14px] opacity-90 simple:text-[16px]">{crops[focusCrop].en}</div>
            {st && !st.prep ? (
              <>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={st.day} aria-valuemin={1} aria-valuemax={crops[focusCrop].days}>
                  <i className="block h-full rounded-full bg-white" style={{ width: `${Math.min(1, st.day / crops[focusCrop].days) * 100}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[14px] font-semibold simple:text-[16px]">
                  <span>{t.day(st.day, crops[focusCrop].days)}</span>
                  <Pill style={{ background: 'rgb(255 255 255 / .2)', color: '#fff' }}>{st.phase}</Pill>
                </div>
              </>
            ) : (
              <p className="mt-3 mb-0 text-[16px] simple:text-[18px]">
                {t.plantIn(dayDiff(next.start, today))} · {fmtD(next.start)}
              </p>
            )}
            <ActionRow t={t} mode={mode} onPick={diagnose} />
          </>
        ) : (
          <p className="mt-3 text-[16px]">{t.none}</p>
        )}
      </div>

      {/* season timeline */}
      <div className="mt-[22px] mb-2 flex items-center gap-2.5">
        <h2 className="text-[19px] font-bold">{t.season}</h2>
        <button type="button" onClick={() => go('analysis')} className="ml-auto max-w-[60%] truncate rounded-full bg-leaf-soft px-[11px] py-1.5 text-[13px] font-bold text-leaf">
          {t.plan}: {season.plan.name.replace('Your current practice: ', '')}
        </button>
      </div>
      <ol className="relative">
        {timeline.map((s, i) => {
          const status = s.end <= today ? 'done' : s.start <= today ? 'current' : 'next'
          const c = crops[s.crop]
          const n = logCount(s.crop)
          return (
            <li key={i} className="relative flex gap-3 pb-3 last:pb-0">
              {/* rail */}
              {i < timeline.length - 1 && <span className="absolute top-12 bottom-0 left-[21px] w-0.5 bg-line" />}
              <span
                className={`relative z-10 mt-2.5 grid size-11 flex-none place-items-center rounded-2xl text-white [&_.ic]:size-[22px] ${status === 'done' ? 'opacity-50' : ''}`}
                style={{ background: c.color }}
              >
                <Icon name={status === 'done' ? 'check' : 'sprout'} />
              </span>
              <div className={`card flex-1 px-3.5 py-3 ${status === 'current' ? 'shadow-[0_0_0_2px_var(--color-leaf),var(--shadow-card)]' : ''}`}>
                <div className="flex items-center gap-2">
                  <b className="font-display text-[18px] font-bold simple:text-[20px]">{c.fil}</b>
                  <Pill tone={status === 'current' ? 'ok' : status === 'next' ? 'blue' : undefined} className="ml-auto">
                    {t[status]}
                  </Pill>
                </div>
                <div className="note mt-0.5">
                  {`${fmtD(s.start)} – ${fmtD(s.end)} · ${c.days} days`}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {n > 0 && <span className="text-[12.5px] font-semibold text-muted simple:text-[14px]">{t.logs(n)}</span>}
                  {status !== 'done' && (
                    <button type="button" onClick={diagnose} className="ml-auto inline-flex items-center gap-1 rounded-xl bg-leaf-soft px-2.5 py-1.5 text-[12.5px] font-bold text-leaf-ink simple:text-[14px] [&_.ic]:size-4">
                      <Icon name="scan" />{T[mode].check.split(' ')[0]}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openLog(status === 'next' ? s.start : today, status === 'done' ? 'harvest' : undefined)}
                    className={`inline-flex items-center gap-1 rounded-xl bg-surface2 px-2.5 py-1.5 text-[12.5px] font-bold text-ink simple:text-[14px] [&_.ic]:size-4 ${status === 'done' ? 'ml-auto' : ''}`}
                  >
                    <Icon name={QA_TYPES[status === 'done' ? 'harvest' : 'activity'][1]} />{t.log}
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
