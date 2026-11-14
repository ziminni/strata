import { fmtD } from '../../lib/format'
import { fertilizerAdvice } from '../../lib/fertilizer'
import { useApp } from '../../context/AppContext'
import DashCard from './DashCard'


/** Runoff lock: tells the farmer when NOT to apply fertilizer because rain would wash it away. */
export default function FertilizerAlert({ clim }) {
  const { farm } = useApp()
  const a = fertilizerAdvice(farm.prov, clim)

  if (a.level === 'hold')
    return (
      <DashCard icon="alert" tone="r" title="Hold the fertilizer" label="Fertilizer alert">
        <p className="m-0 text-[15px] leading-[1.5] text-ink-soft">
          <b className="text-danger">Heavy rain {a.rainName}</b> ({fmtD(a.rain.d)}{a.mm != null ? `, about ${a.mm} mm` : ''}, {a.rain.chance}% chance). Don’t apply urea or other fertilizer until <b className="text-ink">{a.safeName}</b>. The rain would wash it off your field and waste your money.
        </p>
      </DashCard>
    )
  if (a.level === 'care')
    return (
      <DashCard icon="drop" tone="b" title="Fertilize with care" label="Fertilizer alert">
        <p className="m-0 text-[15px] leading-[1.5] text-ink-soft">
          Some rain {a.rainName} ({a.mm != null ? `about ${a.mm} mm, ` : ''}{a.rain.chance}% chance). If you need to fertilize, do it on <b className="text-ink">{a.safeName}</b>, early in the morning.
        </p>
      </DashCard>
    )
  return (
    <DashCard icon="check" tone="g" title="Safe to fertilize" label="Fertilizer alert">
      <p className="m-0 text-[15px] leading-[1.5] text-ink-soft">No heavy rain expected through {a.until}. Fertilizer will stay on your field.</p>
    </DashCard>
  )
}
