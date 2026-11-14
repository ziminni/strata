import { useApp } from '../../context/AppContext'
import { greeting } from '../../lib/format'
import ClimateSection from './ClimateSection'
import LogsSection from './LogsSection'
import PlansSection from './PlansSection'
import SeasonSection from './SeasonSection'
import SensorSection from './SensorSection'
import TodaySection from './TodaySection'

const JUMPS = [['s_today', 'Today'], ['s_season', 'Season'], ['s_plans', 'Plans'], ['s_climate', 'Climate'], ['s_sensor', 'Sensor'], ['s_logs', 'Logs']]

export default function DetailedView() {
  const { farm, setMode } = useApp()
  return (
    <>
      <h1 className="mt-2.5 mb-0.5 text-[28px] font-extrabold">{greeting(farm.name)}</h1>
      <p className="note m-0">{farm.mun}, {farm.prov} · {farm.area} ha · {{ canal: 'irrigated', limited: 'limited water', rainfed: 'rainfed' }[farm.water]}</p>
      <nav className="no-scrollbar sticky top-0 z-20 -mx-4 flex gap-1.5 overflow-x-auto bg-canvas px-4 py-2.5" aria-label="Jump to section">
        {JUMPS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className="rounded-xl bg-surface px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap text-muted shadow-[0_1px_2px_rgb(16_34_26/0.06)] hover:text-ink"
            onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
          >
            {label}
          </button>
        ))}
      </nav>
      <TodaySection />
      <SeasonSection />
      <PlansSection />
      <ClimateSection />
      <SensorSection />
      <LogsSection />
      <button type="button" className="mx-auto mt-[22px] mb-1 block font-bold text-leaf" onClick={() => setMode('simple')}>
        Bumalik sa simpleng view
      </button>
    </>
  )
}
