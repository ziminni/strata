import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api'
import { useApi } from '../hooks/useApi'
import { useSensor } from '../hooks/useSensor'
import { lsGet, lsSet, parseYmd } from '../lib/format'
import { isRice, seasonSummary, stateOn } from '../lib/season'

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

// every routable page; the bottom navbar shows TABS (see components/TabBar.jsx)
export const PAGES = ['analysis', 'map', 'crops', 'community', 'chat', 'diagnose']
const pageFromHash = () => {
  const h = window.location.hash.slice(1)
  return PAGES.includes(h) ? h : 'analysis'
}

export function AppProvider({ children }) {
  const [meta, setMeta] = useState(null)
  const [farm, setFarm] = useState(null)
  const [logs, setLogs] = useState([])
  const [bootError, setBootError] = useState(null)
  const [farmVersion, setFarmVersion] = useState(0)
  const [postsVersion, setPostsVersion] = useState(0)
  const [plotsVersion, setPlotsVersion] = useState(0) // bump when fields change so the dashboard tip refreshes
  const bumpPlots = useCallback(() => setPlotsVersion((v) => v + 1), [])

  const [mode, setModeState] = useState(() => (lsGet('strata_mode') === 'detailed' ? 'detailed' : 'simple'))
  const [page, setPage] = useState(pageFromHash)
  // AI reply language. English only for now; a language picker comes later.
  const [lang, setLang] = useState('English')
  const [farmSheetOpen, setFarmSheetOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [logRequest, setLogRequest] = useState(null)
  const [toastMsg, setToastMsg] = useState('')
  const toastTimer = useRef(null)

  const sensor = useSensor()

  /* ---------- boot ---------- */
  const boot = useCallback(() => {
    setBootError(null)
    Promise.all([api.get('/meta'), api.get('/farm'), api.get('/logs')])
      .then(([m, f, l]) => {
        setMeta(m)
        setFarm(f)
        setLogs(l)
      })
      .catch(setBootError)
  }, [])
  useEffect(boot, [boot])

  const seasonRes = useApi(farm ? '/season' : null, [farmVersion])
  const season = useMemo(() => {
    const d = seasonRes.data
    return d && { ...d, segs: d.segs.map((s) => ({ ...s, start: parseYmd(s.start), end: parseYmd(s.end) })) }
  }, [seasonRes.data])

  const crops = meta?.crops
  const todayState = season && crops ? stateOn(season.segs, crops, new Date()) : null
  const riceNow = isRice(todayState)

  /* ---------- ui actions ---------- */
  const toast = useCallback((m) => {
    setToastMsg(m)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 1800)
  }, [])

  const go = useCallback((p) => {
    const next = PAGES.includes(p) ? p : 'analysis'
    setPage(next)
    window.scrollTo(0, 0)
    try {
      history.replaceState(null, '', '#' + next)
    } catch {
      /* ignore */
    }
  }, [])
  useEffect(() => {
    const onHash = () => setPage(pageFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const setMode = useCallback((m) => {
    setModeState(m)
    lsSet('strata_mode', m)
    window.scrollTo(0, 0)
  }, [])

  /* ---------- data actions ---------- */
  const saveFarm = useCallback(async (next) => {
    const saved = await api.put('/farm', next)
    setFarm(saved)
    setFarmVersion((v) => v + 1)
    return saved
  }, [])

  const addLog = useCallback(async (log) => {
    await api.post('/logs', log)
    setLogs(await api.get('/logs'))
    if (log.visibility === 'community') setPostsVersion((v) => v + 1)
  }, [])

  const openLog = useCallback((date, type) => setLogRequest({ date, type }), [])

  // No accounts yet (frontend-only phase): logging out can't end a session, and it must not
  // wipe the farmer's on-device data. Wire this to real auth when the backend adds it.
  const logout = useCallback(() => {
    setDrawerOpen(false)
    toast('Accounts aren’t set up yet in this demo.')
  }, [toast])

  /* ---------- AI adviser ---------- */
  const [messages, setMessages] = useState([])
  const busyRef = useRef(false)
  const [busy, setBusy] = useState(false)

  const ask = async (text, opts = {}) => {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    go('chat')
    const history = [...messages.filter((m) => (m.role === 'user' || m.role === 'assistant') && !m.error), { role: 'user', content: text }]
    setMessages((m) => [...m, { role: 'user', content: text }, { role: 'assistant', content: 'Thinking…', pending: true }])
    try {
      const r = await api.post('/chat', {
        messages: history.map(({ role, content }) => ({ role, content })),
        language: opts.lang || lang,
        sensor: { water_level_cm: sensor.water, soil_moisture_pct: sensor.moist, soil_temp_c: sensor.soilT },
        season_now: crops ? seasonSummary(todayState, crops) : null,
      })
      setMessages((m) => [
        ...m.filter((x) => !x.pending),
        ...r.tool_notes.map((t) => ({ role: 'tool', content: t })),
        { role: 'assistant', content: r.reply },
      ])
    } catch (e) {
      const content =
        e.status === 503
          ? e.message
          : e.status === 504
            ? 'The adviser took too long. Please try again.'
            : 'Sorry, I couldn’t answer just now. Please try again.'
      setMessages((m) => [...m.filter((x) => !x.pending), { role: 'assistant', content, error: true }])
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }
  const clearChat = () => setMessages([])
  /** Swap in a saved conversation (chat history on the chat page). */
  const loadChat = (msgs) => {
    if (!busyRef.current) setMessages(msgs)
  }

  const value = {
    meta, crops, farm, logs, season, sensor, todayState, riceNow, bootError, boot,
    farmVersion, postsVersion, plotsVersion, bumpPlots,
    mode, setMode, page, go, lang, setLang,
    farmSheetOpen, setFarmSheetOpen, drawerOpen, setDrawerOpen, logout, logRequest, setLogRequest, openLog,
    toastMsg, toast, saveFarm, addLog,
    messages, busy, ask, clearChat, loadChat,
  }
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}
