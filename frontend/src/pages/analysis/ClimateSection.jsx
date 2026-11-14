import { useMemo, useState } from 'react'
import ChartCanvas from '../../components/ChartCanvas'
import { Delta, Kpi, Section, Seg } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useApi } from '../../hooks/useApi'
import { MON, r1 } from '../../lib/format'
import { SCENARIO_OPTIONS } from '../../lib/labels'

function chartConfig(c, now, isNow) {
  const ds = [{ type: 'bar', label: 'Rain ' + (isNow ? '(today)' : '(2050)'), data: c.P, backgroundColor: 'rgba(31,116,194,.75)', borderRadius: 6, yAxisID: 'y', order: 2 }]
  if (!isNow) ds.push({ type: 'bar', label: 'Rain (today)', data: now.P, backgroundColor: 'rgba(31,116,194,.18)', borderRadius: 6, yAxisID: 'y', order: 3 })
  ds.push({ type: 'line', label: 'Avg max temp', data: c.X.map(r1), borderColor: '#e59f12', backgroundColor: '#e59f12', borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 4, tension: 0.35, yAxisID: 'y1', order: 0 })
  if (!isNow) ds.push({ type: 'line', label: 'Avg max temp (today)', data: now.X.map(r1), borderColor: 'rgba(229,159,18,.45)', borderDash: [4, 3], pointRadius: 0, tension: 0.35, yAxisID: 'y1', order: 1 })
  return {
    type: 'bar',
    data: { labels: MON, datasets: ds },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { boxWidth: 10, font: { size: 11 } } } },
      scales: {
        y: { title: { display: true, text: 'Rain (mm/month)' }, grid: { color: '#eee8da' } },
        y1: { position: 'right', title: { display: true, text: '°C' }, grid: { display: false }, suggestedMin: 28, suggestedMax: 38 },
      },
    },
  }
}

export default function ClimateSection() {
  const { farm, meta, farmVersion } = useApp()
  const [scen, setScen] = useState('now')
  const { data } = useApi(`/climate?scenario=${scen}`, [farmVersion])
  const isNow = scen === 'now'
  const config = useMemo(() => data && chartConfig(data.summary.series, data.baseline.series, data.scenario === 'now'), [data])

  const cs = data?.summary
  const c0 = data?.baseline
  const dT = meta.scenarios[scen].dT
  return (
    <Section id="s_climate" icon="sun" tone="s" title="Climate · NASA">
      <div className="card">
        {data && (
          <p className="note mb-2">
            {farm.mun}, {farm.prov} (≈{data.province.lat.toFixed(2)}°N, {data.province.lon.toFixed(2)}°E) · showing {data.label}
          </p>
        )}
        <Seg className="mb-2.5" label="Climate scenario" value={scen} onChange={setScen} options={SCENARIO_OPTIONS} />
        {cs && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Kpi label="Yearly rain" value={cs.ann + ' mm'} sub={!isNow && <Delta a={cs.ann} b={c0.ann} unit=" mm" />} />
              <Kpi label="Dry-season rain (Nov–May)" value={cs.ds + ' mm'} sub={!isNow && <Delta a={cs.ds} b={c0.ds} unit=" mm" />} />
              <Kpi label="Hottest month (avg max)" value={`${cs.hot.toFixed(1)} °C`} sub={<span className="note">{cs.hot_month}{!isNow && <Delta a={cs.hot} b={c0.hot} unit="°C" digits={1} />}</span>} />
              <Kpi label="Rainy season starts" value={cs.onset} sub={<span className="note">{cs.dry} dry months</span>} />
            </div>
            <ChartCanvas config={config} className="relative mt-3 h-[220px]" label="Monthly rain and average maximum temperature" />
          </>
        )}
        <div className="mt-2 text-[11.5px] text-muted">
          NASA POWER (T2M_MAX, PRECTOTCORR) · NASA NEX-GDDP-CMIP6. Prototype values approximate Central Luzon; the live app pulls your exact coordinates.
        </div>
        {cs && (
          <details className="disclosure" open>
            <summary>What this means for your farm ▾</summary>
            <ul className="mt-2.5 list-disc pl-[18px] text-[13.5px] [&>li]:my-[3px]">
              <li>The rainy season usually starts in <b>{c0.onset}</b>. Plant wet-season palay once rains are steady (around mid-June).</li>
              <li>
                The dry season (Nov–May) brings only about <b>{c0.ds} mm</b> of rain
                {farm.water !== 'canal' && ', so a second rice crop depends on water you may not have'}.
              </li>
              {!isNow && (
                <li>
                  By 2050 the dry season could get about <b>{Math.abs(cs.ds - c0.ds)} mm drier</b> and <b>{dT} °C hotter</b>. Crops that flower in March–April face more heat stress.
                </li>
              )}
              <li>
                {cs.hot_month} afternoons average <b>{cs.hot.toFixed(1)} °C</b>. Rice and vegetables lose pollen above about 35 °C, so dry-season crops should flower before the peak heat.
              </li>
              <li>Short, drought-tolerant crops planted right after harvest (monggo, mani, pakwan) use leftover soil moisture and finish before the hottest weeks.</li>
            </ul>
          </details>
        )}
      </div>
    </Section>
  )
}
