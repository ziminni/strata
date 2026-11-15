import { useState } from 'react'
import { MoreLink, Pill, Section } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { r1 } from '../../lib/format'
import { tr } from '../../lib/i18n'

export default function LogsSection() {
  const { logs, meta, crops, farm, openLog } = useApp()
  const [filter, setFilter] = useState('all')
  const list = logs.filter((l) => filter === 'all' || l.type === filter)
  const cost = logs.reduce((a, l) => a + (l.cost || 0), 0)
  const yld = logs.reduce((a, l) => a + (l.yield_kg || 0), 0)

  return (
    <Section id="s_logs" icon="note" tone="p" title={tr('Farm logs')} action={<MoreLink onClick={() => openLog(new Date())}>+ New</MoreLink>}>
      <div className="card">
        <select className="field mb-1.5" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label={tr('Filter logs')}>
          <option value="all">{tr('All types')}</option>
          {Object.entries(meta.log_types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {list.length ? (
          list.map((l) => (
            <div key={l.id} className="grid grid-cols-[76px_1fr] items-start gap-2.5 border-b border-line py-2.5 last:border-0">
              <div className="note font-mono">{l.date}</div>
              <div>
                <b>{meta.log_types[l.type]}</b> · {crops[l.crop]?.fil}
                {l.amount && ` · ${l.amount}`}
                {l.yield_kg > 0 && <> · <b>{l.yield_kg.toLocaleString()} kg</b></>}
                {l.cost > 0 && ` · ₱${l.cost.toLocaleString()}`}
                {l.notes && <div className="note">{l.notes}</div>}
              </div>
              <div className="col-start-2">{l.visibility === 'community' ? <Pill tone="blue">{tr('Shared')}</Pill> : <Pill>{tr('Private')}</Pill>}</div>
            </div>
          ))
        ) : (
          <p className="note">{tr('No logs yet. Tap')} <b>+ New</b> {tr('or any day in the calendar to record planting, inputs, pests, weather or harvest.')}</p>
        )}
        <details className="disclosure">
          <summary>Season totals ▾</summary>
          <table className="mt-2 w-full border-collapse text-[13.5px] [&_td]:border-b [&_td]:border-line [&_td]:p-1.5">
            <tbody>
              <tr><td>{tr('Logs recorded')}</td><td className="font-mono">{logs.length}</td></tr>
              <tr><td>{tr('Expenses logged')}</td><td className="font-mono">₱{cost.toLocaleString()}</td></tr>
              <tr><td>{tr('Harvest logged')}</td><td className="font-mono">{yld.toLocaleString()} kg{yld > 0 && farm.area ? ` (${r1(yld / 1000 / farm.area)} t/ha)` : ''}</td></tr>
              <tr><td>{tr('Shared with community')}</td><td className="font-mono">{logs.filter((l) => l.visibility === 'community').length}</td></tr>
            </tbody>
          </table>
          <p className="note mt-2.5">{tr('Your harvest logs (with your permission) help Strata learn what really yields best in your area, next to NASA climate data.')}</p>
        </details>
      </div>
    </Section>
  )
}
