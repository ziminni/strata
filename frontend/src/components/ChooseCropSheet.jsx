import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../api'
import { useApp } from '../context/AppContext'
import { fmtD, parseYmd, ymd } from '../lib/format'
import { getPosition, nearestProvince } from '../lib/geo'
import { prescribe } from '../lib/model'
import { Icon } from './Icon'
import LocationMap from './LocationMap'
import { Calendar } from './ui/calendar'
import ModelResult, { BestDays } from './ModelResult'
import Tata from './Tata'
import { Sheet } from './ui'
import { localized, tr, trn } from '../lib/i18n'

const STEPS = localized([
  ['Crop', 'What will you plant?'],
  ['Location', 'Where is your field?'],
  ['Planting dates', 'When can you plant?'],
  ['Review', 'Is everything right?'],
])

/** "Step 2 of 4" + progress bar. */
function Progress({ step }) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between text-[12.5px] font-bold text-muted">
        <span>{tr('Step {n} of {total}', { n: step + 1, total: STEPS.length })}</span>
        <span className="text-ink">{STEPS[step][0]}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {STEPS.map(([t], i) => <span key={t} className={`h-1.5 rounded-full transition-colors duration-300 ${i <= step ? 'bg-leaf' : 'bg-surface2'}`} />)}
      </div>
    </div>
  )
}

/** Centred "Analysis complete" popup with the model's result. */
function AnalysisDone({ plot, crop, onDone }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onDone()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(13_35_26/0.45)] px-4 backdrop-blur-[3px]"
      onClick={(e) => e.target === e.currentTarget && onDone()} role="dialog" aria-modal="true" aria-labelledby="analysis-done-title">
      <div className="tip-in max-h-[90vh] w-full max-w-[380px] overflow-auto rounded-[28px] bg-surface p-5 text-center shadow-card">
        <Tata mood={plot.model?.likelihood === 'low' ? 'rain' : 'happy'} size={84} className="mx-auto" />
        <h2 id="analysis-done-title" className="mt-2 text-[22px] font-extrabold text-paddy">{tr('Analysis complete')}</h2>
        <p className="mt-1 mb-4 text-[14px] text-muted">{crop.fil} · {plot.mun} · {fmtRange(plot.planted, plot.planted_end)}</p>
        <div className="rounded-2xl bg-surface2 p-4">
          {plot.model ? <ModelResult m={plot.model} crop={crop.fil} planted={plot.planted} /> : (
            <p className="m-0 text-[14.5px] leading-[1.5] text-ink-soft">{tr('The STRATA model couldn’t be reached, so Tata used the built-in analysis. Try again later for the model’s result.')}</p>
          )}
        </div>
        {plot.model && <BestDays m={plot.model} />}
        <button type="button" className="btn btn-pri mt-5 w-full" onClick={onDone} autoFocus>{tr('View my farm')}</button>
      </div>
    </div>,
    document.getElementById('app-root') || document.body,
  )
}

const MAX_NIGHTS = 30 // the model checks up to ~30 candidate days per request
const fmtRange = (a, b) => (b && b !== a ? `${fmtD(parseYmd(a))} – ${fmtD(parseYmd(b))}` : fmtD(parseYmd(a)))
const dayCount = (a, b) => Math.round((parseYmd(b || a) - parseYmd(a)) / 864e5) + 1

const ANALYZE_MS = 1400 // let Tata "think" for a moment so the analysis step is visible

/**
 * The farmer's ONE crop, step by step: crop → location → start date → review.
 * Submitting analyses it (good time or not, risks, predictions) and opens the Farm page with the results.
 */
export default function ChooseCropSheet() {
  const { meta, crops, farm, sensor, cropSheetOpen: open, setCropSheetOpen, bumpCrop, openFarm, saveFarm } = useApp()
  const close = useCallback(() => setCropSheetOpen(false), [setCropSheetOpen])
  const [f, setF] = useState(null)
  const [step, setStep] = useState(0)
  const [geo, setGeo] = useState(null) // null | 'loading' | {km} | 'error'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null) // analysed plot → "Analysis complete" popup
  const [today] = useState(() => new Date(new Date().setHours(0, 0, 0, 0))) // earliest pickable planting day

  useEffect(() => {
    if (!open) return
    setGeo(null)
    setError('')
    setBusy(false)
    setResult(null)
    setStep(0)
    setF({ crop: null, prov: farm.prov, mun: farm.mun, lat: null, lon: null, planted: null, end: null })
    // prefill from the current crop, if there is one
    api.get('/crop').then((c) => c && setF((x) => ({ ...x, prov: c.prov, mun: c.mun, lat: c.lat, lon: c.lon }))).catch(() => {})
  }, [open, farm])

  if (!open || !f) return null
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  const locate = async () => {
    setGeo('loading')
    try {
      const pos = await getPosition()
      const { latitude: lat, longitude: lon } = pos.coords
      const [prov, km] = nearestProvince(meta.provinces, lat, lon)
      setF((x) => ({ ...x, lat, lon, prov, mun: meta.provinces[prov].mun[0] }))
      setGeo({ km })
    } catch {
      setGeo('error')
    }
  }

  // tapped / dragged on the map → exact spot + nearest province (keep the town if the province didn't change)
  const pickOnMap = (lat, lon) => {
    const [prov, km] = nearestProvince(meta.provinces, lat, lon)
    setF((x) => ({ ...x, lat, lon, prov, mun: x.prov === prov ? x.mun : meta.provinces[prov].mun[0] }))
    setGeo({ km })
  }

  const analyze = async () => {
    setBusy(true)
    setError('')
    try {
      // STRATA crop model first (pinned spot, else the province centre); if it can't be reached, the built-in analysis still runs
      const pv = meta.provinces[f.prov]
      const [model] = await Promise.all([
        prescribe({ crop: f.crop, planted: f.planted, end: f.end, lat: f.lat ?? pv.lat, lon: f.lon ?? pv.lon, farm }).catch((e) => {
          console.warn('[model] prescribe unavailable, using built-in analysis:', e.message)
          return null
        }),
        new Promise((r) => setTimeout(r, ANALYZE_MS)),
      ])
      const plot = await api.put('/crop', { crop: f.crop, prov: f.prov, mun: f.mun, lat: f.lat, lon: f.lon, planted: f.planted, planted_end: f.end, moist: Math.round(sensor.moist), model })
      // the crop's field is the farm: keep the farm location in step so weather and advice use it
      if (farm.prov !== f.prov || farm.mun !== f.mun) await saveFarm({ ...farm, prov: f.prov, mun: f.mun })
      bumpCrop()
      setResult(plot)
      setBusy(false)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  if (result)
    return (
      <AnalysisDone
        plot={result}
        crop={crops[result.crop]}
        onDone={() => {
          setResult(null)
          close()
          openFarm()
        }}
      />
    )

  if (busy)
    return (
      <Sheet open onClose={() => {}} label={tr('Analysing your crop')}>
        <div className="flex flex-col items-center px-4 py-10 text-center" role="status">
          <Tata mood="happy" size={110} animated />
          <h2 className="mt-3 text-[22px] font-extrabold text-paddy">{tr('Tata is analysing…')}</h2>
          <p className="mt-1 mb-0 max-w-[290px] text-[15px] leading-[1.5] text-ink-soft">
            {tr('Running the STRATA crop model on 10 years of NASA climate data, plus your soil and sensor, for {crop} in {place}. This can take about 20 seconds.', { crop: crops[f.crop].fil, place: f.mun })}
          </p>
          <div className="mt-5 h-1.5 w-40 overflow-hidden rounded-full bg-surface2"><i className="block h-full w-1/2 animate-[analyze_1.1s_ease-in-out_infinite] rounded-full bg-leaf" /></div>
        </div>
      </Sheet>
    )

  const c = f.crop && crops[f.crop]
  const canNext = step === 0 ? !!f.crop : step === 2 ? !!f.planted : true
  const back = () => (step === 0 ? close() : setStep(step - 1))

  return (
    <Sheet open={open} onClose={close} label={tr('Choose your crop')}>
      <Progress step={step} />
      <h2 className="text-[22px] font-extrabold">{STEPS[step][1]}</h2>

      {step === 0 && (
        <>
          <p className="note mt-1 mb-4">{tr('Pick one. Tata will check if it’s a good choice after you finish.')}</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={tr('Crop')}>
            {meta.farm_crops.map((k) => {
              const o = crops[k], on = f.crop === k
              return (
                <button key={k} type="button" role="radio" aria-checked={on} onClick={() => setF((x) => ({ ...x, crop: k }))}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl px-1 py-3.5 ${on ? '' : 'bg-surface ring-1 ring-line'}`}
                  style={on ? { outline: `2.5px solid ${o.color}`, outlineOffset: -1, background: `color-mix(in srgb, ${o.color} 10%, white)` } : undefined}>
                  <span className="grid size-12 place-items-center rounded-[14px] text-white [&_.ic]:size-6" style={{ background: o.color }}><Icon name="sprout" /></span>
                  <b className="font-display text-[16px] leading-none">{o.fil}</b>
                  <span className="text-[12px] text-muted">{o.en}</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <p className="note mt-1 mb-4">{tr('Tata uses it to read the weather, climate and soil for your field.')}</p>
          <button type="button" onClick={locate} disabled={geo === 'loading'} className="btn btn-pri w-full">
            <Icon name="nav" />{geo === 'loading' ? tr('Finding your location…') : tr('Use my location')}
          </button>
          {geo && geo !== 'loading' && (
            <p className={`mt-2 mb-0 rounded-xl px-3 py-2 text-[13px] ${geo === 'error' ? 'bg-danger-soft text-danger' : 'bg-leaf-soft text-leaf-ink'}`}>
              {geo === 'error'
                ? tr('Couldn’t get your location. Pick your province below.')
                : geo.km > 150 ? tr('You’re outside our covered area, so we’ll use the nearest: {place}.', { place: f.prov }) : tr('Found you near {place}.', { place: f.prov })}
            </p>
          )}
          <div className="mt-3">
            <LocationMap lat={f.lat} lon={f.lon} center={[meta.provinces[f.prov].lat, meta.provinces[f.prov].lon]} onPick={pickOnMap} />
            <p className="note mt-1.5 mb-0 text-[12.5px]">
              {f.lat != null ? tr('Pinned at {lat}, {lon}. Drag the pin to adjust.', { lat: f.lat.toFixed(4), lon: f.lon.toFixed(4) }) : tr('Tap the map to pin your field.')}
            </p>
          </div>
          <div className="my-3 flex items-center gap-3 text-[12px] font-bold text-muted"><span className="h-px flex-1 bg-line" />OR PICK IT<span className="h-px flex-1 bg-line" /></div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="field-label mt-0" htmlFor="crop_prov">{tr('Province')}</label>
              <select id="crop_prov" className="field" value={f.prov} onChange={(e) => setF((x) => ({ ...x, prov: e.target.value, mun: meta.provinces[e.target.value].mun[0], lat: null, lon: null }))}>
                {Object.keys(meta.provinces).map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label mt-0" htmlFor="crop_mun">{tr('Town')}</label>
              <select id="crop_mun" className="field" value={f.mun} onChange={set('mun')}>
                {meta.provinces[f.prov].mun.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p className="note mt-1 mb-4">{tr('Pick the days you could plant {crop}. Tata checks each one for the best.', { crop: c.fil })}</p>
          <div className="rounded-[22px] bg-surface p-2 ring-1 ring-line">
            <Calendar
              mode="range"
              selected={{ from: f.planted ? parseYmd(f.planted) : undefined, to: f.end ? parseYmd(f.end) : undefined }}
              onSelect={(r) => setF((x) => ({ ...x, planted: r?.from ? ymd(r.from) : null, end: r?.to ? ymd(r.to) : null }))}
              defaultMonth={f.planted ? parseYmd(f.planted) : today}
              disabled={{ before: today }}
              max={MAX_NIGHTS - 1}
              aria-label={tr('Planting dates')}
            />
          </div>
          <p className={`mt-3 mb-0 rounded-xl px-3 py-2 text-[13.5px] ${f.planted ? 'bg-leaf-soft text-leaf-ink' : 'bg-surface2 text-muted'}`} aria-live="polite">
            {!f.planted
              ? tr('Tap the first day you can plant, then the last day.')
              : !f.end || f.end === f.planted
                ? trn('{date} · tap a later day to make it a range (up to {n} days).', { date: <b>{fmtD(parseYmd(f.planted))}</b>, n: MAX_NIGHTS })
                : trn('{range} · {n} days. Tata will find the best day in this range.', { range: <b>{fmtRange(f.planted, f.end)}</b>, n: dayCount(f.planted, f.end) })}
          </p>
        </>
      )}

      {step === 3 && (
        <div className="mt-3 rounded-[22px] bg-surface2 p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-12 flex-none place-items-center rounded-2xl text-white [&_.ic]:size-6" style={{ background: c.color }}><Icon name="sprout" /></span>
            <div>
              <div className="font-display text-[22px] leading-tight font-extrabold">{c.fil}</div>
              <div className="text-[13px] text-muted">{c.en}</div>
            </div>
          </div>
          <dl className="mt-3.5 mb-0 space-y-2.5 text-[15px] [&_dt]:text-[12px] [&_dt]:font-semibold [&_dt]:text-muted">
            {[[tr('Location'), `${f.mun}, ${f.prov}`, 1], [tr('Planting dates'), fmtRange(f.planted, f.end), 2]].map(([k, v, to]) => (
              <div key={k} className="flex items-center justify-between gap-3 border-t border-line pt-2.5">
                <div><dt>{k}</dt><dd className="m-0 font-semibold">{v}</dd></div>
                <button type="button" className="text-[13px] font-bold text-leaf" onClick={() => setStep(to)}>{tr('Edit')}</button>
              </div>
            ))}
          </dl>
        </div>
      )}

      {error && <p className="note mt-3 text-danger!" role="alert">{error}</p>}
      <div className="mt-6 flex gap-2">
        <button type="button" className="btn flex-1" onClick={back}>{step === 0 ? 'Cancel' : 'Back'}</button>
        {step < 3 ? (
          <button type="button" className="btn btn-pri flex-[2]" disabled={!canNext} onClick={() => setStep(step + 1)}>{tr('Next')}</button>
        ) : (
          <button type="button" className="btn btn-pri flex-[2]" onClick={analyze}>{tr('Analyze')}</button>
        )}
      </div>
    </Sheet>
  )
}
