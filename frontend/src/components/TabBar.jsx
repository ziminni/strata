import { useApp } from '../context/AppContext'
import { TAB_LABELS } from '../lib/labels'
import { Icon } from './Icon'
import { tr } from '../lib/i18n'

const TABS = ['analysis', 'chat', 'community']
const ICON = { analysis: 'home', chat: 'chat', community: 'users' }
const PRIMARY = 'chat' // raised center button
// pages reached from a tab (not tabs themselves) keep that tab highlighted
const PARENT = {}
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'

/** Floating pill navbar. A highlight slides between the side tabs; the chat button floats in the middle. */
export default function TabBar() {
  const { page: route, go, mode } = useApp()
  const page = PARENT[route] || route
  const activeIndex = TABS.indexOf(page)
  const sideActive = activeIndex !== -1 && TABS[activeIndex] !== PRIMARY

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
    >
      <nav
        aria-label={tr('Main')}
        className="pointer-events-auto relative grid h-[68px] w-full max-w-[398px] grid-cols-3 items-center rounded-[26px] border border-white/70 bg-white/85 px-2 shadow-[0_12px_32px_-10px_rgb(13_59_44/0.35),0_2px_6px_rgb(13_59_44/0.06)] backdrop-blur-xl simple:h-[74px]"
      >
        {/* sliding highlight behind the active side tab */}
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 left-2 w-[calc((100%-16px)/3)] rounded-[20px] bg-leaf-soft"
          style={{
            transform: `translateX(${Math.max(0, activeIndex) * 100}%)`,
            opacity: sideActive ? 1 : 0,
            transition: `transform 380ms ${EASE}, opacity 200ms ease`,
          }}
        />
        {TABS.map((p) => {
          const on = page === p
          const label = TAB_LABELS[mode][p]
          if (p === PRIMARY)
            return (
              <div key={p} className="relative flex h-full justify-center">
                <button
                  type="button"
                  onClick={() => go(p)}
                  aria-current={on ? 'page' : undefined}
                  aria-label={label}
                  className={`absolute -top-5 grid size-[60px] place-items-center rounded-full bg-linear-135 from-leaf to-paddy text-white transition-[transform,box-shadow] duration-300 active:scale-95 [&_.ic]:size-[27px] [&_.ic]:stroke-[2.1] ${
                    on
                      ? 'shadow-[0_10px_24px_-8px_rgb(13_59_44/0.8),0_0_0_5px_#fff,0_0_0_9px_var(--color-leaf-soft)]'
                      : 'shadow-[0_10px_24px_-8px_rgb(13_59_44/0.7),0_0_0_5px_#fff]'
                  }`}
                >
                  <Icon name={ICON[p]} />
                </button>
                <span className={`absolute bottom-[9px] whitespace-nowrap text-[11.5px] font-extrabold transition-colors simple:text-[12.5px] ${on ? 'text-brand' : 'text-paddy'}`}>{label}</span>
              </div>
            )
          return (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              aria-current={on ? 'page' : undefined}
              className={`relative z-10 flex h-full flex-col items-center justify-center gap-1 rounded-[20px] transition-colors duration-200 active:scale-[0.97] [&_.ic]:size-6 simple:[&_.ic]:size-[26px] ${on ? 'tab-on text-brand' : 'text-tab hover:text-ink'}`}
            >
              <Icon name={ICON[p]} />
              <span className="text-[12px] font-bold simple:text-[13px]">{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
