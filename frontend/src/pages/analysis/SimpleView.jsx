import { Icon } from '../../components/Icon'
import { RotationStrip } from '../../components/PlanCard'
import { SpeakButton } from '../../components/Speech'
import { Glow, HERO_BG } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useApi } from '../../hooks/useApi'
import { addDays, BUWAN, fmtFil, parseYmd, r1 } from '../../lib/format'
import { QA_TYPES } from '../../lib/labels'
import { taskText, upcoming } from '../../lib/season'
import WeatherSky from './WeatherSky'

function todayAction(st, riceNow, sensor, crops, next) {
  if (riceNow && sensor.water <= -15)
    return { lvl: 'bad', icon: 'drop', tag: 'Gawin ngayon', title: 'Magpatubig ngayon', text: `Mababa na ang tubig sa palayan (${r1(sensor.water)} cm). Patubigan hanggang mga 5 cm sa ibabaw ng lupa.` }
  if (st?.prep)
    return { lvl: 'warn', icon: 'calendar', tag: 'Ngayong linggo', title: 'Ihanda ang lupa', text: `Magtatanim ng ${crops[st.seg.crop].fil} sa ${fmtFil(st.seg.start)}, ${st.day} araw na lang. Araruhin at patagin na ang bukid.` }
  if (st) {
    const c = crops[st.seg.crop]
    if (st.phase === 'Flowering') return { lvl: 'warn', icon: 'sun', tag: 'Bantayan', title: `Namumulaklak ang ${c.fil}`, text: 'Huwag hayaang matuyo ang lupa ngayong linggo. Sa tanghali ang pinakamainit.' }
    if (st.phase === 'Harvest') return { lvl: 'ok', icon: 'leaf', tag: 'Anihan', title: 'Panahon na ng ani', text: `Handa nang anihin ang ${c.fil}. Pagkatapos mag-ani, tingnan ang susunod na itatanim sa ibaba.` }
    return { lvl: 'ok', icon: 'check', tag: 'Maayos', title: 'Walang kailangang gawin ngayon', text: `Lumalaki nang maayos ang ${c.fil} (ika-${st.day} na araw). Bumalik bukas.` }
  }
  return { lvl: 'info', icon: 'leaf', tag: 'Pahinga ang bukid', title: 'Walang tanim ngayon', text: next ? `Susunod na itatanim: ${crops[next.crop].fil} sa ${fmtFil(next.start)}. Ihanda ang binhi.` : 'Pumili ng plano sa ibaba.' }
}

function lights(riceNow, sensor, clim, soil) {
  const w = riceNow
    ? sensor.water <= -15 ? ['r', 'Magpatubig na'] : sensor.water < 0 ? ['y', 'Natutuyo'] : ['g', 'Sapat']
    : sensor.moist < 25 ? ['r', 'Tuyo ang lupa'] : sensor.moist < 35 ? ['y', 'Medyo tuyo'] : ['g', 'Basa pa']
  const x = clim.X[new Date().getMonth()]
  const h = x >= 35 ? ['r', 'Napakainit'] : x >= 33.5 ? ['y', 'Mainit'] : ['g', 'Katamtaman']
  const l = soil < 40 ? ['r', 'Kailangang alagaan'] : soil < 65 ? ['y', 'Katamtaman'] : ['g', 'Malusog']
  return [[...w, 'Tubig', 'drop'], [...h, 'Init', 'sun'], [...l, 'Lupa', 'leaf']]
}
const LIGHT = {
  g: 'bg-[#1f9d55] shadow-[0_0_0_6px_#e3f5ea]',
  y: 'bg-[#e59f12] shadow-[0_0_0_6px_#fdf2da]',
  r: 'bg-[#dc4b2f] shadow-[0_0_0_6px_#fde8e3]',
}

function recSentence(b, crops) {
  const names = b.segs.slice(1).map((s) => `${crops[s.crop].fil} (${BUWAN[parseYmd(s.start).getMonth()]})`)
  return `Pagkatapos anihin ang palay sa Oktubre, magtanim ng ${names.join(', tapos ')}. Ibalik sa lupa ang dayami sa halip na sunugin.`
}

export default function SimpleView() {
  const { farm, crops, season, sensor, riceNow, todayState: st, go, openLog, saveFarm, toast, setLang, ask, setMode, farmVersion } = useApp()
  const { data: clim } = useApi('/climate?scenario=now', [farmVersion])
  const { data: plans } = useApi('/plans?scenario=ssp245', [farmVersion])
  if (!clim || !season) return <div className="sky sky-sun min-h-[70vh]" />

  const today = new Date()
  const next = season.segs.find((s) => s.start > today)
  const a = todayAction(st, riceNow, sensor, crops, next)
  const tasks = upcoming(season.segs, crops, today, 21).slice(0, 3)

  const b = plans?.plans[0]
  const cur = plans?.current
  const adopted = b && farm.adopted === b.id
  const benefits = []
  if (b) {
    if (b.legume) benefits.push(['leaf', 'Pinapataba ang lupa (nitrogen)'])
    if (b.irrig < cur.irrig) benefits.push(['drop', `Tipid sa tubig: mga ${Math.round(cur.irrig - b.irrig)} mm na mas kaunti`])
    benefits.push(['check', `May tanim ang bukid ${b.covered} sa 12 buwan`])
  }
  const risk = b?.ds.find((e) => e.heat < 0.85 || e.short > 40 || e.soil < 0.85)

  const adopt = async () => {
    try {
      await saveFarm({ ...farm, adopted: b.id })
      toast('Nailagay na sa kalendaryo mo')
    } catch (e) {
      toast(e.message)
    }
  }
  const why = () => {
    setLang('Filipino')
    ask(`Bakit ang "${b.name}" ang pinakamagandang plano para sa bukid ko? Ipaliwanag nang simple.`, { lang: 'Filipino' })
  }

  return (
    <>
      <WeatherSky clim={clim.summary.series} lat={clim.province.lat} lon={clim.province.lon} />

      {/* what to do today */}
      <div className={`relative mt-3.5 overflow-hidden rounded-[26px] bg-linear-135 px-5 py-[22px] text-white shadow-hero ${HERO_BG[a.lvl]}`}>
        <Glow />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-[5px] text-[14px] font-bold"><Icon name={a.icon} />{a.tag}</span>
        <h2 className="mt-3.5 mb-2 text-[30px] leading-[1.1] font-extrabold">{a.title}</h2>
        <p className="mb-4 text-[18px] leading-[1.45] opacity-95">{a.text}</p>
        <SpeakButton text={`${a.title}. ${a.text}`} className="m-0! bg-white/20! text-white!" />
      </div>

      {/* traffic lights */}
      <div className="mt-3.5 grid grid-cols-3 gap-2.5">
        {lights(riceNow, sensor, clim.summary.series, season.soil_score).map(([c, v, t, i]) => (
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
            <h2 className="text-[21px] font-bold">Ang tanim mo ngayon</h2>
            <div className="my-0.5 font-display text-[34px] font-extrabold">{c.fil}</div>
            <div className="mt-2.5 mb-1.5 h-3.5 overflow-hidden rounded-full bg-surface2" role="progressbar" aria-valuenow={st.day} aria-valuemin={1} aria-valuemax={n}>
              <i className="block h-full rounded-full bg-linear-90 from-[#6cc58a] to-leaf" style={{ width: `${Math.min(1, st.day / n) * 100}%` }} />
            </div>
            <p className="m-0 text-[17px]">Ika-<b>{st.day}</b> na araw sa {n}.</p>
            <p className="note mt-1">
              {st.seg.crop !== 'sesbania' && fl > 0 && `Mamumulaklak sa loob ng ${fl} araw. `}
              {hv > 0 ? `Aanihin sa mga ${fmtFil(addDays(st.seg.start, Math.round(n * 0.92)))}.` : 'Puwede nang anihin.'}
            </p>
          </div>
        )
      })()}

      {/* quick actions */}
      <div className="mt-[22px] grid grid-cols-3 gap-2.5">
        <button type="button" onClick={() => go('chat')} className="col-span-3 flex min-h-[72px] items-center justify-center gap-2 rounded-[20px] bg-paddy p-4 text-[19px] font-bold text-white shadow-card">
          <span className="grid size-12 place-items-center rounded-2xl bg-white/15 [&_.ic]:size-[26px]"><Icon name="chat" /></span>Magtanong kay Strata
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
      <p className="note mt-2 text-center">Pindutin para itala ang nangyari sa bukid</p>

      {/* tasks */}
      <div className="card mt-[22px]">
        <h2 className="text-[21px] font-bold">Mga gagawin</h2>
        {tasks.length ? tasks.map((t, i) => (
          <div key={i} className="flex items-start gap-3.5 border-b border-dashed border-line py-3 text-[17px] last:border-0">
            <div className="min-w-16 rounded-xl bg-leaf-soft px-2.5 py-1.5 text-center font-display text-[14px] font-extrabold text-leaf-ink">
              {t.d.getDate()}<br /><span className="text-[11px] font-bold">{BUWAN[t.d.getMonth()].slice(0, 3).toUpperCase()}</span>
            </div>
            <div>{taskText(t, crops, 'fil')}</div>
          </div>
        )) : <p className="note">Walang gagawin sa susunod na 3 linggo.</p>}
      </div>

      {/* recommendation */}
      {b && (
        <div className="card mt-[22px]">
          <h2 className="text-[21px] font-bold">Payo: susunod na itatanim</h2>
          <div className="my-0.5 font-display text-[26px] font-extrabold">{b.name}</div>
          <RotationStrip segs={b.segs} crops={crops} />
          <p className="mt-1.5 mb-2.5 text-[19px] leading-[1.45]">{recSentence(b, crops)}</p>
          <div className="mt-1.5 mb-3 flex flex-col gap-2">
            {benefits.map(([i, t]) => (
              <div key={t} className="flex items-center gap-2.5 text-[16px] font-semibold [&_.ic]:text-leaf"><Icon name={i} />{t}</div>
            ))}
            {risk && (
              <div className="flex items-center gap-2.5 text-[16px] font-semibold text-danger">
                <Icon name="alert" />Ingat: {risk.heat < 0.85 ? 'mainit kapag namumulaklak, magtanim nang maaga' : risk.short > 40 ? 'baka kulangin sa tubig' : 'mas gusto nito ang lupang hindi binabaha'}
              </div>
            )}
          </div>
          <button type="button" className={`btn w-full ${adopted ? '' : 'btn-pri'}`} onClick={adopt}>{adopted ? 'Ito na ang plano mo' : 'Gamitin ang planong ito'}</button>
          <div className="mt-2 flex gap-2">
            <SpeakButton text={`${b.name}. ${recSentence(b, crops)}`} className="m-0! min-h-[52px] flex-1 justify-center" />
            <button type="button" className="btn flex-1" onClick={why}>Bakit ito?</button>
          </div>
        </div>
      )}

      <button type="button" className="mx-auto mt-[22px] mb-1 block font-bold text-leaf" onClick={() => setMode('detailed')}>
        Para sa technician: buong detalye at NASA data →
      </button>
    </>
  )
}
