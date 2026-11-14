import { PAGES, useApp } from '../context/AppContext'
import { TAB_LABELS } from '../lib/labels'
import { Icon } from './Icon'

const ICON = { analysis: 'analysis', chat: 'chat', community: 'users' }

export default function TabBar() {
  const { page, go, mode } = useApp()
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 grid w-[min(430px,100%)] -translate-x-1/2 grid-cols-3 border-t border-[#dde3df] bg-white px-1 shadow-[0_-1px_3px_rgb(0_0_0/0.04)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main"
    >
      {PAGES.map((p) => {
        const on = page === p
        return (
          <button
            key={p}
            type="button"
            onClick={() => go(p)}
            aria-current={on ? 'page' : undefined}
            className={`relative flex h-[60px] flex-col items-center justify-center gap-0.5 active:bg-[#f0f3f1] simple:h-[66px] [&_.ic]:size-[27px] simple:[&_.ic]:size-[26px] ${on ? 'tab-on text-brand' : 'text-tab'}`}
          >
            {on && <span className="absolute inset-x-[22%] top-0 h-[3px] rounded-b-[3px] bg-brand" />}
            <Icon name={ICON[p]} />
            <span className="text-[12px] font-bold simple:text-[13.5px]">{TAB_LABELS[mode][p]}</span>
          </button>
        )
      })}
    </nav>
  )
}
