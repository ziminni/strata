import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { API_MODE } from '../../api'
import { useApp } from '../../context/AppContext'
import CropsPage from '../CropsPage'
import DetailedView from './DetailedView'
import SimpleView from './SimpleView'

const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'
const DURATION = 420
const TABS = [['dashboard', 'Dashboard'], ['farm', 'Farm']]
const root = () => document.documentElement
const setP = (p) => root().style.setProperty('--home-p', String(p))

/** "Dashboard | Farm" — the underline follows --home-p, so it tracks the finger mid-swipe. */
function HomeSwitch({ index, onPick, overlay }) {
  const color = overlay ? { color: 'color-mix(in srgb, #fff calc((1 - var(--home-p)) * 100%), var(--color-ink))' } : undefined
  return (
    <div
      role="tablist"
      aria-label="Home"
      className={`${overlay ? 'absolute inset-x-0 z-30 top-[calc(56px+env(safe-area-inset-top))]' : 'relative'} flex justify-center`}
      style={color}
    >
      <div className={`relative grid grid-cols-[1fr_auto_1fr] items-center ${overlay ? '' : 'text-ink'}`}>
        {TABS.map(([key, label], i) => (
          <FragmentTab key={key} i={i} label={label} on={index === i} onPick={onPick} />
        ))}
        <span className="pointer-events-none absolute bottom-0 left-0 h-[3px] w-[calc(50%-6px)]" style={{ transform: `translateX(calc(var(--home-p) * (100% + 12px)))` }}>
          <span className="mx-auto block h-full w-7 rounded-full bg-current" />
        </span>
      </div>
    </div>
  )
}

function FragmentTab({ i, label, on, onPick }) {
  return (
    <>
      {i === 1 && <span className="mx-1 h-4 w-px bg-current opacity-40" aria-hidden="true" />}
      <button
        type="button"
        role="tab"
        aria-selected={on}
        onClick={() => onPick(i)}
        className={`px-4 pt-2 pb-2.5 text-[15.5px] tracking-[-0.01em] transition-opacity simple:text-[17px] ${on ? 'font-extrabold' : 'font-semibold opacity-70 hover:opacity-100'}`}
      >
        {label}
      </button>
    </>
  )
}

export default function AnalysisPage() {
  const { mode, farmRequest, farmPending } = useApp()
  const overlay = mode === 'simple' // header + switch float over the sky
  // open straight on Farm if a freshly analysed crop is waiting to be shown
  const [index, setIndex] = useState(() => {
    if (!farmPending.current) return 0
    farmPending.current = false
    return 1
  })
  const [peekY, setPeekY] = useState(0) // scroll offset while the hidden panel is being revealed
  const track = useRef(null)
  const drag = useRef(null)
  const moved = useRef(false)

  // keep --home-p in sync with the settled tab; reset when leaving Home
  useEffect(() => {
    setP(index)
  }, [index])
  useEffect(() => () => {
    setP(0)
  }, [])
  // after switching, the new panel starts at the top (braces: scrollTo returns a Promise in new Chrome)
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [index])

  const animateTo = (target) => {
    const el = track.current
    if (!el) return
    if (target === index) {
      el.style.transition = `transform ${DURATION}ms ${EASE}`
      el.style.transform = `translate3d(${-index * 100}%,0,0)`
      setP(index)
      return
    }
    setPeekY(window.scrollY) // show the incoming panel from its top
    requestAnimationFrame(() => {
      el.style.transition = `transform ${DURATION}ms ${EASE}`
      el.style.transform = `translate3d(${-target * 100}%,0,0)`
      setP(target)
      const done = () => {
        el.removeEventListener('transitionend', done)
        el.style.transition = 'none'
        setPeekY(0)
        setIndex(target)
      }
      el.addEventListener('transitionend', done)
    })
  }

  // already on Home: slide over to Farm
  useEffect(() => {
    if (!farmPending.current) return
    farmPending.current = false
    animateTo(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmRequest])

  /* ---------- swipe ---------- */
  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (e.target.closest('[data-noswipe], input, textarea, select')) return
    drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), active: false, w: e.currentTarget.offsetWidth }
    moved.current = false
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    const mx = e.clientX - d.x
    const my = e.clientY - d.y
    if (!d.active) {
      if (Math.abs(mx) < 10 || Math.abs(mx) < Math.abs(my) * 1.2) {
        if (Math.abs(my) > 10) drag.current = null // it's a vertical scroll
        return
      }
      d.active = true
      moved.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      root().classList.add('home-dragging')
      track.current.style.transition = 'none'
      setPeekY(window.scrollY)
    }
    let dx = mx
    if ((index === 0 && dx > 0) || (index === 1 && dx < 0)) dx *= 0.25 // rubber band at the edges
    track.current.style.transform = `translate3d(calc(${-index * 100}% + ${dx}px),0,0)`
    setP(Math.min(1, Math.max(0, index - dx / d.w)))
  }
  const onPointerUp = (e) => {
    const d = drag.current
    drag.current = null
    if (!d?.active) return
    root().classList.remove('home-dragging')
    const mx = e.clientX - d.x
    const v = mx / Math.max(1, performance.now() - d.t)
    let target = index
    if ((mx < -d.w * 0.25 || v < -0.4) && index === 0) target = 1
    if ((mx > d.w * 0.25 || v > 0.4) && index === 1) target = 0
    animateTo(target)
  }
  // a swipe shouldn't also click whatever was under the finger
  const onClickCapture = (e) => {
    if (moved.current) {
      e.preventDefault()
      e.stopPropagation()
      moved.current = false
    }
  }

  const panel = (i) =>
    i === index
      ? undefined
      : { height: '100dvh', overflow: 'hidden', transform: `translateY(${peekY}px)` } // off-screen panel: just its top screenful

  return (
    <section className="relative" aria-label="Home">
      <HomeSwitch index={index} onPick={(i) => animateTo(i)} overlay={overlay} />
      <div
        className="overflow-x-clip touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
      >
        <div ref={track} className="flex items-start will-change-transform" style={{ transform: index ? 'translate3d(-100%,0,0)' : 'none' }}>
          <div className={`w-full flex-none px-4 pb-2.5 ${overlay ? '' : 'pt-1.5'}`} style={panel(0)} role="tabpanel" aria-label="Dashboard" inert={index !== 0 && !peekY ? true : undefined}>
            {mode === 'simple' ? <SimpleView /> : <DetailedView />}
            {mode !== 'simple' && <p className="note mt-[18px] text-center">{API_MODE === 'mock' ? 'Saving on this device' : 'Saved to your Strata server'}</p>}
          </div>
          <div className="w-full flex-none" style={{ paddingTop: overlay ? 'calc(96px + env(safe-area-inset-top))' : undefined, ...panel(1) }} role="tabpanel" aria-label="Farm" inert={index !== 1 && !peekY ? true : undefined}>
            <CropsPage />
          </div>
        </div>
      </div>
    </section>
  )
}
