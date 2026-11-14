import { Icon } from '../../components/Icon'

const TONE = { g: 'bg-leaf-soft text-leaf', b: 'bg-water-soft text-water', s: 'bg-sun-soft text-[#b77a06]', r: 'bg-danger-soft text-danger' }

/** Shared shell for the Simple dashboard cards (matches Tata's card). */
export default function DashCard({ icon, tone = 'g', title, aside, label, className = '', children }) {
  return (
    <section className={`tip-in mt-3 rounded-[26px] bg-surface p-5 shadow-card ${className}`} aria-label={label || title}>
      <h2 className="mb-3 flex items-center gap-2.5 text-[17px] font-extrabold">
        <span className={`grid size-8 flex-none place-items-center rounded-[10px] [&_.ic]:size-[18px] ${TONE[tone]}`}><Icon name={icon} /></span>
        <span className="flex-1">{title}</span>
        {aside}
      </h2>
      {children}
    </section>
  )
}
