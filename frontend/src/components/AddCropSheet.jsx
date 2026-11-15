import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { useApp } from '../context/AppContext'
import { fmtD, parseYmd, ymd } from '../lib/format'
import { getPosition, nearestProvince } from '../lib/geo'
import { Icon } from './Icon'
import Tata from './Tata'
import { Seg, Sheet } from './ui'

export const TIER = {
  recommended: { label: 'Recommended', pill: 'bg-leaf-soft text-leaf-ink', ring: 'ring-leaf', dot: 'bg-leaf' },
  possible: { label: 'Possible', pill: 'bg-sun-soft text-sun-ink', ring: 'ring-sun', dot: 'bg-sun' },
  not_recommended: { label: 'Not recommended', pill: 'bg-danger-soft text-danger', ring: 'ring-danger', dot: 'bg-danger' },
}
const GROUPS = [
  ['recommended', 'Recommended for you'],
  ['possible', 'Possible, with care'],
  ['not_recommended', 'Not recommended right now'],
]
const STEPS = ['Your field', 'Choose a crop', 'Review']
const WATER = [['canal', 'Irrigated'], ['limited', 'Limited'], ['rainfed', 'Rain only']]

function Steps({ step }) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between text-[12.5px] font-bold text-muted">
        <span>Step {step} of 3</span>
        <span className="text-ink">{STEPS[step - 1]}</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {STEPS.map((s, i) => (
          <span key={s} className={`h-1.5 rounded-full transition-colors duration-300 ${i < step ? 'bg-leaf' : 'bg-surface2'}`} />
        ))}
      </div>
    </div>
  )
}

function CropOption({ c, selected, onSelect }) {
  const t = TIER[c.tier]
  const top = c.reasons[0]
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full rounded-2xl bg-surface p-3 text-left ring-1 transition-shadow ${selected ? `ring-2 ${t.ring} shadow-card` : 'ring-line hover:ring-[#cdd6cd]'}`}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-11 flex-none place-items-center rounded-[14px] text-white [&_.ic]:size-[22px]" style={{ background: c.color }}>
          <Icon name="sprout" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <b className="font-display text-[17px] font-bold">{c.fil}</b>
            <span className="truncate text-[13px] text-muted">{c.en}</span>
          </div>
          <div className={`truncate text-[12.5px] ${top?.warn ? 'text-danger' : 'text-muted'}`}>{top?.text}</div>
        </div>
        <div className="flex-none text-right">
          <div className="font-display text-[20px] leading-none font-extrabold tabular-nums">{c.score}</div>
          <div className="text-[10.5px] font-semibold text-muted">fit</div>
        </div>
      </div>
      {selected && (
        <ul className="mt-2.5 space-y-1 border-t border-line pt-2.5 text-[13px]">
          {c.reasons.map((r, i) => (
            <li key={i} className={`flex gap-2 ${r.warn ? 'text-danger' : 'text-ink-soft'}`}>
              <span className="flex-none [&_.ic]:size-4"><Icon name={r.warn ? 'alert' : 'check'} /></span>
              {r.text}
            </li>
          ))}
          <li className="flex gap-2 text-ink-soft"><span className="flex-none [&_.ic]:size-4"><Icon name="calendar" /></span>Ready in about {c.days} days, around {fmtD(parseYmd(c.harvest))}.</li>
        </ul>
      )}
    </button>
  )
}

/** 3-step flow: where is the field → which crop (ranked by AI + sensor) → review. */
export default function AddCropSheet({ open, onClose, onAdded, fieldCount }) {
  const { meta, farm, sensor, toast } = useApp()
  const fresh = useCallback(
    () => ({
      name: `Field ${fieldCount + 1}`, prov: farm.prov, mun: farm.mun, lat: null, lon: null,
      area: '1', water: farm.water, planted: ymd(new Date()), crop: null, ack: false,
    }),
    [farm, fieldCount],
  )
  const [step, setStep] = useState(1)
  const [f, setF] = useState(fresh)
  const [geo, setGeo] = useState(null) // null | 'loading' | {km} | 'error'
  const [advice, setAdvice] = useState(null)
  const [adviceError, setAdviceError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setStep(1)
      setF(fresh())
      setGeo(null)
      setAdvice(null)
    }
  }, [open, fresh])

  // (re)analyse whenever the place, water or date changes
  const moist = Math.round(sensor.moist)
  useEffect(() => {
    if (!open || step < 2) return
    let alive = true
    setAdviceError('')
    const q = new URLSearchParams({ prov: f.prov, water: f.water, start: f.planted, moist })
    api.get(`/crop-advice?${q}`).then((d) => alive && setAdvice(d)).catch((e) => alive && setAdviceError(e.message))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step >= 2, f.prov, f.water, f.planted])

  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))
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

  const chosen = advice?.crops.find((c) => c.crop === f.crop)
  const needsAck = chosen?.tier === 'not_recommended'
  const canNext = step === 1 ? !!f.prov && +f.area > 0 : step === 2 ? !!chosen && (!needsAck || f.ack) : true

  const save = async () => {
    setSaving(true)
    try {
      const plot = await api.post('/plots', {
        name: f.name, prov: f.prov, mun: f.mun, lat: f.lat, lon: f.lon, area: +f.area, water: f.water,
        crop: f.crop, planted: f.planted, moist, acknowledged: f.ack,
      })
      onAdded(plot)
      onClose()
    } catch (e) {
      toast(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} label="Add a crop">
      <Steps step={step} />

      {step === 1 && (
        <>
          <h2 className="text-[22px] font-extrabold">Where is your field?</h2>
          <p className="note mt-1 mb-3">Strata uses the location to read NASA weather, climate and soil data for your field.</p>

          <button type="button" onClick={locate} disabled={geo === 'loading'} className="btn btn-pri w-full">
            <Icon name="nav" />{geo === 'loading' ? 'Finding your location…' : 'Use my location'}
          </button>
          {geo && geo !== 'loading' && (
            <p className={`mt-2 mb-0 rounded-xl px-3 py-2 text-[13px] ${geo === 'error' ? 'bg-danger-soft text-danger' : 'bg-leaf-soft text-leaf-ink'}`}>
              {geo === 'error'
                ? 'Couldn’t get your location. Allow location access, or pick your province below.'
                : geo.km > 150
                  ? `You’re outside our covered area, so we’ll use the nearest: ${f.prov}.`
                  : `Found you near ${f.prov} (${f.lat.toFixed(3)}, ${f.lon.toFixed(3)}).`}
            </p>
          )}

          <div className="my-3 flex items-center gap-3 text-[12px] font-bold text-muted"><span className="h-px flex-1 bg-line" />OR PICK IT<span className="h-px flex-1 bg-line" /></div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="field-label mt-0">Province</label>
              <select className="field" value={f.prov} onChange={(e) => setF((x) => ({ ...x, prov: e.target.value, mun: meta.provinces[e.target.value].mun[0], lat: null, lon: null }))}>
                {Object.keys(meta.provinces).map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label mt-0">Town</label>
              <select className="field" value={f.mun} onChange={set('mun')}>
                {meta.provinces[f.prov].mun.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Field name</label>
              <input className="field" type="text" value={f.name} onChange={set('name')} maxLength={40} />
            </div>
            <div>
              <label className="field-label">Size (hectares)</label>
              <input className="field" type="number" min="0.01" step="0.1" inputMode="decimal" value={f.area} onChange={set('area')} />
            </div>
          </div>
          <label className="field-label">Water source</label>
          <Seg label="Water source" value={f.water} onChange={set('water')} options={WATER} />
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-[22px] font-extrabold">What will you plant?</h2>
          <p className="note mt-1 mb-3">Ranked for {f.mun} using this season’s weather, the 2050 outlook, your soil, and your sensor (soil moisture {moist}%).</p>
          <label className="field-label mt-0">Planting date</label>
          <input className="field mb-3" type="date" value={f.planted} onChange={set('planted')} />

          {adviceError && <p className="note text-danger!">{adviceError}</p>}
          {!advice && !adviceError && (
            <div className="flex flex-col items-center py-8 text-center">
              <Tata mood="happy" size={84} />
              <p className="mt-2 font-semibold">Tata is checking the weather, soil and sensor…</p>
            </div>
          )}
          {advice &&
            GROUPS.map(([tier, title]) => {
              const list = advice.crops.filter((c) => c.tier === tier)
              if (!list.length) return null
              return (
                <div key={tier} className="mb-3">
                  <div className="mb-1.5 flex items-center gap-2 text-[13px] font-bold">
                    <span className={`size-2.5 rounded-full ${TIER[tier].dot}`} />
                    {title}
                    <span className="font-semibold text-muted">· {list.length}</span>
                  </div>
                  <div className="space-y-2">
                    {list.map((c) => (
                      <CropOption key={c.crop} c={c} selected={f.crop === c.crop} onSelect={() => setF((x) => ({ ...x, crop: c.crop, ack: false }))} />
                    ))}
                  </div>
                </div>
              )
            })}

          {needsAck && (
            <div className="sticky bottom-0 -mx-4 mt-2 border-t border-[#f3cbbf] bg-danger-soft px-4 py-3">
              <div className="flex items-start gap-2 text-danger">
                <span className="mt-0.5 flex-none"><Icon name="alert" /></span>
                <div>
                  <b className="block">{chosen.fil} isn’t recommended here right now</b>
                  <span className="text-[13px] text-ink-soft">You can still plant it, but expect a higher risk of a poor harvest.</span>
                </div>
              </div>
              <label className="mt-2.5 flex items-center gap-2.5 text-[14px] font-semibold">
                <input type="checkbox" className="size-5 accent-danger" checked={f.ack} onChange={(e) => setF((x) => ({ ...x, ack: e.target.checked }))} />
                I understand the risk. Plant it anyway.
              </label>
            </div>
          )}
        </>
      )}

      {step === 3 && chosen && (
        <>
          <h2 className="text-[22px] font-extrabold">Ready to add?</h2>
          <div className="mt-3 rounded-[22px] bg-surface2 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-12 flex-none place-items-center rounded-2xl text-white [&_.ic]:size-6" style={{ background: chosen.color }}><Icon name="sprout" /></span>
              <div className="min-w-0 flex-1">
                <div className="font-display text-[22px] leading-tight font-extrabold">{chosen.fil}</div>
                <div className="text-[13px] text-muted">{chosen.en}</div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${TIER[chosen.tier].pill}`}>{TIER[chosen.tier].label} · {chosen.score}</span>
            </div>
            <dl className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2.5 text-[14px] [&_dt]:text-[12px] [&_dt]:font-semibold [&_dt]:text-muted">
              <div><dt>Field</dt><dd className="font-semibold">{f.name} · {f.area} ha</dd></div>
              <div><dt>Location</dt><dd className="font-semibold">{f.mun}</dd></div>
              <div><dt>Planting</dt><dd className="font-semibold">{fmtD(parseYmd(f.planted))}</dd></div>
              <div><dt>Harvest</dt><dd className="font-semibold">~{fmtD(parseYmd(chosen.harvest))}</dd></div>
              <div><dt>Water</dt><dd className="font-semibold">{WATER.find(([v]) => v === f.water)[1]}</dd></div>
              <div><dt>Soil moisture now</dt><dd className="font-semibold">{moist}%</dd></div>
            </dl>
          </div>
          {chosen.tier === 'not_recommended' && (
            <p className="mt-3 mb-0 flex gap-2 rounded-2xl bg-danger-soft px-3 py-2.5 text-[13.5px] text-danger"><Icon name="alert" />You chose a crop Strata doesn’t recommend here. Tata will keep a closer eye on it.</p>
          )}
        </>
      )}

      <div className="mt-5 flex gap-2">
        <button type="button" className="btn flex-1" onClick={() => (step === 1 ? onClose() : setStep(step - 1))}>{step === 1 ? 'Cancel' : 'Back'}</button>
        {step < 3 ? (
          <button type="button" className={`btn flex-[2] ${needsAck && step === 2 ? 'bg-danger! text-white' : 'btn-pri'}`} disabled={!canNext} onClick={() => setStep(step + 1)}>
            {step === 2 && needsAck ? 'Plant anyway' : 'Next'}
          </button>
        ) : (
          <button type="button" className="btn btn-pri flex-[2]" disabled={saving} onClick={save}>{saving ? 'Adding…' : 'Add to my farm'}</button>
        )}
      </div>
    </Sheet>
  )
}
