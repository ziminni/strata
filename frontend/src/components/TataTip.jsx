import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useApi } from '../hooks/useApi'
import { fmtD, parseYmd, ymd } from '../lib/format'
import { LIKELIHOOD_TIER, MODEL_CROPS, modelReasons, prescribeCached } from '../lib/model'
import { dayReasons, dayTier, plantingOutlook } from '../lib/planting'
import { DAYS } from '../lib/format'
import { Icon } from './Icon'
import TataBuddy from './TataBuddy'

const STRIP = {
  good: { dot: 'bg-leaf', label: 'Good' },
  ok: { dot: 'bg-sun', label: 'Okay' },
  poor: { dot: 'bg-danger', label: 'Poor' },
}

/** 7-day "best days to plant" strip; the recommended day is ringed. */
function PlantingStrip({ days, best }) {
  return (
    <div className="mx-5 mt-3">
      <div className="grid grid-cols-7 gap-1" role="list" aria-label="Planting days this week">
        {days.map((x) => {
          const t = dayTier(x.score)
          const on = x.d.getTime() === best.d.getTime()
          return (
            <div key={x.d.getTime()} role="listitem" aria-label={`${DAYS[x.d.getDay()]} ${x.d.getDate()}: ${STRIP[t].label} day to plant`}
              className={`flex flex-col items-center rounded-2xl py-2 ${on ? 'bg-leaf-soft ring-2 ring-leaf' : 'bg-surface2'}`}>
              <span className={`text-[11px] font-bold ${on ? 'text-leaf-ink' : 'text-muted'}`}>{DAYS[x.d.getDay()]}</span>
              <span className="font-display text-[16px] leading-tight font-extrabold tabular-nums">{x.d.getDate()}</span>
              <span className={`mt-1 size-2 rounded-full ${STRIP[t].dot}`} />
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex justify-center gap-3 text-[11.5px] font-semibold text-muted">
        {Object.values(STRIP).map((v) => <span key={v.label} className="inline-flex items-center gap-1"><i className={`size-2 rounded-full ${v.dot}`} />{v.label}</span>)}
      </div>
    </div>
  )
}

const longDate = (d) => d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })

const LIKELY_RANK = { high: 2, moderate: 1, low: 0 }

/**
 * Ask the STRATA crop model about every crop for the planting week starting `start` at (lat, lon).
 * → { status: 'loading' | 'done' | 'error', ranked: [{ crop, ...model }] } best first.
 */
function useModelRanking(start, lat, lon, farm) {
  const [res, setRes] = useState({ key: null, status: 'loading', ranked: [] })
  const key = [start, lat, lon, farm.ph, farm.water, farm.drain].join('|')
  useEffect(() => {
    if (lat == null || lon == null) return
    let alive = true
    Promise.allSettled(MODEL_CROPS.map((crop) => prescribeCached({ crop, planted: start, lat, lon, farm, days: 6 }).then((m) => ({ crop, ...m }))))
      .then((all) => {
        if (!alive) return
        const ok = all.filter((r) => r.status === 'fulfilled').map((r) => r.value)
        if (!ok.length) console.warn('[model] crop ranking unavailable, using built-in advice:', all[0]?.reason?.message)
        ok.sort((a, b) => LIKELY_RANK[b.likelihood] - LIKELY_RANK[a.likelihood] || b.score - a.score)
        setRes({ key, status: ok.length ? 'done' : 'error', ranked: ok })
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return res.key === key ? res : { key, status: 'loading', ranked: [] }
}

/** "On Nov 18, I recommend planting Mais" — Tata's planting tip for the coming week. */
export default function TataTip({ clim, field }) {
  const { meta, farm, sensor, crops } = useApp()
  const [open, setOpen] = useState(false)
  const moist = Math.round(sensor.moist)
  const prov = field?.prov || farm.prov
  const water = field?.water || farm.water
  const best = plantingOutlook(farm.prov, clim, moist)
  const start = ymd(best.d)
  // moist is rounded so the advice only refetches when the reading meaningfully changes
  const { data } = useApi(`/crop-advice?${new URLSearchParams({ prov, water, start, moist })}`, [farm.water, farm.prov])

  // which crop: the STRATA model ranks all crops at the field (pinned spot, else the province centre);
  // the built-in advice fills in the harvest date and is the fallback if the model can't be reached
  const pv = meta?.provinces?.[prov]
  const model = useModelRanking(start, field?.lat ?? pv?.lat, field?.lon ?? pv?.lon, farm)
  const builtIn = data?.crops
  const m = model.ranked[0]
  const top =
    model.status === 'loading' || !builtIn ? null
    : m ? (() => {
        const b = builtIn.find((x) => x.crop === m.crop) || {}
        return { ...b, crop: m.crop, fil: crops[m.crop].fil, en: crops[m.crop].en, score: m.score, tier: LIKELIHOOD_TIER[m.likelihood], reasons: [...modelReasons(m), ...(b.reasons || [])], model: m }
      })()
    : builtIn[0]
  const hold = top?.tier === 'not_recommended'
  const why = top ? dayReasons(best, moist) : []
  const cropWhy = top?.reasons.find((r) => !r.warn)?.text

  return (
    <section className="tip-in relative mt-4 rounded-[26px] bg-surface shadow-card" aria-label="Tata recommends">
      <div className="flex items-start gap-2 px-5 pt-5">
        <div className="min-w-0 flex-1 pb-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-soft px-3 py-[5px] text-[12.5px] font-bold text-leaf-ink">
            <Icon name="sprout" />Tata recommends
          </span>
          {!top ? (
            <div className="mt-3 h-[62px] animate-pulse rounded-xl bg-surface2" />
          ) : hold ? (
            <h2 className="mt-3 text-[24px] leading-[1.15] font-extrabold text-paddy">This week, I’d hold off on planting</h2>
          ) : (
            <h2 className="mt-3 text-[24px] leading-[1.15] font-extrabold text-paddy">
              On <span className="text-leaf">{longDate(best.d)}</span>, I recommend planting <span style={{ color: crops[top.crop].color }}>{top.fil}</span>
            </h2>
          )}
          {top && !hold && <p className="mt-1 mb-0 text-[14px] text-muted">{top.en} · {field ? field.name : farm.mun}</p>}
        </div>
        <TataBuddy
          mood={hold || ['rain', 'storm'].includes(best.w.k) ? 'rain' : 'happy'}
          size={104}
          className="mt-2 mr-0.5 flex-none"
          lines={[
            hold ? 'Let’s wait for better weather!' : `${longDate(best.d)} looks like a great day!`,
            'Tap “Why this?” to see my reasons.',
            'Hehe, that tickles!',
            'I check the weather every day for you!',
            'Healthy soil, happy harvest!',
          ]}
        />
      </div>

      {top && !hold && <PlantingStrip days={best.days} best={best} />}

      {top && (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="tata-why"
            className="mt-2 flex w-full items-center justify-center gap-1.5 py-2 text-[13.5px] font-bold text-leaf"
          >
            {open ? 'Hide' : 'Why this?'}
            <span className={`transition-transform duration-300 [&_.ic]:size-[18px] ${open ? 'rotate-180' : ''}`} style={{ transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)' }}>
              <Icon name="chevronDown" />
            </span>
          </button>
          {/* smooth height: grid rows 0fr → 1fr */}
          <div id="tata-why" className="grid transition-[grid-template-rows] duration-400" style={{ gridTemplateRows: open ? '1fr' : '0fr', transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)' }}>
            <div className="overflow-hidden">
              <div className="mx-5 mb-5 rounded-2xl bg-surface2 p-4">
                {hold ? (
                  <p className="m-0 text-[15px] leading-[1.5] text-ink-soft">
                    None of your crops fit {field ? field.name : 'your farm'} well this week. {top.reasons[0]?.text} Check again after the next good rain.
                  </p>
                ) : (
                  <p className="m-0 text-[15px] leading-[1.5] text-ink-soft">
                    {why.join(' ')} {top.fil} fits your field best right now{cropWhy ? `: ${cropWhy.charAt(0).toLowerCase()}${cropWhy.slice(1)}` : '.'}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5 text-[12px] font-bold">
                  <span className="rounded-full bg-white px-2.5 py-1 text-ink">Fit {top.score}/100</span>
                  {!hold && top.harvest && <span className="rounded-full bg-white px-2.5 py-1 text-ink">Harvest ~{fmtD(parseYmd(top.harvest))}</span>}
                  <span className="rounded-full bg-white px-2.5 py-1 text-ink">Rain {best.w.chance}% that day</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-ink">Soil {moist}%</span>
                  {top.model && <span className="rounded-full bg-white px-2.5 py-1 text-ink">STRATA model · {top.model.likelihood} likelihood</span>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
