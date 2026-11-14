import AppHeader from './components/AppHeader'
import FarmSheet from './components/FarmSheet'
import LogSheet from './components/LogSheet'
import TabBar from './components/TabBar'
import { useApp } from './context/AppContext'
import AnalysisPage from './pages/analysis/AnalysisPage'
import ChatPage from './pages/ChatPage'
import CommunityPage from './pages/CommunityPage'

function BootScreen({ error, retry }) {
  return (
    <div className="grid min-h-[70vh] place-items-center p-6">
      <div className="card w-full text-center">
        <div className="font-display text-[28px] font-extrabold tracking-[-1.2px] text-brand">strata</div>
        {error ? (
          <>
            <p className="mt-2 mb-3 text-[14px]">Can’t reach the Strata API. Is the backend running on port 8000?</p>
            <button type="button" className="btn btn-pri" onClick={retry}>Try again</button>
          </>
        ) : (
          <p className="note mt-2">Loading your farm…</p>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const { mode, page, meta, farm, bootError, boot, toastMsg } = useApp()
  const ready = meta && farm
  const onSky = ready && page === 'analysis' && mode === 'simple'

  return (
    <div data-mode={mode} className="min-h-screen">
      <div className="relative mx-auto min-h-screen max-w-[430px] overflow-x-clip bg-canvas pb-[92px] shadow-phone">
        {ready ? (
          <>
            <AppHeader onSky={onSky} />
            <main>
              {page === 'analysis' && <AnalysisPage />}
              {page === 'chat' && <ChatPage />}
              {page === 'community' && <CommunityPage />}
            </main>
          </>
        ) : (
          <BootScreen error={bootError} retry={boot} />
        )}
      </div>
      {ready && (
        <>
          <TabBar />
          <FarmSheet />
          <LogSheet />
        </>
      )}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-[84px] left-1/2 z-[60] -translate-x-1/2 rounded-[14px] bg-paddy px-4 py-[9px] text-[13.5px] font-semibold text-white transition-opacity duration-200 ${toastMsg ? 'opacity-100' : 'opacity-0'}`}
      >
        {toastMsg}
      </div>
    </div>
  )
}
