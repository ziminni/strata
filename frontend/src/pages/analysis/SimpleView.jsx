import TataBuddy from '../../components/TataBuddy'
import TataTip from '../../components/TataTip'
import { useApp } from '../../context/AppContext'
import { useApi } from '../../hooks/useApi'
import FertilizerAlert from './FertilizerAlert'
import SeasonOutlook from './SeasonOutlook'
import SensorGlance from './SensorGlance'
import WeatherSky from './WeatherSky'

// Simple dashboard: weather, Tata's planting tip (+7-day strip), fertilizer alert, sensor, season outlook. Parked cards live in DashboardCards.jsx.
export default function SimpleView() {
  const { farmVersion, cropVersion, setCropSheetOpen } = useApp()
  const { data: clim } = useApi('/climate?scenario=now', [farmVersion])
  const { data: myCrop, loading: cropLoading } = useApi('/crop', [farmVersion, cropVersion])
  if (!clim || (cropLoading && !myCrop)) return <div className="sky sky-sun min-h-[60vh]" />

  // no crop yet → no location, so no weather, advice or sensor; ask for the crop (and its location) first
  if (!myCrop)
    return (
      <>
        {/* neutral sky (no weather) so the floating header stays readable */}
        <section className="sky sky-cloud flex flex-col items-center" aria-label="Get started">
          <TataBuddy size={120} bubble="top" lines={['Where is your farm?', 'Add your crop to start!', 'I’ll check the weather for you!']} />
          <h1 className="mt-4 font-sans text-[24px] leading-tight font-extrabold">Add your crop to see<br />your farm’s weather</h1>
          <p className="mt-2 mb-0 max-w-[300px] text-[15px] leading-[1.45] opacity-95">Tell Tata what you’re planting and where your field is. Then you’ll get the weather and advice for your field.</p>
          <button type="button" className="btn btn-pri mt-5 mb-4 w-full max-w-[280px]" onClick={() => setCropSheetOpen(true)}>
            <span className="text-[18px] leading-none">+</span> Choose your crop
          </button>
        </section>
      </>
    )

  const series = clim.summary.series
  return (
    <>
      <WeatherSky clim={series} lat={clim.province.lat} lon={clim.province.lon} />
      <TataTip clim={series} field={myCrop} />
      <FertilizerAlert clim={series} />
      <SensorGlance />
      <SeasonOutlook clim={series} />
    </>
  )
}
