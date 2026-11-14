import Tata from '../../components/Tata'
import { useApp } from '../../context/AppContext'
import DashCard from './DashCard'

function Tile({ value, unit, label, warn }) {
  return (
    <div className="rounded-2xl bg-surface2 px-2 py-2.5 text-center">
      <div className={`font-display text-[20px] leading-tight font-extrabold tabular-nums ${warn ? 'text-danger' : ''}`}>
        {value}<span className="text-[13px] font-bold">{unit}</span>
      </div>
      <div className="mt-0.5 text-[11.5px] font-semibold text-muted">{label}</div>
    </div>
  )
}

/** Live field sensor at a glance; Tata gets thirsty when the soil is dry. */
export default function SensorGlance() {
  const { sensor } = useApp()
  const moist = Math.round(sensor.moist)
  const dry = moist < 35
  const water = Math.round(sensor.water)
  const live = (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-soft px-2.5 py-1 text-[11.5px] font-bold text-leaf-ink">
      <i className={`size-1.5 rounded-full bg-leaf ${sensor.running ? 'animate-pulse' : ''}`} />{sensor.running ? 'Live' : 'Paused'}
    </span>
  )
  return (
    <DashCard icon="radio" tone="b" title="Field sensor" aside={live}>
      <div className="grid grid-cols-3 gap-2">
        <Tile value={moist} unit="%" label="Soil moisture" warn={dry} />
        <Tile value={water > 0 ? `+${water}` : water} unit=" cm" label="Water level" warn={water <= -15} />
        <Tile value={sensor.soilT.toFixed(1)} unit="°" label="Soil temp" />
      </div>
      <div className={`mt-3 flex items-center gap-3 rounded-2xl px-3 py-2 ${dry ? 'bg-danger-soft' : 'bg-leaf-soft'}`}>
        <Tata mood={dry ? 'thirsty' : 'happy'} size={44} className="flex-none" />
        <p className={`m-0 text-[14px] leading-[1.4] font-semibold ${dry ? 'text-danger' : 'text-leaf-ink'}`}>
          {dry ? 'Your field is thirsty. Water it today.' : water <= -15 ? 'Water is getting low. Plan to irrigate in a day or two.' : 'Soil moisture is good. No need to water today.'}
        </p>
      </div>
    </DashCard>
  )
}
