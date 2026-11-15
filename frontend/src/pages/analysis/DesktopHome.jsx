import TataBuddy from '../../components/TataBuddy'
import TataTip from '../../components/TataTip'
import { useApp } from '../../context/AppContext'
import { useApi } from '../../hooks/useApi'
import CropsPage from '../CropsPage'
import FertilizerAlert from './FertilizerAlert'
import SeasonOutlook from './SeasonOutlook'
import SensorGlance from './SensorGlance'
import WeatherSky from './WeatherSky'
import { MONTHS_LONG } from '../../lib/format'
import { getLang, tr } from '../../lib/i18n'

// Desktop-only Home (≥1024px, Simple mode). Phones and tablets keep the swipeable Dashboard | Farm layout.
// Main column: weather → Tata recommends → season outlook. Side column: my crop → fertilizer → field sensor.

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function greeting(d) {
  const h = d.getHours()
  return h < 12 ? tr('Good morning') : h < 18 ? tr('Good afternoon') : tr('Good evening')
}

function TopBar({ farm, place, onCrop, hasCrop }) {
  const now = new Date()
  const name = farm.name?.trim().split(/\s+/)[0]
  return (
    <div className="mb-5 flex items-end justify-between gap-6 px-1">
      <div className="min-w-0">
        <h1 className="m-0 text-[30px] leading-tight font-extrabold text-paddy">{greeting(now)}{name ? `, ${name}` : ''}</h1>
        <p className="mt-1 mb-0 text-[15px] text-muted">
          {place ? `${place} · ` : ''}{getLang() === 'en' ? now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' }) : `${tr(WEEKDAYS[now.getDay()])}, ${MONTHS_LONG[now.getMonth()]} ${now.getDate()}`}
        </p>
      </div>
      <button type="button" className="btn btn-pri flex-none px-5" onClick={onCrop}>
        <span className="text-[18px] leading-none">+</span> {hasCrop ? tr('Change crop') : tr('Choose your crop')}
      </button>
    </div>
  )
}

export default function DesktopHome() {
  const { farm, farmVersion, cropVersion, setCropSheetOpen } = useApp()
  const { data: clim } = useApi('/climate?scenario=now', [farmVersion])
  const { data: myCrop, loading: cropLoading } = useApi('/crop', [farmVersion, cropVersion])
  const openCrop = () => setCropSheetOpen(true)

  if (!clim || (cropLoading && !myCrop)) return <div className="h-[420px] animate-pulse rounded-[28px] bg-surface2" aria-label={tr('Loading')} />

  // no crop yet → no location, so no weather or advice: one welcome panel
  if (!myCrop)
    return (
      <>
        <TopBar farm={farm} onCrop={openCrop} hasCrop={false} />
        <section className="overflow-hidden rounded-[28px] shadow-card [&_.sky]:mx-0" aria-label={tr('Get started')}>
          <div className="sky sky-cloud flex flex-col items-center py-16!">
            <TataBuddy size={140} bubble="top" lines={[tr('Where is your farm?'), tr('Add your crop to start!'), tr('I’ll check the weather for you!')]} />
            <h2 className="mt-5 font-sans text-[30px] leading-tight font-extrabold">{tr('Add your crop to see your farm’s weather')}</h2>
            <p className="mt-2 mb-0 max-w-[460px] text-[16px] leading-[1.5] opacity-95">{tr('Tell Tata what you’re planting and where your field is. Then you’ll get the weather, the STRATA planting check and advice for your field.')}</p>
            <button type="button" className="btn btn-pri mt-6 w-full max-w-[300px]" onClick={openCrop}>
              <span className="text-[18px] leading-none">+</span> {tr('Choose your crop')}
            </button>
          </div>
        </section>
      </>
    )

  const series = clim.summary.series
  return (
    <>
      <TopBar farm={farm} place={`${myCrop.mun}, ${myCrop.prov}`} onCrop={openCrop} hasCrop />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(340px,400px)] items-start gap-6">
        <div className="min-w-0">
          {/* the phone "sky" becomes a rounded weather panel */}
          <div className="overflow-hidden rounded-[28px] shadow-card [&_.sky]:mx-0">
            <WeatherSky clim={series} lat={clim.province.lat} lon={clim.province.lon} />
          </div>
          <TataTip clim={series} field={myCrop} />
          <SeasonOutlook clim={series} />
        </div>
        <aside className="min-w-0" aria-label={tr('My crop')}>
          <CropsPage embedded />
          <FertilizerAlert clim={series} />
          <SensorGlance />
        </aside>
      </div>
    </>
  )
}
