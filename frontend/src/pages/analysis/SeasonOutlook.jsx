import { useApp } from '../../context/AppContext'
import { seasonOutlook } from '../../lib/outlook'
import DashCard from './DashCard'

/** One-line season outlook vs normal, with expected rain for the next 4 months. */
export default function SeasonOutlook({ clim }) {
  const { farm } = useApp()
  const o = seasonOutlook(farm.prov, clim)
  const max = Math.max(1, ...o.months.flatMap((x) => [x.normal, x.expected]))
  const rainTxt = o.rainPct === 0 ? 'normal rain' : `${Math.abs(o.rainPct)}% ${o.rainPct < 0 ? 'less' : 'more'} rain`
  return (
    <DashCard icon="calendar" tone="s" title="Season outlook">
      <p className="m-0 text-[15px] leading-[1.5] text-ink-soft">
        <b className="text-ink">{o.season} looks {o.feel}</b>: about {rainTxt} than normal and {o.dT}° hotter. {o.tip}
      </p>
      <div className="mt-4 grid grid-cols-4 gap-3" aria-label="Expected rain by month, compared with normal">
        {o.months.map((x) => (
          <div key={x.m} className="flex flex-col items-center">
            <div className="relative flex h-16 w-full items-end justify-center gap-1">
              <i className="w-3 rounded-t-[4px] bg-[#d7dfd8]" style={{ height: `${Math.max(4, (x.normal / max) * 100)}%` }} title={`Normal ${x.normal} mm`} />
              <i className="w-3 rounded-t-[4px] bg-water" style={{ height: `${Math.max(4, (x.expected / max) * 100)}%` }} title={`Expected ${x.expected} mm`} />
            </div>
            <span className="mt-1 text-[12px] font-bold">{x.label}</span>
            <span className="text-[11px] text-muted tabular-nums">{x.expected} mm</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-3 text-[11.5px] font-semibold text-muted">
        <span className="inline-flex items-center gap-1"><i className="size-2 rounded-sm bg-water" />Expected</span>
        <span className="inline-flex items-center gap-1"><i className="size-2 rounded-sm bg-[#d7dfd8]" />Normal</span>
        <span>NASA POWER · prototype</span>
      </div>
    </DashCard>
  )
}
