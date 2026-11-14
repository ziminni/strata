import { useCallback, useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { dots } from '../lib/format'
import { Seg, Sheet } from './ui'

const PRIORITIES = [
  ['soil', 'Healthier soil'],
  ['water', 'Saving water'],
  ['inc', 'Income'],
  ['res', 'Safe from drought & heat'],
  ['simp', 'Less work & cost'],
]

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )
}

function Num({ label, value, onChange, ...rest }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input className="field" type="number" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </div>
  )
}

export default function FarmSheet() {
  const { farmSheetOpen: open, setFarmSheetOpen, farm, meta, saveFarm, toast, mode, setMode } = useApp()
  const [f, setF] = useState(farm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (open) {
      setF(farm)
      setError('')
    }
  }, [open, farm])
  const close = useCallback(() => setFarmSheetOpen(false), [setFarmSheetOpen])
  if (!open || !f) return null

  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }))
  const setW = (k, v) => setF((x) => ({ ...x, w: { ...x.w, [k]: v } }))
  const provinces = Object.keys(meta.provinces)

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await saveFarm({
        ...f,
        name: f.name.trim(),
        area: +f.area || 1,
        ph: +f.ph || 5.9,
        om: +f.om || 1.6,
        budget: +f.budget,
        labor: +f.labor,
      })
      close()
      toast('Farm saved · analysis updated')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onClose={close} label="Farm settings">
      <h2 className="mb-2 text-lg font-bold">View / Itsura</h2>
      <Seg
        className="mb-1.5"
        label="View mode"
        value={mode}
        onChange={(m) => {
          close()
          setMode(m)
        }}
        options={[['simple', 'Simple (magsasaka)'], ['detailed', 'Detailed (technician)']]}
      />
      <p className="note mb-3.5">Simple: Filipino, big text, voice. Detailed: all scores, charts and NASA data.</p>

      <h2 className="text-lg font-bold">My farm</h2>
      <label className="field-label" htmlFor="f_name">Farmer / farm name</label>
      <input id="f_name" className="field" type="text" placeholder="e.g. Mang Ramon's farm" value={f.name} onChange={(e) => set('name')(e.target.value)} />
      <div className="grid grid-cols-2 gap-2.5">
        <Select label="Province" value={f.prov} onChange={(v) => setF((x) => ({ ...x, prov: v, mun: meta.provinces[v].mun[0] }))} options={provinces.map((p) => [p, p])} />
        <Select label="Municipality" value={f.mun} onChange={set('mun')} options={meta.provinces[f.prov].mun.map((m) => [m, m])} />
        <Num label="Size (ha)" value={f.area} onChange={set('area')} min="0.1" step="0.1" />
        <Select label="Water source" value={f.water} onChange={set('water')} options={[['canal', 'Canal, reliable'], ['limited', 'Limited in dry season'], ['rainfed', 'Rainfed only']]} />
        <Select label="Soil texture" value={f.tex} onChange={set('tex')} options={[['clay', 'Clay (lagkit)'], ['clayloam', 'Clay loam'], ['loam', 'Loam (galas)'], ['sandy', 'Sandy loam']]} />
        <Select label="Drainage" value={f.drain} onChange={set('drain')} options={[['poor', 'Stays flooded'], ['mod', '1–2 days'], ['good', 'Quick']]} />
        <Num label="Soil pH" value={f.ph} onChange={set('ph')} step="0.1" min="4" max="9" />
        <Num label="Organic matter %" value={f.om} onChange={set('om')} step="0.1" min="0.2" max="8" />
        <Select label="Wet season" value={f.wet} onChange={set('wet')} options={[['rice', 'Palay']]} />
        <Select label="Dry season now" value={f.dry} onChange={set('dry')} options={[['rice', 'Palay again'], ['fallow', 'Fallow'], ['monggo', 'Monggo'], ['sibuyas', 'Sibuyas'], ['mais', 'Mais']]} />
        <Select label="Rice straw" value={f.straw} onChange={set('straw')} options={[['burn', 'Burned'], ['remove', 'Removed'], ['incorporate', 'Plowed in']]} />
        <Select label="Budget" value={String(f.budget)} onChange={set('budget')} options={[['2', 'Low'], ['3.5', 'Medium'], ['5', 'High / loan']]} />
      </div>
      <Select label="Labor" value={String(f.labor)} onChange={set('labor')} options={[['2.5', 'Family only'], ['3.5', 'Family + some hired'], ['5', 'Hired crew / machines']]} />

      <h3 className="mt-3.5 mb-1.5 text-[15px] font-semibold">What matters most</h3>
      {PRIORITIES.map(([k, l]) => (
        <div key={k} className="grid grid-cols-[1fr_auto] items-center gap-x-2">
          <label className="field-label mt-2 mb-0" htmlFor={`w_${k}`}>{l}</label>
          <output className="mt-2 font-mono text-[12px] text-leaf" htmlFor={`w_${k}`}>{dots(f.w[k])}</output>
          <input id={`w_${k}`} className="col-span-2 accent-leaf" type="range" min="0" max="5" value={f.w[k]} onChange={(e) => setW(k, +e.target.value)} />
        </div>
      ))}

      <div className="mt-4 flex gap-2">
        <button type="button" className="btn flex-1" onClick={close}>Cancel</button>
        <button type="button" className="btn btn-pri flex-[2]" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save farm'}</button>
      </div>
      {error && <p className="note mt-2 text-danger!" role="alert">{error}</p>}
    </Sheet>
  )
}
