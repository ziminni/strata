import { FieldHero, Kpi, Pill, Section } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useApi } from '../../hooks/useApi'
import { r1, signed } from '../../lib/format'

export function FieldStatus() {
  const { sensor, riceNow, todayState } = useApp()
  if (!riceNow)
    return (
      <FieldHero tone="info" icon="radio" title="No rice in the field right now">
        Your sensor tracks soil moisture ({r1(sensor.moist)} %) {todayState?.prep ? 'during land preparation' : 'while the field rests'}. Water-level alerts turn on once palay is planted.
      </FieldHero>
    )
  if (sensor.water <= -15)
    return (
      <FieldHero tone="bad" icon="drop" title="Your field needs water">
        AWD tube shows {r1(sensor.water)} cm, below −15 cm. Irrigate to about +5 cm today.
      </FieldHero>
    )
  return (
    <FieldHero tone="ok" icon="check" title="Field conditions OK">
      Paddy water at {signed(sensor.water)} cm.
    </FieldHero>
  )
}

export default function TodaySection() {
  const { sensor, riceNow, meta, farmVersion } = useApp()
  const { data } = useApi('/climate?scenario=ssp245', [farmVersion])
  const base = data?.baseline
  const future = data?.summary
  return (
    <Section id="s_today">
      <FieldStatus />
      <div className="mt-2.5 grid grid-cols-2 gap-3">
        <Kpi
          label="Paddy water"
          value={signed(sensor.water) + ' cm'}
          sub={!riceNow ? <Pill>No rice planted</Pill> : sensor.water <= -15 ? <Pill tone="bad">Irrigate now</Pill> : <Pill tone="blue">Sensor · live</Pill>}
        />
        <Kpi label="Soil moisture" value={r1(sensor.moist) + ' %'} sub={<Pill tone="blue">Sensor · live</Pill>} />
        {base && (
          <>
            <Kpi label="Dry-season rain" value={base.ds + ' mm'} sub={<Pill tone="sun">{future.ds - base.ds} mm by 2050</Pill>} />
            <Kpi label="Hottest month" value={base.hot.toFixed(1) + ' °C'} sub={<Pill tone="sun">{base.hot_month} · +{meta.scenarios.ssp245.dT} °C by 2050</Pill>} />
          </>
        )}
      </div>
    </Section>
  )
}
