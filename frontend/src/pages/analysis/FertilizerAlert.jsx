import { fmtD } from '../../lib/format'
import { fertilizerAdvice } from '../../lib/fertilizer'
import { tr, trn } from '../../lib/i18n'
import { useApp } from '../../context/AppContext'
import DashCard from './DashCard'


/** Runoff lock: tells the farmer when NOT to apply fertilizer because rain would wash it away. */
export default function FertilizerAlert({ clim }) {
  const { farm } = useApp()
  const a = fertilizerAdvice(farm.prov, clim)

  if (a.level === 'hold')
    return (
      <DashCard icon="alert" tone="r" title={tr('Hold the fertilizer')} label={tr('Fertilizer alert')}>
        <p className="m-0 text-[15px] leading-[1.5] text-ink-soft">
          {trn(a.mm != null
            ? '{heavy} ({date}, about {mm} mm, {chance}% chance). Don’t apply urea or other fertilizer until {safe}. The rain would wash it off your field and waste your money.'
            : '{heavy} ({date}, {chance}% chance). Don’t apply urea or other fertilizer until {safe}. The rain would wash it off your field and waste your money.', {
            heavy: <b className="text-danger">{tr('Heavy rain {day}', { day: a.rainName })}</b>,
            date: fmtD(a.rain.d), mm: a.mm, chance: a.rain.chance,
            safe: <b className="text-ink">{a.safeName}</b>,
          })}
        </p>
      </DashCard>
    )
  if (a.level === 'care')
    return (
      <DashCard icon="drop" tone="b" title={tr('Fertilize with care')} label={tr('Fertilizer alert')}>
        <p className="m-0 text-[15px] leading-[1.5] text-ink-soft">
          {trn(a.mm != null
            ? 'Some rain {day} (about {mm} mm, {chance}% chance). If you need to fertilize, do it on {safe}, early in the morning.'
            : 'Some rain {day} ({chance}% chance). If you need to fertilize, do it on {safe}, early in the morning.', {
            day: a.rainName, mm: a.mm, chance: a.rain.chance, safe: <b className="text-ink">{a.safeName}</b>,
          })}
        </p>
      </DashCard>
    )
  return (
    <DashCard icon="check" tone="g" title={tr('Safe to fertilize')} label={tr('Fertilizer alert')}>
      <p className="m-0 text-[15px] leading-[1.5] text-ink-soft">{tr('No heavy rain expected through {day}. Fertilizer will stay on your field.', { day: a.until })}</p>
    </DashCard>
  )
}
