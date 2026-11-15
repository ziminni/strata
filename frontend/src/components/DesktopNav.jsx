import { useApp } from '../context/AppContext'
import { TAB_LABELS } from '../lib/labels'
import { StrataMark } from './AppHeader'
import { Icon } from './Icon'
import { tr } from '../lib/i18n'

const TABS = ['analysis', 'chat', 'community']
const ICON = { analysis: 'home', chat: 'chat', community: 'users' }

/**
 * Desktop only (≥1024px): top navigation bar that replaces the bottom tab bar and the header.
 * Logo left · icon tabs centred (active = green + underline) · settings + profile right. Hidden on phones and tablets.
 */
export default function DesktopNav() {
  const { page, go, mode, farm, setDrawerOpen, drawerOpen, setFarmSheetOpen, farmSheetOpen } = useApp()
  const name = farm.name?.trim() || 'Farmer'
  const initial = name.charAt(0).toUpperCase()
  return (
    <header className="fixed inset-x-0 top-0 z-40 hidden h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-line bg-surface/95 px-4 shadow-[0_1px_2px_rgb(13_59_44/0.06)] backdrop-blur-xl lg:grid">
      {/* left: logo */}
      <button type="button" onClick={() => go('analysis')} className="flex items-center gap-1.5 justify-self-start rounded-xl px-1 text-brand" aria-label={tr('Strata home')}>
        <StrataMark className="size-[34px] flex-none" />
        <span className="font-display text-[26px] leading-none font-extrabold tracking-[-1.2px]">strata</span>
      </button>

      {/* centre: icon tabs */}
      <nav aria-label={tr('Main')} className="flex h-16 items-stretch gap-2">
        {TABS.map((p) => {
          const on = page === p
          const label = TAB_LABELS[mode][p]
          return (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              aria-current={on ? 'page' : undefined}
              aria-label={label}
              title={label}
              className={`group relative flex w-[112px] items-center justify-center ${on ? 'tab-on text-brand' : 'text-tab'}`}
            >
              <span className={`grid h-12 w-full place-items-center rounded-xl transition-colors [&_.ic]:size-[26px] ${on ? '' : 'group-hover:bg-surface2 group-hover:text-ink'}`}>
                <Icon name={ICON[p]} />
              </span>
              <span className={`absolute inset-x-1 bottom-0 h-[3px] rounded-t-full bg-brand transition-opacity ${on ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
            </button>
          )
        })}
      </nav>

      {/* right: settings + profile */}
      <div className="flex items-center gap-2 justify-self-end">
        <button
          type="button"
          onClick={() => setFarmSheetOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={farmSheetOpen}
          aria-label={tr('Settings')}
          title={tr('Settings')}
          className="grid size-10 place-items-center rounded-full bg-surface2 text-ink transition-colors hover:bg-line [&_.ic]:size-[21px]"
        >
          <Icon name="settings" />
        </button>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          aria-label={`${name} — open menu`}
          title={name}
          className="relative grid size-10 place-items-center rounded-full bg-leaf font-display text-[17px] font-extrabold text-white ring-2 ring-surface transition-[filter] hover:brightness-110"
        >
          {initial}
          <span className="absolute -right-0.5 -bottom-0.5 grid size-4 place-items-center rounded-full bg-surface2 text-ink ring-2 ring-surface [&_.ic]:size-3 [&_.ic]:stroke-[2.6]" aria-hidden="true">
            <Icon name="chevronDown" />
          </span>
        </button>
      </div>
    </header>
  )
}
