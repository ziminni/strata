import { useApp } from '../context/AppContext'
import { Icon } from './Icon'
import { tr } from '../lib/i18n'

/** Strata mark: soil strata with a sprout. Uses currentColor so it always matches the wordmark. */
export function StrataMark({ className = '' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 13.2V7.6" strokeWidth="2.6" />
      <path d="M15.6 9.4C12.9 9.6 10.6 8 9.8 5.2c2.8-.3 5.1 1.4 5.8 4.2z" fill="currentColor" strokeWidth="1.6" />
      <path d="M16.4 8.4c.3-3.2 2.6-5.3 5.9-5.4-.2 3.2-2.5 5.3-5.9 5.4z" fill="currentColor" strokeWidth="1.6" />
      <path d="M5.5 16.4Q10.8 13.6 16 16.4T26.5 16.4" strokeWidth="3.4" />
      <path d="M5.5 22Q10.8 19.2 16 22T26.5 22" strokeWidth="3.4" opacity="0.78" />
      <path d="M5.5 27.6Q10.8 24.8 16 27.6T26.5 27.6" strokeWidth="3.4" opacity="0.56" />
    </svg>
  )
}

// The Home header is transparent: the sky / Farm page shows through, even mid-swipe. Only the text colour blends as --home-p goes 0 → 1.
const OVERLAY = {
  brand: {
    color: 'color-mix(in srgb, #fff calc((1 - var(--home-p)) * 100%), var(--color-brand))',
    textShadow: '0 1px 6px rgb(0 0 0 / calc((1 - var(--home-p)) * 0.15))',
  },
  button: {
    color: 'color-mix(in srgb, #fff calc((1 - var(--home-p)) * 100%), #1c2620)',
  },
}

export default function AppHeader({ overlay }) {
  const { setDrawerOpen, drawerOpen } = useApp()
  return (
    <header
      className={`${overlay ? 'absolute inset-x-0 top-0 z-30' : 'relative z-30 bg-white'} lg:hidden`} // desktop: logo + menu live in the sidebar
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex h-14 items-center gap-2 px-3.5 pt-1">
        <div className={`flex flex-1 items-center gap-1.5 ${overlay ? '' : 'text-brand'}`} style={overlay ? OVERLAY.brand : undefined}>
          <StrataMark className="size-[30px] flex-none" />
          <span className="font-display text-[28px] leading-none font-extrabold tracking-[-1.2px]">strata</span>
        </div>
        <button
          type="button"
          aria-label={tr('Open menu')}
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
          className={`grid size-10 flex-none place-items-center rounded-full [&_.ic]:size-[21px] [&_.ic]:stroke-[2.2] ${overlay ? '' : 'text-[#1c2620]'} active:opacity-60`}
          style={overlay ? OVERLAY.button : undefined}
        >
          <Icon name="menu" />
        </button>
      </div>
    </header>
  )
}
