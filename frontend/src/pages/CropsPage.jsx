import { useEffect, useState } from 'react'
import { api } from '../api'
import AddCropSheet, { TIER } from '../components/AddCropSheet'
import { Icon } from '../components/Icon'
import Tata from '../components/Tata'
import { useApp } from '../context/AppContext'
import { dayDiff, fmtD, parseYmd } from '../lib/format'

const WATER_LABEL = { canal: 'Irrigated', limited: 'Limited water', rainfed: 'Rain only' }

function FieldCard({ p, crops, moist, onRemove }) {
  const [confirm, setConfirm] = useState(false)
  const c = crops[p.crop]
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()) // compare whole days
  const day = dayDiff(today, parseYmd(p.planted)) + 1
  const progress = Math.min(1, Math.max(0, day / c.days))
  const status = day < 1 ? `Planting in ${1 - day} day${day === 0 ? '' : 's'}` : day > c.days ? 'Ready to harvest' : `Day ${day} of ${c.days}`
  const t = TIER[p.tier]
  const warns = p.reasons.filter((r) => r.warn)
  const top = (warns.length ? warns : p.reasons).slice(0, 2)
  const dry = moist < 35

  return (
    <article className="card overflow-hidden p-0">
      <div className="flex items-center gap-3 px-4 pt-4">
        <span className="grid size-12 flex-none place-items-center rounded-2xl text-white [&_.ic]:size-6" style={{ background: c.color }}><Icon name="sprout" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <b className="font-display text-[20px] leading-tight font-extrabold">{c.fil}</b>
            <span className="truncate text-[13px] text-muted">{c.en}</span>
          </div>
          <div className="truncate text-[13px] text-muted">{p.name} · {p.mun} · {p.area} ha</div>
        </div>
        <span className={`flex-none rounded-full px-2.5 py-1 text-[11px] font-bold ${t.pill}`}>{t.label}</span>
      </div>

      <div className="px-4 pt-3.5">
        <div className="flex items-center justify-between text-[13px] font-semibold">
          <span>{status}</span>
          <span className="text-muted">Harvest ~{fmtD(parseYmd(p.harvest))}</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface2" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <i className="block h-full rounded-full bg-linear-90 from-[#6cc58a] to-leaf transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {/* live conditions */}
      <div className="mx-4 mt-3.5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-surface2 px-2 py-2.5">
          <div className={`font-display text-[18px] font-extrabold tabular-nums ${dry ? 'text-danger' : ''}`}>{moist}%</div>
          <div className="text-[11px] font-semibold text-muted">Soil moisture</div>
        </div>
        <div className="rounded-2xl bg-surface2 px-2 py-2.5">
          <div className="font-display text-[18px] font-extrabold tabular-nums">{p.score}</div>
          <div className="text-[11px] font-semibold text-muted">Fit score</div>
        </div>
        <div className="rounded-2xl bg-surface2 px-2 py-2.5">
          <div className="truncate font-display text-[15px] leading-[27px] font-extrabold">{WATER_LABEL[p.water]}</div>
          <div className="text-[11px] font-semibold text-muted">Water</div>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5 px-4 text-[13.5px]">
        {dry && (
          <li className="flex gap-2 text-danger"><span className="flex-none [&_.ic]:size-4"><Icon name="drop" /></span>Sensor says the soil is dry. Water the field soon.</li>
        )}
        {top.map((r, i) => (
          <li key={i} className={`flex gap-2 ${r.warn ? 'text-danger' : 'text-ink-soft'}`}>
            <span className="flex-none [&_.ic]:size-4"><Icon name={r.warn ? 'alert' : 'check'} /></span>{r.text}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex justify-end border-t border-line px-2 py-1.5">
        <button
          type="button"
          onClick={() => (confirm ? onRemove(p.id) : setConfirm(true))}
          onBlur={() => setConfirm(false)}
          className={`rounded-xl px-3 py-2 text-[13px] font-bold transition-colors ${confirm ? 'bg-danger text-white' : 'text-muted hover:bg-surface2'}`}
        >
          {confirm ? 'Tap again to remove' : 'Remove'}
        </button>
      </div>
    </article>
  )
}

/** Farm tab: the farmer's fields and crops, each analysed with weather, climate, soil and the sensor. */
export default function CropsPage() {
  const { crops, sensor, toast, bumpPlots } = useApp()
  const [plots, setPlots] = useState(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    api.get('/plots').then(setPlots).catch(() => setPlots([]))
  }, [])

  const remove = async (id) => {
    try {
      await api.del(`/plots/${id}`)
      setPlots((xs) => xs.filter((x) => x.id !== id))
      bumpPlots()
      toast('Field removed')
    } catch (e) {
      toast(e.message)
    }
  }

  const moist = Math.round(sensor.moist)
  return (
    <section className="px-4 pt-2 pb-2.5" aria-label="My farm">
      {plots && plots.length > 0 && (
        <div className="mb-3 flex items-center">
          <h1 className="flex-1 text-[24px] font-extrabold">My crops</h1>
          <button type="button" className="btn btn-pri btn-sm" onClick={() => setAdding(true)}><span className="text-[16px] leading-none">+</span> Add crop</button>
        </div>
      )}

      {plots === null && <p className="note py-10 text-center">Loading your fields…</p>}

      {plots && plots.length === 0 && (
        <div className="card mt-2 flex flex-col items-center px-6 py-8 text-center">
          <Tata mood="happy" size={120} />
          <h2 className="mt-3 text-[24px] leading-tight font-extrabold text-paddy">Let’s add your first crop</h2>
          <p className="mt-2 mb-5 text-[15px] leading-[1.5] text-ink-soft">
            Tell Tata where your field is. He’ll check today’s weather, future climate, your soil and sensor, then show which crops fit best.
          </p>
          <button type="button" className="btn btn-pri w-full" onClick={() => setAdding(true)}>
            <span className="text-[18px] leading-none">+</span> Add a crop
          </button>
        </div>
      )}

      {plots && plots.length > 0 && (
        <div className="space-y-3">
          {plots.map((p) => <FieldCard key={p.id} p={p} crops={crops} moist={moist} onRemove={remove} />)}
        </div>
      )}

      <AddCropSheet
        open={adding}
        onClose={() => setAdding(false)}
        fieldCount={plots?.length || 0}
        onAdded={(p) => {
          setPlots((xs) => [p, ...(xs || [])])
          bumpPlots()
          toast(`${crops[p.crop].fil} added to your farm`)
        }}
      />
    </section>
  )
}
