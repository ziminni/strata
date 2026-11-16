import ModelResult from '../components/ModelResult'
import TataBuddy from '../components/TataBuddy'
import { useApp } from '../context/AppContext'
import { useApi } from '../hooks/useApi'
import { cropStatus, STAGES } from '../lib/cropPlan'
import { fertilizerAdvice } from '../lib/fertilizer'
import { fmtD } from '../lib/format'
import { tr } from '../lib/i18n'
import { TIER } from '../lib/tiers'
import DashCard from './analysis/DashCard'

const WATER_LABEL = { canal: 'Irrigated', limited: 'Limited water', rainfed: 'Rain only' }

function Tile({ value, label, warn }) {
  return (
    <div className="rounded-2xl bg-surface2 px-2 py-2.5 text-center">
      <div className={`truncate font-display text-[19px] leading-tight font-extrabold tabular-nums ${warn ? 'text-danger' : ''}`}>{value}</div>
      <div className="mt-0.5 text-[11.5px] font-semibold text-muted">{label}</div>
    </div>
  )
}

/** The crop, where and when it was planted, and Tata. */
function Hero({ plot, c, st, mood }) {
  const t = TIER[plot.tier]
  return (
    <section className="tip-in rounded-[26px] bg-surface p-5 shadow-card" aria-label={tr('My crop')}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <span className={`inline-block rounded-full px-2.5 py-1 text-[11.5px] font-bold ${t.pill}`}>{t.label} · {tr('fit {n}', { n: plot.score })}</span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <h1 className="text-[30px] leading-none font-extrabold" style={{ color: c.color }}>{c.fil}</h1>
            <span className="text-[15px] font-semibold text-muted">{c.en}</span>
          </div>
          <p className="mt-1.5 mb-0 text-[13.5px] text-muted">{tr('Planted {date}', { date: fmtD(st.planted) })} · {tr(plot.name)}, {plot.mun} · {plot.area} ha</p>
        </div>
        <TataBuddy
          mood={mood}
          size={92}
          className="-mt-1 -mr-1 flex-none"
          lines={[
            mood === 'thirsty' ? tr('I’m thirsty! Please water the field.') : st.day < 1 ? tr('Planting day is coming soon!') : tr('Day {n}! {crop} is in the {stage} stage.', { n: Math.min(st.day, st.days), crop: c.fil, stage: STAGES[Math.max(0, st.stage)].toLowerCase() }),
            st.left > 0 ? tr('Harvest in {n} days. We can do it!', { n: st.left }) : tr('It’s harvest time!'),
            tr('Hehe, that tickles!'),
            tr('Scroll down for my planting check!'),
            tr('{crop} and I are best friends now.', { crop: c.fil }),
          ]}
        />
      </div>
    </section>
  )
}

/** Farm tab — the STRATA model's verdict for the farmer's crop: likelihood, climate score, best planting date. */
export default function CropsPage({ embedded = false }) {
  const { crops, farm, sensor, cropVersion, farmVersion, setCropSheetOpen } = useApp()
  const { data: plot, loading } = useApi('/crop', [cropVersion, farmVersion])
  const { data: climRes } = useApi('/climate?scenario=now', [farmVersion])

  if (loading && !plot) return <p className="note py-16 text-center">{tr('Loading your crop…')}</p>

  if (!plot)
    return (
      <section className="flex min-h-[calc(100dvh-260px)] flex-col items-center justify-center px-6 text-center" aria-label={tr('My crop')}>
        <TataBuddy size={130} bubble="top" lines={[tr('Let’s choose your crop!'), tr('Palay, Mais or Tabako?'), tr('Hehe, that tickles!'), tr('I’ll help you every step!')]} />
        <h1 className="mt-4 text-[26px] leading-tight font-extrabold text-paddy">{tr('You haven’t chosen')}<br />{tr('a crop yet')}</h1>
        <button type="button" className="btn btn-pri mt-5 w-full max-w-[280px]" onClick={() => setCropSheetOpen(true)}>
          <span className="text-[18px] leading-none">+</span> {tr('Choose your crop')}
        </button>
      </section>
    )

  const c = crops[plot.crop]
  const m = plot.model
  const st = cropStatus(plot, c)
  const clim = climRes?.summary.series
  const fert = clim ? fertilizerAdvice(farm.prov, clim) : null
  const moist = Math.round(sensor.moist)
  const water = Math.round(sensor.water)
  const dry = moist < 35
  const mood = dry ? 'thirsty' : st.stage === 4 ? 'harvest' : fert?.level === 'hold' ? 'rain' : 'happy'

  return (
    <section className={embedded ? '' : 'px-4 pt-2 pb-2.5'} aria-label={tr('My crop')}>
      <Hero plot={plot} c={c} st={st} mood={mood} />
      <DashCard icon="sprout" tone="g" title={tr('STRATA planting check')}>
        {!m ? (
          // crop analysed before the model was connected, or the model couldn't be reached
          <div className="text-center">
            <p className="m-0 text-[15px] leading-[1.5] text-ink-soft">{tr('No STRATA model result for this crop yet. Analyze it again to get its planting compatibility, climate score and best planting date.')}</p>
            <button type="button" className="btn btn-pri mt-4 w-full max-w-[280px]" onClick={() => setCropSheetOpen(true)}>{tr('Analyze again')}</button>
          </div>
        ) : (
          <ModelResult m={m} crop={c.fil} planted={plot.planted} />
        )}
      </DashCard>

      {/* desktop Home shows the sensor once (Field sensor card), so skip this there */}
      {!embedded && <DashCard icon="radio" tone="b" title={tr('Field conditions')}>
        <div className="grid grid-cols-3 gap-2">
          <Tile value={`${moist}%`} label={tr('Soil moisture')} warn={dry} />
          <Tile value={`${water} cm`} label={tr('Water level')} warn={water <= -15} />
          <Tile value={tr(WATER_LABEL[plot.water])} label={tr('Water source')} />
        </div>
      </DashCard>}
    </section>
  )
}
