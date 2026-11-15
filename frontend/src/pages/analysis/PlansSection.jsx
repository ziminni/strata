import { useState } from 'react'
import { CurrentPlanCard, PlanCard } from '../../components/PlanCard'
import { Section, Seg } from '../../components/ui'
import { useApp } from '../../context/AppContext'
import { useApi } from '../../hooks/useApi'
import { SCENARIO_OPTIONS } from '../../lib/labels'
import { planName, tr } from '../../lib/i18n'

export default function PlansSection() {
  const { farm, crops, saveFarm, toast, ask, farmVersion, lang } = useApp()
  const [scen, setScen] = useState('ssp245')
  const [showAll, setShowAll] = useState(false)
  const { data, error } = useApi(`/plans?scenario=${scen}`, [farmVersion, lang]) // reasons come back in the current language

  const adopt = async (id) => {
    try {
      await saveFarm({ ...farm, adopted: id })
      toast(tr('Plan added to your crop calendar'))
    } catch (e) {
      toast(e.message)
    }
  }
  const explain = (p) => {
    ask(tr('Explain the "{plan}" plan for my farm in simple words: why it\'s good, when to plant, what it costs, and the main risks.', { plan: planName(p.name) }))
  }

  const list = data ? (showAll ? data.plans : data.plans.slice(0, 3)) : []
  return (
    <Section id="s_plans" icon="rotate" title={tr('Rotation plans')}>
      <p className="note mb-2">
        Ranked for your farm in {farm.mun} using your priorities. Each plan is also tested against the hotter, drier 2050 high-emissions climate. Scores are relative (0–100); use them to compare.
      </p>
      <Seg className="mb-2.5" label={tr('Climate scenario')} value={scen} onChange={setScen} options={SCENARIO_OPTIONS} />
      {error && <p className="note text-danger!">{tr('Couldn’t load plans: {msg}', { msg: error.message })}</p>}
      {list.map((r, i) => (
        <PlanCard key={r.id} r={r} cur={data.current} rank={i} crops={crops} adopted={farm.adopted === r.id} onAdopt={() => adopt(r.id)} onExplain={() => explain(r)} />
      ))}
      {data && !showAll && (
        <button type="button" className="btn mb-3.5 w-full" onClick={() => setShowAll(true)}>{tr('Show {n} more plans', { n: data.plans.length - 3 })}</button>
      )}
      {data && <CurrentPlanCard cur={data.current} crops={crops} />}
    </Section>
  )
}
