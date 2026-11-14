import TataTip from '../../components/TataTip'
import { useApp } from '../../context/AppContext'
import { useApi } from '../../hooks/useApi'
import WeatherSky from './WeatherSky'

// Simple dashboard: weather + Tata's planting tip. Parked cards live in DashboardCards.jsx.
export default function SimpleView() {
  const { farmVersion, plotsVersion } = useApp()
  const { data: clim } = useApi('/climate?scenario=now', [farmVersion])
  const { data: plots } = useApi('/plots', [farmVersion, plotsVersion])
  if (!clim) return <div className="sky sky-sun min-h-[60vh]" />
  const series = clim.summary.series
  return (
    <>
      <WeatherSky clim={series} lat={clim.province.lat} lon={clim.province.lon} />
      {plots && <TataTip clim={series} field={plots[0]} />}
    </>
  )
}
