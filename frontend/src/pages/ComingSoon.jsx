import { Icon } from '../components/Icon'
import { useApp } from '../context/AppContext'
import { tr, localized } from '../lib/i18n'

const CONTENT = localized({
  diagnose: {
    icon: 'scan',
    title: { simple: 'Check your farm', detailed: 'Tap-to-Diagnose' },
    lead: {
      simple: 'Pick a crop, a task and dates. Strata tells you GO, HOLD or PIVOT using NASA data.',
      detailed: 'Pick crop, action and dates, tap a question, and get a GO / HOLD / PIVOT verdict from NASA data.',
    },
    steps: ['Location · crop · task · dates', 'Tap a question', 'GO / HOLD / PIVOT + 3 rotation strategies', 'Share to your barangay grid'],
  },
  map: {
    icon: 'map',
    title: { simple: 'Farm map', detailed: 'NASA map' },
    lead: {
      simple: 'See soil moisture, rain, crop greenness and heat from NASA satellites.',
      detailed: 'NASA GIBS overlays (SMAP, IMERG, NDVI, LST) with the 10 km shared-pixel grid and neighbor pins.',
    },
    steps: ['SMAP soil moisture', 'GPM / IMERG rain', 'MODIS NDVI', 'Land surface temperature'],
  },
})

export default function ComingSoon({ page }) {
  const { mode } = useApp()
  const c = CONTENT[page]
  return (
    <section className="px-4 pt-4 pb-2.5">
      <div className="relative overflow-hidden rounded-[26px] bg-linear-135 from-leaf to-paddy px-5 py-6 text-white shadow-hero">
        <div className="grid size-14 place-items-center rounded-2xl bg-white/18 [&_.ic]:size-7"><Icon name={c.icon} /></div>
        <h1 className="mt-4 text-[28px] leading-tight font-extrabold">{c.title[mode]}</h1>
        <p className="mt-2 text-[16px] leading-[1.45] opacity-95">{c.lead[mode]}</p>
        <span className="mt-4 inline-block rounded-full bg-white/20 px-3 py-1 text-[13px] font-bold">{tr('Coming next')}</span>
      </div>
      <ol className="card mt-3.5">
        {c.steps.map((s, i) => (
          <li key={s} className="flex items-center gap-3 border-b border-dashed border-line py-3 last:border-0">
            <span className="grid size-8 flex-none place-items-center rounded-xl bg-leaf-soft font-display font-extrabold text-leaf-ink">{i + 1}</span>
            <span className="font-semibold">{s}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
