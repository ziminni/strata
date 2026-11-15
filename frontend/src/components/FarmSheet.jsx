import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { useApp } from '../context/AppContext'
import { fmtD, parseYmd } from '../lib/format'
import { Icon } from './Icon'
import { dots } from '../lib/format'
import { Seg, Sheet } from './ui'
import { tr, localized } from '../lib/i18n'

const PRIORITIES = localized([
  ['soil', 'Healthier soil'],
  ['water', 'Saving water'],
  ['inc', 'Income'],
  ['res', 'Safe from drought & heat'],
  ['simp', 'Less work & cost'],
])

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

/** "My crop" row: the farmer's one crop, and the way to choose or change it. */
function MyCrop({ onChoose }) {
  const { crops, cropVersion } = useApp()
  const [plot, setPlot] = useState(undefined)
  useEffect(() => {
    api.get('/crop').then(setPlot).catch(() => setPlot(null))
  }, [cropVersion])
  const c = plot && crops[plot.crop]
  return (
    <div className="mb-4 flex items-center gap-3 rounded-[20px] bg-surface2 p-3">
      <span className="grid size-11 flex-none place-items-center rounded-[14px] text-white [&_.ic]:size-[22px]" style={{ background: c ? c.color : '#b9c4ba' }}><Icon name="sprout" /></span>
      <div className="min-w-0 flex-1">
        {plot === undefined ? <span className="text-[14px] text-muted">{tr('Loading…')}</span> : c ? (
          <>
            <b className="block font-display text-[17px] leading-tight">{c.fil} <span className="text-[13px] font-semibold text-muted">{c.en}</span></b>
            <span className="text-[12.5px] text-muted">{tr('Planted {date}', { date: fmtD(parseYmd(plot.planted)) })} · {plot.mun}</span>
          </>
        ) : (
          <>
            <b className="block text-[15px]">{tr('No crop yet')}</b>
            <span className="text-[12.5px] text-muted">{tr('Tata will recommend one for your field')}</span>
          </>
        )}
      </div>
      <button type="button" className={`btn btn-sm flex-none ${c ? '' : 'btn-pri'}`} onClick={onChoose}>{c ? 'Change' : 'Choose'}</button>
    </div>
  )
}

export default function FarmSheet() {
  const { farmSheetOpen: open, setFarmSheetOpen, setCropSheetOpen, farm, meta, saveFarm, toast, mode, setMode } = useApp()
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
      toast(tr('Farm saved · analysis updated'))
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onClose={close} label={tr('Farm settings')}>
      <h2 className="mb-2 text-lg font-bold">{tr('View')}</h2>
      <Seg
        className="mb-1.5"
        label={tr('View mode')}
        value={mode}
        onChange={(m) => {
          close()
          setMode(m)
        }}
        options={[['simple', tr('Simple (farmer)')], ['detailed', tr('Detailed (technician)')]]}
      />
      <p className="note mb-3.5">{tr('Simple: big text, just what to do. Detailed: all scores, charts and NASA data.')}</p>

      <h2 className="mb-2 text-lg font-bold">{tr('My crop')}</h2>
      <MyCrop onChoose={() => { close(); setCropSheetOpen(true) }} />

      <h2 className="text-lg font-bold">{tr('My farm')}</h2>
      <label className="field-label" htmlFor="f_name">{tr('Farmer / farm name')}</label>
      <input id="f_name" className="field" type="text" placeholder="e.g. Mang Ramon's farm" value={f.name} onChange={(e) => set('name')(e.target.value)} />
      <div className="grid grid-cols-2 gap-2.5">
        <Select label={tr('Province')} value={f.prov} onChange={(v) => setF((x) => ({ ...x, prov: v, mun: meta.provinces[v].mun[0] }))} options={provinces.map((p) => [p, p])} />
        <Select label={tr('Municipality')} value={f.mun} onChange={set('mun')} options={meta.provinces[f.prov].mun.map((m) => [m, m])} />
        <Num label={tr('Size (ha)')} value={f.area} onChange={set('area')} min="0.1" step="0.1" />
        <Select label={tr('Water source')} value={f.water} onChange={set('water')} options={[['canal', tr('Canal, reliable')], ['limited', tr('Limited in dry season')], ['rainfed', tr('Rainfed only')]]} />
        <Select label={tr('Soil texture')} value={f.tex} onChange={set('tex')} options={[['clay', tr('Clay (lagkit)')], ['clayloam', tr('Clay loam')], ['loam', tr('Loam (galas)')], ['sandy', tr('Sandy loam')]]} />
        <Select label={tr('Drainage')} value={f.drain} onChange={set('drain')} options={[['poor', tr('Stays flooded')], ['mod', '1–2 days'], ['good', 'Quick']]} />
        <Num label={tr('Soil pH')} value={f.ph} onChange={set('ph')} step="0.1" min="4" max="9" />
        <Num label={tr('Organic matter %')} value={f.om} onChange={set('om')} step="0.1" min="0.2" max="8" />
        <Select label={tr('Wet season')} value={f.wet} onChange={set('wet')} options={[['rice', 'Palay']]} />
        <Select label={tr('Dry season now')} value={f.dry} onChange={set('dry')} options={[['rice', tr('Palay again')], ['fallow', 'Fallow'], ['monggo', 'Monggo'], ['sibuyas', 'Sibuyas'], ['mais', 'Mais']]} />
        <Select label={tr('Rice straw')} value={f.straw} onChange={set('straw')} options={[['burn', 'Burned'], ['remove', 'Removed'], ['incorporate', tr('Plowed in')]]} />
        <Select label={tr('Budget')} value={String(f.budget)} onChange={set('budget')} options={[['2', 'Low'], ['3.5', 'Medium'], ['5', tr('High / loan')]]} />
      </div>
      <Select label={tr('Labor')} value={String(f.labor)} onChange={set('labor')} options={[['2.5', tr('Family only')], ['3.5', tr('Family + some hired')], ['5', tr('Hired crew / machines')]]} />

      <h3 className="mt-3.5 mb-1.5 text-[15px] font-semibold">{tr('What matters most')}</h3>
      {PRIORITIES.map(([k, l]) => (
        <div key={k} className="grid grid-cols-[1fr_auto] items-center gap-x-2">
          <label className="field-label mt-2 mb-0" htmlFor={`w_${k}`}>{l}</label>
          <output className="mt-2 font-mono text-[12px] text-leaf" htmlFor={`w_${k}`}>{dots(f.w[k])}</output>
          <input id={`w_${k}`} className="col-span-2 accent-leaf" type="range" min="0" max="5" value={f.w[k]} onChange={(e) => setW(k, +e.target.value)} />
        </div>
      ))}

      <div className="mt-4 flex gap-2">
        <button type="button" className="btn flex-1" onClick={close}>{tr('Cancel')}</button>
        <button type="button" className="btn btn-pri flex-[2]" onClick={save} disabled={saving}>{saving ? tr('Saving…') : tr('Save farm')}</button>
      </div>
      {error && <p className="note mt-2 text-danger!" role="alert">{error}</p>}
    </Sheet>
  )
}
