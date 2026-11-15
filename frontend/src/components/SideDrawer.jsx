import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { LANGS, langInfo, tr } from '../lib/i18n'
import { Icon } from './Icon'

const T = () => ({ title: tr('Menu'), farmer: tr('Farmer'), settings: tr('Settings'), language: tr('Language'), logout: tr('Log out'), close: tr('Close menu') })

const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)' // iOS sheet curve
const DURATION = 420
const CLOSE_DISTANCE = 80 // px dragged right before release closes it
const CLOSE_VELOCITY = 0.5 // px/ms flick

/** Right-hand sidebar opened from the header ≡ button. Swipe right to dismiss. */
export default function SideDrawer() {
  const { drawerOpen: open, setDrawerOpen, setFarmSheetOpen, logout, farm, lang, setLang, toast } = useApp()
  const t = T()
  const [langOpen, setLangOpen] = useState(false)
  useEffect(() => {
    if (!open) setLangOpen(false)
  }, [open])
  const panel = useRef(null)
  const drag = useRef(null)
  const [dx, setDx] = useState(0) // live drag offset; 0 when not dragging
  const close = () => setDrawerOpen(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false)
    window.addEventListener('keydown', onKey)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    panel.current?.focus({ preventScroll: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [open, setDrawerOpen])

  /* ---------- swipe to close ---------- */
  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), active: false }
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    const mx = e.clientX - d.x
    const my = e.clientY - d.y
    if (!d.active) {
      // start dragging only on a clear horizontal move to the right
      if (Math.abs(mx) < 8 || Math.abs(my) > Math.abs(mx)) return
      d.active = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    setDx(Math.max(0, mx))
  }
  const onPointerUp = (e) => {
    const d = drag.current
    drag.current = null
    if (!d?.active) return
    const mx = Math.max(0, e.clientX - d.x)
    const v = mx / Math.max(1, performance.now() - d.t)
    if (mx > CLOSE_DISTANCE || v > CLOSE_VELOCITY) close()
    setDx(0)
  }

  const name = farm.name.trim() || t.farmer
  const dragging = dx > 0
  const width = panel.current?.offsetWidth || 300
  const shown = open ? 1 - dx / width : 0 // 1 = fully open

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      <div
        onClick={close}
        aria-hidden="true"
        className="absolute inset-0 bg-[rgb(10_24_18/0.4)]"
        style={{ opacity: shown, transition: dragging ? 'none' : `opacity ${DURATION}ms ${EASE}` }}
      />
      {/* keep the panel aligned to the phone column on wide screens */}
      <div className="pointer-events-none relative mx-auto h-full max-w-[430px] overflow-hidden md:max-w-none">
        <aside
          ref={panel}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={t.title}
          inert={!open}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="pointer-events-auto absolute inset-y-0 right-0 flex w-[min(300px,82%)] touch-pan-y flex-col rounded-l-[28px] bg-surface outline-none will-change-transform select-none"
          style={{
            transform: `translate3d(${open ? dx : width + 24}px,0,0)`,
            transition: dragging ? 'none' : `transform ${DURATION}ms ${EASE}`,
            boxShadow: open ? '-24px 0 60px -20px rgb(10 24 18 / 0.35)' : 'none',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* drag affordance */}
          <span className="absolute top-1/2 left-2 h-10 w-1 -translate-y-1/2 rounded-full bg-line" aria-hidden="true" />

          <div className="flex justify-end px-4 pt-4">
            <button
              type="button"
              onClick={close}
              aria-label={t.close}
              className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface2 active:bg-chip [&_.ic]:size-5"
            >
              <Icon name="close" />
            </button>
          </div>

          {/* profile — display only for now */}
          <div className="px-6 pt-2 pb-6">
            <div className="grid size-16 place-items-center rounded-full bg-leaf-soft font-display text-[26px] font-bold text-leaf-ink">
              {name[0].toUpperCase()}
            </div>
            <div className="mt-3.5 truncate font-display text-[24px] leading-tight font-bold tracking-[-0.02em] simple:text-[26px]">{name}</div>
          </div>

          <div className="mx-6 h-px bg-line" />

          <nav className="px-3 pt-3" aria-label={t.title}>
            <MenuItem icon="globe" label={t.language} value={langInfo(lang).label} open={langOpen} onClick={() => setLangOpen((v) => !v)} />
            {/* language choices expand in place */}
            <div className="grid transition-[grid-template-rows] duration-300" style={{ gridTemplateRows: langOpen ? '1fr' : '0fr', transitionTimingFunction: EASE }} inert={!langOpen}>
              <div className="overflow-hidden">
                <div className="mx-1 mb-2 rounded-2xl bg-surface2 p-1.5" role="radiogroup" aria-label={t.language}>
                  {LANGS.map((l) => {
                    const on = l.code === lang
                    return (
                      <button
                        key={l.code}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => {
                          if (!on) {
                            setLang(l.code)
                            toast(tr('Language: {lang}', { lang: l.label }))
                          }
                          setLangOpen(false)
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${on ? 'bg-surface text-leaf-ink shadow-[0_1px_3px_rgb(16_34_26/0.1)]' : 'text-ink hover:bg-surface/70'}`}
                      >
                        <span className="flex-1">
                          <span className="block text-[16px] font-bold simple:text-[17px]">{l.label}</span>
                          <span className="block text-[12.5px] text-muted simple:text-[13.5px]">{l.hint}</span>
                        </span>
                        {on && <span className="text-leaf [&_.ic]:size-5"><Icon name="check" /></span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <MenuItem
              icon="settings"
              label={t.settings}
              onClick={() => {
                close()
                setFarmSheetOpen(true)
              }}
            />
          </nav>

          <div className="mt-auto px-3 pb-4">
            <MenuItem icon="logout" label={t.logout} onClick={logout} danger />
          </div>
        </aside>
      </div>
    </div>
  )
}

function MenuItem({ icon, label, value, open, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={`flex w-full items-center gap-3.5 rounded-2xl px-3 py-3.5 text-left transition-colors duration-150 [&_.ic]:size-[22px] ${
        danger ? 'text-danger hover:bg-danger-soft/60 active:bg-danger-soft' : 'text-ink hover:bg-surface2 active:bg-chip'
      }`}
    >
      <Icon name={icon} />
      <span className="flex-1 text-[16px] font-semibold simple:text-[18px]">{label}</span>
      {value && <span className="text-[14px] font-semibold text-muted simple:text-[15px]">{value}</span>}
      {!danger && (
        <span className={`text-muted transition-transform duration-300 [&_.ic]:size-[18px] ${open ? 'rotate-90' : ''}`}><Icon name="chevron" /></span>
      )}
    </button>
  )
}
