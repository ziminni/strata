import { API_MODE } from '../../api'
import { useApp } from '../../context/AppContext'
import DetailedView from './DetailedView'
import SimpleView from './SimpleView'

export default function AnalysisPage() {
  const { mode } = useApp()
  return (
    <section className={`px-4 pb-2.5 ${mode === 'simple' ? 'pt-0' : 'pt-1.5'}`} aria-label="Analysis">
      {mode === 'simple' ? <SimpleView /> : <DetailedView />}
      <p className="note mt-[18px] text-center">{API_MODE === 'mock' ? 'Saving on this device' : 'Saved to your Strata server'}</p>
    </section>
  )
}
