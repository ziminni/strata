import { Icon } from '../../components/Icon'
import { RotationStrip } from '../../components/PlanCard'
import Tata, { tataMood } from '../../components/Tata'
import { useApp } from '../../context/AppContext'
import { useApi } from '../../hooks/useApi'
import { addDays, fmtD, MON, MONTHS_LONG, parseYmd, r1 } from '../../lib/format'
import { QA_TYPES } from '../../lib/labels'
import { taskText, upcoming } from '../../lib/season'
import { wxDay } from '../../lib/weather'

function todayAction(st, riceNow, sensor, crops, next) {
  if (riceNow && sensor.water <= -15)
    return { tag: 'Do it today', title: 'Water your field today', text: `Paddy water is low (${r1(sensor.water)} cm). Flood it to about 5 cm above the soil.` }
  if (st?.prep)
    return { tag: 'This week', title: 'Prepare the land', text: `${crops[st.seg.crop].fil} goes in on ${fmtD(st.seg.start)}, in ${st.day} days. Plow and level the field now.` }
  if (st) {
    const c = crops[st.seg.crop]
    if (st.phase === 'Flowering') return { tag: 'Watch closely', title: `${c.fil} is flowering`, text: 'Don’t let the soil dry out this week. Midday is the hottest.' }
    if (st.phase === 'Harvest') return { tag: 'Harvest time', title: 'Time to harvest', text: `${c.fil} is ready. After harvest, see what to plant next below.` }
    return { tag: 'All good', title: 'Nothing to do today', text: `${c.fil} is growing well (day ${st.day}). Check back tomorrow.` }
  }
  return { tag: 'Field is resting', title: 'Nothing planted right now', text: next ? `Next up: ${crops[next.crop].fil} on ${fmtD(next.start)}. Get your seeds ready.` : 'Pick a plan below.' }
}

// card tint per Tata mood (from the mascot sheet)
const MOOD_CARD = {
  happy: { bg: 'bg-white', title: 'Kumusta!' },
  rain: { bg: 'bg-[#edf2f5]', title: 'Rain coming' },
  thirsty: { bg: 'bg-[#faf1e0]', title: 'Thirsty field' },
  harvest: { bg: 'bg-[#f0f5e6]', title: 'Harvest time!' },
}

function lights(riceNow, sensor, clim, soil) {
  const w = riceNow
    ? sensor.water <= -15 ? ['r', 'Irrigate now'] : sensor.water < 0 ? ['y', 'Drying'] : ['g', 'Enough']
    : sensor.moist < 25 ? ['r', 'Dry soil'] : sensor.moist < 35 ? ['y', 'A bit dry'] : ['g', 'Still moist']
  const x = clim.X[new Date().getMonth()]
  const h = x >= 35 ? ['r', 'Very hot'] : x >= 33.5 ? ['y', 'Hot'] : ['g', 'Mild']
  const l = soil < 40 ? ['r', 'Needs care'] : soil < 65 ? ['y', 'Fair'] : ['g', 'Healthy']
  return [[...w, 'Water', 'drop'], [...h, 'Heat', 'sun'], [...l, 'Soil', 'leaf']]
}
const LIGHT = {
  g: 'bg-[#1f9d55] shadow-[0_0_0_6px_#e3f5ea]',
  y: 'bg-[#e59f12] shadow-[0_0_0_6px_#fdf2da]',
  r: 'bg-[#dc4b2f] shadow-[0_0_0_6px_#fde8e3]',
}

function recSentence(b, crops) {
  const names = b.segs.slice(1).map((s) => `${crops[s.crop].fil} (${MONTHS_LONG[parseYmd(s.start).getMonth()]})`)
  return `After the rice harvest in October, plant ${names.join(', then ')}. Plow the rice straw back in instead of burning it.`
}

/**
 * Parked dashboard cards (Tata's today card, traffic lights, current crop, quick logs, to-do, plan advice).
 * Removed from Home on request while the dashboard content is being decided — not rendered anywhere yet.
 * To bring them back, render <DashboardCards /> under <WeatherSky /> in SimpleView.
 */
export default function DashboardCards() {
  const { farm, crops, season, sensor, riceNow, todayState: st, go, openLog, saveFarm, toast, ask, setMode, farmVersion } = useApp()
  const { data: clim } = useApi('/climate?scenario=now', [farmVersion])
  const { data: plans } = useApi('/plans?scenario=ssp245', [farmVersion])
  if (!clim || !season) return null

  const today = new Date()
  const series = clim.summary.series
  const next = season.segs.find((s) => s.start > today)
  const a = todayAction(st, riceNow, sensor, crops, next)
  const rainDay = [0, 1].map((i) => wxDay(farm.prov, series, addDays(today, i))).findIndex((d) => d.chance >= 50)
  const mood = tataMood({
    urgentWater: riceNow && sensor.water <= -15,
    hot: st?.phase === 'Flowering' && series.X[today.getMonth()] >= 35,
    harvest: st?.phase === 'Harvest',
    rainSoon: rainDay >= 0,
  })
  const tasks = upcoming(season.segs, crops, today, 21).slice(0, 3)

  const b = plans?.plans[0]
  const cur = plans?.current
  const adopted = b && farm.adopted === b.id
  const benefits = []
  if (b) {
    if (b.legume) benefits.push(['leaf', 'Feeds the soil with nitrogen'])
    if (b.irrig < cur.irrig) benefits.push(['drop', `Saves water: about ${Math.round(cur.irrig - b.irrig)} mm less`])
    benefits.push(['check', `Something growing ${b.covered} of 12 months`])
  }
  const risk = b?.ds.find((e) => e.heat < 0.85 || e.short > 40 || e.soil < 0.85)

  const adopt = async () => {
    try {
      await saveFarm({ ...farm, adopted: b.id })
      toast('Added to your crop calendar')
    } catch (e) {
      toast(e.message)
    }
  }

  return (
    <>
      {/* what to do today — led by Tata */}
      <div className={`relative mt-3.5 overflow-hidden rounded-[26px] px-5 pt-5 pb-5 shadow-card ${MOOD_CARD[mood].bg}`}>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center rounded-full bg-leaf-soft px-3 py-[5px] text-[13px] font-bold text-leaf-ink">{a.tag}</span>
            <h2 className="mt-3 text-[28px] leading-[1.1] font-extrabold text-paddy">{a.title}</h2>
          </div>
          <Tata mood={mood} size={96} className="-mt-1 -mr-1 flex-none" />
        </div>
        <p className="mt-2 mb-0 text-[18px] leading-[1.45] text-ink-soft">{a.text}</p>
        {rainDay >= 0 && mood === 'rain' && (
          <p className="mt-3 mb-0 flex items-center gap-2 rounded-2xl bg-water-soft px-3 py-2.5 text-[15.5px] font-semibold text-water">
            <Icon name="drop" />Rain likely {rainDay === 0 ? 'today' : 'tomorrow'}. Hold off on fertilizer.
          </p>
        )}
      </div>

      {/* traffic lights */}
      <div className="mt-3.5 grid grid-cols-3 gap-2.5">
        {lights(riceNow, sensor, series, season.soil_score).map(([c, v, t, i]) => (
          <div key={t} className="rounded-[20px] bg-surface px-2.5 py-3.5 text-center shadow-card">
            <div className={`mx-auto mb-2 grid size-11 place-items-center rounded-full text-white [&_.ic]:size-[22px] ${LIGHT[c]}`}><Icon name={i} /></div>
            <b className="block font-display text-[17px] font-bold">{t}</b>
            <span className="text-[14px] font-semibold text-ink-soft">{v}</span>
          </div>
        ))}
      </div>

      {/* current crop */}
      {st && !st.prep && (() => {
        const c = crops[st.seg.crop], n = c.days
        const fl = Math.round(n * 0.55) - st.day, hv = Math.round(n * 0.92) - st.day
        return (
          <div className="card mt-[22px]">
            <h2 className="text-[21px] font-bold">Your crop now</h2>
            <div className="my-0.5 font-display text-[34px] font-extrabold">{c.fil}</div>
            <div className="mt-2.5 mb-1.5 h-3.5 overflow-hidden rounded-full bg-surface2" role="progressbar" aria-valuenow={st.day} aria-valuemin={1} aria-valuemax={n}>
              <i className="block h-full rounded-full bg-linear-90 from-[#6cc58a] to-leaf" style={{ width: `${Math.min(1, st.day / n) * 100}%` }} />
            </div>
            <p className="m-0 text-[17px]">Day <b>{st.day}</b> of {n}.</p>
            <p className="note mt-1">
              {st.seg.crop !== 'sesbania' && fl > 0 && `Flowering in ${fl} days. `}
              {hv > 0 ? `Harvest around ${fmtD(addDays(st.seg.start, Math.round(n * 0.92)))}.` : 'Ready to harvest.'}
            </p>
          </div>
        )
      })()}

      {/* quick actions */}
      <div className="mt-[22px] grid grid-cols-3 gap-2.5">
        <button type="button" onClick={() => go('chat')} className="col-span-3 flex min-h-[72px] items-center justify-center gap-2 rounded-[20px] bg-paddy p-4 text-[19px] font-bold text-white shadow-card">
          <span className="grid size-12 place-items-center rounded-2xl bg-white/15 [&_.ic]:size-[26px]"><Icon name="chat" /></span>Ask Tata
        </button>
        {['harvest', 'observation', 'activity', 'irrigation', 'weather', 'planting'].map((k) => {
          const [t, i, bg, fg] = QA_TYPES[k]
          return (
            <button key={k} type="button" onClick={() => openLog(new Date(), k)} className="flex min-h-[104px] flex-col items-center gap-2 rounded-[20px] bg-surface px-1.5 pt-4 pb-3 text-[16px] font-bold shadow-card">
              <span className="grid size-12 place-items-center rounded-2xl [&_.ic]:size-[26px]" style={{ background: bg, color: fg }}><Icon name={i} /></span>{t}
            </button>
          )
        })}
      </div>
      <p className="note mt-2 text-center">Tap to record what happened on your farm</p>

      {/* tasks */}
      <div className="card mt-[22px]">
        <h2 className="text-[21px] font-bold">To do</h2>
        {tasks.length ? tasks.map((t, i) => (
          <div key={i} className="flex items-start gap-3.5 border-b border-dashed border-line py-3 text-[17px] last:border-0">
            <div className="min-w-16 rounded-xl bg-leaf-soft px-2.5 py-1.5 text-center font-display text-[14px] font-extrabold text-leaf-ink">
              {t.d.getDate()}<br /><span className="text-[11px] font-bold">{MON[t.d.getMonth()].toUpperCase()}</span>
            </div>
            <div>{taskText(t, crops)}</div>
          </div>
        )) : <p className="note">Nothing to do in the next 3 weeks.</p>}
      </div>

      {/* recommendation */}
      {b && (
        <div className="card mt-[22px]">
          <h2 className="text-[21px] font-bold">Advice: what to plant next</h2>
          <div className="my-0.5 font-display text-[26px] font-extrabold">{b.name}</div>
          <RotationStrip segs={b.segs} crops={crops} />
          <p className="mt-1.5 mb-2.5 text-[19px] leading-[1.45]">{recSentence(b, crops)}</p>
          <div className="mt-1.5 mb-3 flex flex-col gap-2">
            {benefits.map(([i, t]) => (
              <div key={t} className="flex items-center gap-2.5 text-[16px] font-semibold [&_.ic]:text-leaf"><Icon name={i} />{t}</div>
            ))}
            {risk && (
              <div className="flex items-center gap-2.5 text-[16px] font-semibold text-danger">
                <Icon name="alert" />Watch out: {risk.heat < 0.85 ? 'hot when it flowers, plant early' : risk.short > 40 ? 'it may run short of water' : 'it prefers soil that doesn’t flood'}
              </div>
            )}
          </div>
          <button type="button" className={`btn w-full ${adopted ? '' : 'btn-pri'}`} onClick={adopt}>{adopted ? 'This is your plan' : 'Use this plan'}</button>
          <button type="button" className="btn mt-2 w-full" onClick={() => ask(`Why is "${b.name}" the best plan for my farm? Explain simply.`)}>Why this plan?</button>
        </div>
      )}

      <button type="button" className="mx-auto mt-[22px] mb-1 block font-bold text-leaf" onClick={() => setMode('detailed')}>
        For technicians: full details and NASA data →
      </button>
    </>
  )
}
