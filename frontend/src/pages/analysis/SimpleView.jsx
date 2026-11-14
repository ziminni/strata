import { useApp } from '../../context/AppContext'
import { useApi } from '../../hooks/useApi'
import WeatherSky from './WeatherSky'

// Simple dashboard: just the weather for now. The other cards live in DashboardCards.jsx until we decide what goes here.
export default function SimpleView() {
  const { farmVersion } = useApp()
  const { data: clim } = useApi('/climate?scenario=now', [farmVersion])
  if (!clim) return <div className="sky sky-sun min-h-[60vh]" />
  return <WeatherSky clim={clim.summary.series} lat={clim.province.lat} lon={clim.province.lon} />
}
