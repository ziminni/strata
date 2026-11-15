import { useMemo } from 'react'
import ChartCanvas from '../../components/ChartCanvas'
import { Kpi, MoreLink, Pill, Section } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { r1, signed } from '../../lib/format'
import { tr } from '../../lib/i18n'

export default function SensorSection() {
  const { sensor, riceNow, toast } = useApp()
  const config = useMemo(() => {
    const labels = sensor.hist.map((h) => new Date(h.t).toLocaleTimeString('en-PH', { hour: 'numeric' }))
    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: tr('Water level (cm)'), data: sensor.hist.map((h) => r1(h.w)), borderColor: '#1f74c2', borderWidth: 2.5, backgroundColor: 'rgba(31,116,194,.14)', fill: true, tension: 0.3, pointRadius: 0 },
          { label: tr('AWD threshold'), data: labels.map(() => -15), borderColor: '#dc4b2f', borderDash: [5, 4], pointRadius: 0 },
        ],
      },
      options: {
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { labels: { boxWidth: 10, font: { size: 11 } } } },
        scales: { y: { min: -25, max: 10, grid: { color: '#eee8da' } }, x: { ticks: { maxTicksLimit: 8 } } },
      },
    }
  }, [sensor.hist])

  const smap = r1(sensor.moist * 0.82 + 4)
  const waterPill = !riceNow ? <Pill>{tr('Field drained')}</Pill>
    : sensor.water <= -15 ? <Pill tone="bad">{tr('Below AWD threshold')}</Pill>
    : sensor.water < 0 ? <Pill tone="sun">{tr('Drying')}</Pill>
    : <Pill tone="ok">{tr('Flooded')}</Pill>

  return (
    <Section id="s_sensor" icon="radio" tone="b" title={tr('Field sensor')} action={<MoreLink href="https://claude.ai/artifact/J8tPRazLz9qgoiMPDn6zSH">3D model ↗</MoreLink>}>
      <div className="grid grid-cols-2 gap-3">
        <Kpi label={tr('Paddy water')} value={signed(sensor.water) + ' cm'} sub={waterPill} />
        <Kpi label={tr('Soil moisture')} value={r1(sensor.moist) + ' %'} sub={<Pill tone="blue">Capacitive v1.2</Pill>} />
        <Kpi label={tr('Soil temperature')} value={r1(sensor.soilT) + ' °C'} sub={<Pill>DS18B20</Pill>} />
        <Kpi label={tr('Battery')} value={sensor.battery.toFixed(2) + ' V'} sub={<Pill tone="ok">{tr('Solar charging')}</Pill>} />
      </div>
      <div className="card mt-2.5">
        <h3 className="mb-1.5 text-[15px] font-semibold">{tr('Paddy water, last 24 h')}</h3>
        <ChartCanvas config={config} animate={false} className="relative h-[190px]" label={tr('Paddy water level over the last 24 hours')} />
        <p className="note">{tr('Dashed line: AWD threshold (−15 cm). Simulated device')} <span className="font-mono">FS-NE-0012</span>.</p>
        <table className="mt-1.5 w-full border-collapse text-[13.5px] [&_td]:border-b [&_td]:border-line [&_td]:p-1.5 [&_th]:border-b [&_th]:border-line [&_th]:p-1.5 [&_th]:text-left [&_th]:text-[12px] [&_th]:font-medium [&_th]:text-muted">
          <thead><tr><th /><th>{tr('Your sensor')}</th><th>{tr('NASA SMAP (9 km)')}</th></tr></thead>
          <tbody>
            <tr><td>{tr('Soil moisture')}</td><td className="font-mono">{r1(sensor.moist)} %</td><td className="font-mono">{smap} % <span className="note">{tr('(est.)')}</span></td></tr>
            <tr><td>{tr('Difference')}</td><td colSpan={2} className="font-mono">{tr('{n} points', { n: r1(sensor.moist - smap) })}</td></tr>
          </tbody>
        </table>
        <div className="mt-2.5 flex gap-2">
          <button type="button" className="btn btn-sm" onClick={() => { sensor.irrigate(); toast(tr('Irrigation started (simulated)')) }}>{tr('Irrigate now')}</button>
          <button type="button" className="btn btn-sm" onClick={sensor.toggle}>{sensor.running ? 'Pause' : 'Resume'}</button>
        </div>
      </div>
    </Section>
  )
}
