import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'

export function Pill({ tone, className = '', style, children }) {
  return <span className={`pill ${tone ? `pill-${tone}` : ''} ${className}`} style={style}>{children}</span>
}

export function Seg({ options, value, onChange, className = '', label }) {
  return (
    <div className={`seg ${className}`} role="group" aria-label={label}>
      {options.map(([v, l]) => (
        <button key={v} type="button" aria-pressed={v === value} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  )
}

export function Kpi({ label, value, sub }) {
  return (
    <div className="card relative px-3.5 pt-3.5 pb-[13px]">
      <div className="text-[10.5px] font-bold tracking-[0.08em] text-muted uppercase">{label}</div>
      <div className="mt-1 mb-1.5 font-display text-[25px] leading-tight font-bold tracking-[-0.02em] tabular-nums">{value}</div>
      <div className="text-[11.5px]">{sub}</div>
    </div>
  )
}

export function Delta({ a, b, unit = '', digits = 0 }) {
  const d = a - b
  return (
    <span className={`ml-1 rounded px-[5px] font-mono text-[11px] ${d > 0 ? 'bg-leaf-soft text-leaf-ink' : 'bg-danger-soft text-danger'}`}>
      {d > 0 ? '+' : ''}{d.toFixed(digits)}{unit}
    </span>
  )
}

const HI = { g: 'bg-leaf-soft text-leaf', b: 'bg-water-soft text-water', s: 'bg-sun-soft text-[#b77a06]', p: 'bg-plum-soft text-plum' }

export function Section({ id, icon, tone = 'g', title, action, children }) {
  return (
    <section id={id} className="mt-[22px] scroll-mt-16">
      {title && (
        <h2 className="mb-2 flex items-center gap-2.5 text-[19px] font-bold">
          {icon && (
            <span className={`grid size-8 place-items-center rounded-[10px] ${HI[tone]}`}>
              <Icon name={icon} className="size-[18px]" />
            </span>
          )}
          {title}
          {action}
        </h2>
      )}
      {children}
    </section>
  )
}

export function MoreLink({ onClick, href, children }) {
  const cls = 'ml-auto rounded-full bg-leaf-soft px-[11px] py-1.5 font-sans text-[13px] font-bold tracking-normal text-leaf'
  return href
    ? <a className={cls} href={href} target="_blank" rel="noopener noreferrer">{children}</a>
    : <button type="button" className={cls} onClick={onClick}>{children}</button>
}

const HERO_BG = {
  ok: 'from-[#1f9d55] to-paddy',
  info: 'from-water to-paddy',
  warn: 'from-sun to-[#9a5b00]',
  bad: 'from-[#ef6a3a] to-[#b3261e]',
}

export function Glow() {
  return <div className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-radial from-white/18 to-transparent to-70%" />
}

/** Gradient status card used for the field status on the Analysis tab. */
export function FieldHero({ tone, icon, title, children }) {
  return (
    <div className={`relative flex items-center gap-3.5 overflow-hidden rounded-3xl bg-linear-135 p-[18px] text-white shadow-hero ${HERO_BG[tone]}`}>
      <Glow />
      <div className="grid size-12 flex-none place-items-center rounded-2xl bg-white/18"><Icon name={icon} className="size-6" /></div>
      <div className="text-[13.5px] leading-[1.45] opacity-95">
        <b className="mb-0.5 block font-display text-[18px] font-bold">{title}</b>
        {children}
      </div>
    </div>
  )
}
export { HERO_BG }

export function Sheet({ open, onClose, label, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])
  if (!open) return null
  // portal to #app-root so the sheet keeps Simple-mode styles but escapes transformed parents
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgb(13_35_26/0.45)] backdrop-blur-[3px] md:items-center md:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className="max-h-[88vh] w-full max-w-[430px] overflow-auto rounded-t-[28px] bg-surface px-4 pt-[18px] pb-6 md:max-w-[520px] md:rounded-[28px] md:px-6">
        <div className="mx-auto mb-3 h-1 w-10 rounded-sm bg-[#d8d1bf]" />
        {children}
      </div>
    </div>,
    document.getElementById('app-root') || document.body,
  )
}

export function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="field-label">{label}{children}</label>
    </div>
  )
}
