import { useCallback, useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { fmtD, ymd } from '../lib/format'
import { QA_TYPES } from '../lib/labels'
import { stateOn } from '../lib/season'
import { MicButton } from './Speech'
import { Seg, Sheet } from './ui'

export default function LogSheet() {
  const { logRequest: req, setLogRequest, crops, meta, season, mode, addLog, toast } = useApp()
  const [f, setF] = useState(null)
  const [saving, setSaving] = useState(false)
  const simple = mode === 'simple'

  useEffect(() => {
    if (!req) return
    const st = season ? stateOn(season.segs, crops, req.date) : null
    setF({
      date: ymd(req.date), type: req.type || 'planting', crop: meta.farm_crops.includes(st?.seg.crop) ? st.seg.crop : 'rice',
      amount: '', cost: '', yield: '', cavan: '', bagKg: '50', notes: '', visibility: 'private',
    })
  }, [req, season, crops, meta])
  const close = useCallback(() => setLogRequest(null), [setLogRequest])
  if (!req || !f) return null

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target ? e.target.value : e }))
  const title = simple
    ? `${(QA_TYPES[f.type] || ['Log'])[0]} · ${fmtD(req.date)}`
    : 'Log for ' + req.date.toLocaleDateString('en-PH', { month: 'long', day: 'numeric' })

  const save = async () => {
    if (!f.date) return toast('Pick a date')
    setSaving(true)
    try {
      await addLog({
        date: f.date, type: f.type, crop: f.crop, amount: f.amount.trim(), cost: +f.cost || 0,
        yield_kg: +f.yield || (+f.cavan || 0) * (+f.bagKg || 50), notes: f.notes.trim(), visibility: f.visibility,
      })
      close()
      toast(simple ? 'Saved!' : 'Log saved' + (f.visibility === 'community' ? ' and shared' : ''))
    } catch (e) {
      toast(e.message)
    } finally {
      setSaving(false)
    }
  }

  const cropOptions = meta.farm_crops.map((k) => <option key={k} value={k}>{crops[k].fil} ({crops[k].en})</option>)

  return (
    <Sheet open onClose={close} label={title}>
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="grid grid-cols-2 gap-2.5 simple:hidden">
        <div><label className="field-label">Date</label><input className="field" type="date" value={f.date} onChange={set('date')} /></div>
        <div><label className="field-label">Type</label>
          <select className="field" value={f.type} onChange={set('type')}>
            {Object.entries(meta.log_types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></div>
        <div><label className="field-label">Crop</label><select className="field" value={f.crop} onChange={set('crop')}>{cropOptions}</select></div>
        <div><label className="field-label">Amount</label><input className="field" type="text" placeholder="e.g. 2 bags urea" value={f.amount} onChange={set('amount')} /></div>
        <div><label className="field-label">Cost (₱)</label><input className="field" type="number" min="0" value={f.cost} onChange={set('cost')} /></div>
        <div><label className="field-label">Yield (kg)</label><input className="field" type="number" min="0" value={f.yield} onChange={set('yield')} /></div>
      </div>
      {f.type === 'harvest' && (
        <div className="grid grid-cols-2 gap-2.5">
          <div><label className="field-label">Ilang kaban/sako?</label><input className="field" type="number" min="0" inputMode="numeric" value={f.cavan} onChange={set('cavan')} /></div>
          <div><label className="field-label">Timbang bawat sako (kg)</label><input className="field" type="number" min="1" value={f.bagKg} onChange={set('bagKg')} /></div>
        </div>
      )}
      <label className="field-label" htmlFor="lmNotes">{simple ? 'What happened? (you can speak)' : 'Notes'}</label>
      <div className="flex items-start gap-2">
        <textarea
          id="lmNotes"
          className="field"
          placeholder={simple ? 'e.g. lots of rats at the edge of the field…' : 'What happened? Pests, weather, how the crop looks…'}
          value={f.notes}
          onChange={set('notes')}
        />
        <MicButton value={f.notes} onChange={(v) => setF((x) => ({ ...x, notes: v }))} onDenied={() => toast('Microphone is off. Please type instead.')} />
      </div>
      <label className="field-label">Who can see this?</label>
      <Seg
        label="Visibility"
        value={f.visibility}
        onChange={set('visibility')}
        options={[['private', 'Only me'], ['community', 'Share to community']]}
      />
      <div className="mt-4 flex gap-2">
        <button type="button" className="btn flex-1" onClick={close}>Cancel</button>
        <button type="button" className="btn btn-pri flex-[2]" onClick={save} disabled={saving}>{simple ? 'Save' : 'Save log'}</button>
      </div>
    </Sheet>
  )
}
