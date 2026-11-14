import { useApp } from '../context/AppContext'
import { Icon } from './Icon'

function CircleButton({ icon, label, onClick, onSky }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`grid size-10 flex-none place-items-center rounded-full [&_.ic]:size-[21px] [&_.ic]:stroke-[2.2] ${onSky ? 'bg-white/22 text-white' : 'bg-chip text-[#1c2620] active:bg-[#d8dfda]'}`}
    >
      <Icon name={icon} />
    </button>
  )
}

export default function AppHeader({ onSky }) {
  const { go, setFarmSheetOpen, mode } = useApp()
  return (
    <header
      className={onSky ? 'absolute inset-x-0 top-0 z-30' : 'relative z-30 border-b border-[#dde3df] bg-white shadow-[0_1px_2px_rgb(0_0_0/0.06)]'}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex h-14 items-center gap-2 px-3.5 pt-1">
        <div className={`flex-1 font-display text-[28px] leading-none font-extrabold tracking-[-1.2px] ${onSky ? 'text-white [text-shadow:0_1px_6px_rgb(0_0_0/0.15)]' : 'text-brand'}`}>
          strata
        </div>
        <CircleButton icon="chatTrend" label={mode === 'simple' ? 'Magtanong' : 'Ask Strata'} onClick={() => go('chat')} onSky={onSky} />
        <CircleButton icon="menu" label="Farm settings" onClick={() => setFarmSheetOpen(true)} onSky={onSky} />
      </div>
    </header>
  )
}
