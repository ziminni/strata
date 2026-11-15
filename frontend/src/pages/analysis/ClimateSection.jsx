import { useMemo, useState } from 'react'
import ChartCanvas from '../../components/ChartCanvas'
import { Delta, Kpi, Section, Seg } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useApi } from '../../hooks/useApi'
import { MON, r1 } from '../../lib/format'
import { SCENARIO_OPTIONS } from '../../lib/labels'
import { tr, trn } from '../../lib/i18n'

function chartConfig(c, now, isNow) {
  const ds = [{ type: 'bar', label: tr('Rain ') + (isNow ? '(today)' : '(2050)'), data: c.P, backgroundColor: 'rgba(31,116,194,.75)', borderRadius: 6, yAxisID: 'y', order: 2 }]
  if (!isNow) ds.push({ type: 'bar', label: tr('Rain (today)'), data: now.P, backgroundColor: 'rgba(31,116,194,.18)', borderRadius: 6, yAxisID: 'y', order: 3 })
  ds.push({ type: 'line', label: tr('Avg max temp'), data: c.X.map(r1), borderColor: '#e59f12', backgroundColor: '#e59f12', borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 4, tension: 0.35, yAxisID: 'y1', order: 0 })
  if (!isNow) ds.push({ type: 'line', label: tr('Avg max temp (today)'), data: now.X.map(r1), borderColor: 'rgba(229,159,18,.45)', borderDash: [4, 3], pointRadius: 0, tension: 0.35, yAxisID: 'y1', order: 1 })
  return {
    type: 'bar',
    data: { labels: MON, datasets: ds },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { boxWidth: 10, font: { size: 11 } } } },
      scales: {
        y: { title: { display: true, text: tr('Rain (mm/month)') }, grid: { color: '#eee8da' } },
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
    <Section id="s_climate" icon="sun" tone="s" title={tr('Climate · NASA')}>
      <div className="card">
        {data && (
          <p className="note mb-2">
            {farm.mun}, {farm.prov} (≈{data.province.lat.toFixed(2)}°N, {data.province.lon.toFixed(2)}°E) · showing {data.label}
          </p>
        )}
        <Seg className="mb-2.5" label={tr('Climate scenario')} value={scen} onChange={setScen} options={SCENARIO_OPTIONS} />
        {cs && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Kpi label={tr('Yearly rain')} value={cs.ann + ' mm'} sub={!isNow && <Delta a={cs.ann} b={c0.ann} unit=" mm" />} />
              <Kpi label={tr('Dry-season rain (Nov–May)')} value={cs.ds + ' mm'} sub={!isNow && <Delta a={cs.ds} b={c0.ds} unit=" mm" />} />
              <Kpi label={tr('Hottest month (avg max)')} value={`${cs.hot.toFixed(1)} °C`} sub={<span className="note">{tr(cs.hot_month)}{!isNow && <Delta a={cs.hot} b={c0.hot} unit="°C" digits={1} />}</span>} />
              <Kpi label={tr('Rainy season starts')} value={tr(cs.onset)} sub={<span className="note">{tr('{n} dry months', { n: cs.dry })}</span>} />
            </div>
            <ChartCanvas config={config} className="relative mt-3 h-[220px]" label={tr('Monthly rain and average maximum temperature')} />
          </>
        )}
        <div className="mt-2 text-[11.5px] text-muted">
          {tr('NASA POWER (T2M_MAX, PRECTOTCORR) · NASA NEX-GDDP-CMIP6. Prototype values approximate Central Luzon; the live app pulls your exact coordinates.')}
        </div>
        {cs && (
          <details className="disclosure" open>
            <summary>{tr('What this means for your farm')} ▾</summary>
            <ul className="mt-2.5 list-disc pl-[18px] text-[13.5px] [&>li]:my-[3px]">
              <li>{trn('The rainy season usually starts in {month}. Plant wet-season palay once rains are steady (around mid-June).', { month: <b>{tr(c0.onset)}</b> })}</li>
              <li>
                {trn(farm.water !== 'canal'
                  ? 'The dry season (Nov–May) brings only about {mm} of rain, so a second rice crop depends on water you may not have.'
                  : 'The dry season (Nov–May) brings only about {mm} of rain.', { mm: <b>{c0.ds} mm</b> })}
              </li>
              {!isNow && (
                <li>
                  {trn('By 2050 the dry season could get about {drier} and {hotter}. Crops that flower in March–April face more heat stress.', { drier: <b>{tr('{n} mm drier', { n: Math.abs(cs.ds - c0.ds) })}</b>, hotter: <b>{tr('{n} °C hotter', { n: dT })}</b> })}
                </li>
              )}
              <li>
                {trn('{month} afternoons average {t}. Rice and vegetables lose pollen above about 35 °C, so dry-season crops should flower before the peak heat.', { month: tr(cs.hot_month), t: <b>{cs.hot.toFixed(1)} °C</b> })}
              </li>
              <li>{tr('Short, drought-tolerant crops planted right after harvest (monggo, mani, pakwan) use leftover soil moisture and finish before the hottest weeks.')}</li>
            </ul>
          </details>
        )}
      </div>
    </Section>
  )
}
