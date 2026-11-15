import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { SpeakButton } from '../components/Speech'
import Tata from '../components/Tata'
import { useApp } from '../context/AppContext'
import { fmtD, lsGet, lsSet } from '../lib/format'
import { locale, localized, tr } from '../lib/i18n'

/* ---------- chat history (saved in this browser) ---------- */
const CHATS_KEY = 'strata_chats'
const CURRENT_KEY = 'strata_chat_current'
const MAX_CHATS = 30
const saveable = (msgs) => msgs.filter((m) => !m.pending && !m.error)

function chatTitle(msgs) {
  const first = msgs.find((m) => m.role === 'user')
  const t = first ? first.content.trim().replace(/\s+/g, ' ') : tr('Conversation')
  return t.length > 60 ? t.slice(0, 57) + '…' : t
}

function whenLabel(ts) {
  const d = new Date(ts)
  const now = new Date()
  const time = d.toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' })
  const days = Math.round((new Date(now.toDateString()) - new Date(d.toDateString())) / 864e5)
  if (days === 0) return tr('Today, {time}', { time })
  if (days === 1) return tr('Yesterday, {time}', { time })
  return `${fmtD(d)}${d.getFullYear() !== now.getFullYear() ? `, ${d.getFullYear()}` : ''}`
}

/** Keeps every conversation in localStorage, restores the open one after a reload, and lets you reopen or delete old ones. */
function useChatHistory(messages, loadChat, clearChat) {
  const [chats, setChats] = useState(() => lsGet(CHATS_KEY) || [])
  const [currentId, setCurrentIdState] = useState(() => lsGet(CURRENT_KEY))
  const setCurrentId = (id) => {
    setCurrentIdState(id)
    lsSet(CURRENT_KEY, id)
  }
  const persist = (next) => {
    lsSet(CHATS_KEY, next)
    return next
  }

  // After a page reload the context starts empty: bring back the conversation that was open.
  const restored = useRef(false)
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    const open = !messages.length && currentId && chats.find((c) => c.id === currentId)
    if (open) loadChat(open.messages)
  }, [messages, currentId, chats, loadChat])

  // Save the open conversation whenever it changes.
  useEffect(() => {
    const msgs = saveable(messages)
    if (!msgs.some((m) => m.role === 'user')) return
    const id = currentId || Date.now().toString(36)
    if (!currentId) setCurrentId(id)
    setChats((prev) => {
      const old = prev.find((c) => c.id === id)
      if (old && old.messages.length === msgs.length) return prev
      return persist([{ id, title: chatTitle(msgs), updated: Date.now(), messages: msgs }, ...prev.filter((c) => c.id !== id)].slice(0, MAX_CHATS))
    })
  }, [messages, currentId])

  const newChat = () => {
    clearChat()
    setCurrentId(null)
  }
  const open = (c) => {
    loadChat(c.messages)
    setCurrentId(c.id)
  }
  const remove = (id) => {
    setChats((prev) => persist(prev.filter((c) => c.id !== id)))
    if (id === currentId) newChat()
  }
  return { chats, currentId, newChat, open, remove }
}

function HistoryList({ chats, currentId, busy, onOpen, onRemove }) {
  if (!chats.length)
    return <p className="px-4 py-12 text-center text-[14.5px] text-muted simple:text-[16px]">{tr('No saved conversations yet. Ask Tata to get started.')}</p>
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {chats.map((c) => (
        <li key={c.id} className={`flex items-stretch rounded-2xl bg-white shadow-[0_2px_10px_rgba(30,70,110,.10)] ${c.id === currentId ? 'ring-2 ring-brand' : ''}`}>
          <button type="button" disabled={busy} onClick={() => onOpen(c)} className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent px-4 py-3 text-left">
            <div className="truncate text-[14.5px] font-semibold text-ink simple:text-[16px]">{c.title}</div>
            <div className="mt-0.5 text-[12px] text-muted simple:text-[13.5px]">
              {whenLabel(c.updated)} · {tr('{n} messages', { n: c.messages.filter((m) => m.role !== 'tool').length })}
            </div>
          </button>
          <button
            type="button"
            aria-label={tr('Delete conversation: {title}', { title: c.title })}
            onClick={() => window.confirm(tr('Delete this conversation?')) && onRemove(c.id)}
            className="cursor-pointer rounded-r-2xl border-0 bg-transparent px-3.5 text-muted hover:text-danger [&_.ic]:size-4"
          >
            <Icon name="close" />
          </button>
        </li>
      ))}
    </ul>
  )
}

// Chat-only motion for the Tata mascot. Whole-body moves wrap <Tata>; .tata-wave/.tata-blink/.tata-expr are
// parts inside the SVG that Tata only tags when given wave / blink / face (other pages don't pass them).
// Names are tata-chat-* so they never collide with the dashboard's .tata-wave in index.css.
const TATA_CSS = `
@keyframes tata-chat-wave { 0%, 100% { transform: rotate(0) } 15% { transform: rotate(-20deg) } 30% { transform: rotate(12deg) } 45% { transform: rotate(-20deg) } 60% { transform: rotate(10deg) } 80% { transform: rotate(0) } }
@keyframes tata-chat-wave-idle { 0%, 32%, 100% { transform: rotate(0) } 5% { transform: rotate(-18deg) } 11% { transform: rotate(10deg) } 17% { transform: rotate(-18deg) } 23% { transform: rotate(8deg) } }
@keyframes tata-blink { 0%, 92%, 100% { transform: scaleY(1) } 95% { transform: scaleY(.1) } }
@keyframes tata-expr { 0% { transform: scale(.6) } 60% { transform: scale(1.15) } 100% { transform: scale(1) } }
.tata-chat-arm { transform-box: view-box; transform-origin: 152px 124px }
.tata-chat-wave-idle { animation: tata-chat-wave-idle 5s ease-in-out 1s infinite }
.tata-chat-wave-once { animation: tata-chat-wave 1.1s ease-in-out 2 }
.tata-blink { transform-box: fill-box; transform-origin: center; animation: tata-blink 4.3s ease-in-out infinite }
.tata-expr { transform-box: fill-box; transform-origin: center; animation: tata-expr .3s ease-out }
@keyframes tata-pop { 0% { transform: scale(.4) translateY(12px); opacity: 0 } 60% { transform: scale(1.08) translateY(-3px); opacity: 1 } 80% { transform: scale(.96) } 100% { transform: scale(1) } }
@keyframes tata-float { 0%, 100% { transform: translateY(0) rotate(0) scaleY(1) } 25% { transform: translateY(-5px) rotate(-2deg) scaleY(1.02) } 50% { transform: translateY(0) rotate(0) scaleY(.98) } 75% { transform: translateY(-5px) rotate(2deg) scaleY(1.02) } }
@keyframes tata-jump { 0% { transform: translateY(0) scale(1, 1) } 20% { transform: translateY(0) scale(1.1, .88) } 45% { transform: translateY(-22px) scale(.94, 1.08) rotate(-6deg) } 70% { transform: translateY(0) scale(1.06, .94) rotate(3deg) } 85% { transform: translateY(-4px) scale(1) } 100% { transform: translateY(0) scale(1) } }
@keyframes tata-think { 0%, 100% { transform: translateY(0) rotate(0) } 25% { transform: translateY(-4px) rotate(-5deg) } 50% { transform: translateY(0) rotate(0) } 75% { transform: translateY(-4px) rotate(5deg) } }
@keyframes tata-shake { 0%, 100% { transform: translateX(0) } 20%, 60% { transform: translateX(-3px) rotate(-4deg) } 40%, 80% { transform: translateX(3px) rotate(4deg) } }
@keyframes tata-dot { 0%, 80%, 100% { opacity: .25; transform: translateY(0) } 40% { opacity: 1; transform: translateY(-3px) } }
.tata-anim { display: inline-block; transform-origin: 50% 100% }
.tata-pop { animation: tata-pop .6s cubic-bezier(.34, 1.56, .64, 1) both }
.tata-float { animation: tata-float 3.6s ease-in-out .6s infinite }
.tata-jump { animation: tata-jump .7s ease-out }
.tata-think { animation: tata-think 1.1s ease-in-out infinite }
.tata-shake { animation: tata-shake .5s ease-in-out 2 }
.tata-dot { display: inline-block; width: 6px; height: 6px; margin: 0 2px; border-radius: 9999px; background: currentColor; animation: tata-dot 1.2s ease-in-out infinite }
.tata-dot:nth-child(2) { animation-delay: .15s }
.tata-dot:nth-child(3) { animation-delay: .3s }
@media (prefers-reduced-motion: reduce) { .tata-pop, .tata-float, .tata-jump, .tata-think, .tata-shake, .tata-dot, .tata-chat-arm, .tata-blink, .tata-expr { animation: none } }
`

// Small Tata beside a reply: thinks while waiting, waves when the newest answer lands, looks sad on errors.
function BubbleTata({ m, latest }) {
  const motion = m.pending ? 'tata-think' : m.error ? 'tata-shake' : ''
  const face = m.pending ? 'thinking' : m.error ? 'sad' : 'happy'
  return (
    <span key={m.pending ? 'wait' : 'done'} className="tata-anim tata-pop mb-0.5 flex-none">
      <span className={`tata-anim ${motion}`}>
        <Tata mood={m.error ? 'rain' : 'happy'} face={face} wave={latest && !m.pending ? 'once' : undefined} blink size={38} className="block" title={tr('Tata')} />
      </span>
    </span>
  )
}

const TAP_FACES = ['excited', 'wink', 'surprised']

// Big welcome Tata: blinks, waves now and then, watches you type, reacts to taps.
function HeroTata({ typing }) {
  const [hops, setHops] = useState(0)
  const [reaction, setReaction] = useState(null)
  useEffect(() => {
    if (!reaction) return
    const t = setTimeout(() => setReaction(null), 1600)
    return () => clearTimeout(t)
  }, [reaction, hops])
  const tap = () => {
    setHops((n) => n + 1)
    setReaction(TAP_FACES[hops % TAP_FACES.length])
  }
  const face = reaction || (typing ? 'thinking' : 'happy')
  return (
    <button type="button" aria-label={tr('Say hi to Tata')} onClick={tap} className="tata-anim tata-pop cursor-pointer border-0 bg-transparent p-0">
      <span className="tata-anim tata-float">
        <span key={hops} className={`tata-anim ${hops ? 'tata-jump' : ''}`}>
          <Tata mood="happy" face={face} wave={hops ? 'once' : 'idle'} blink size={112} className="block" />
        </span>
      </span>
    </button>
  )
}

const STARTERS = localized({
  detailed: ['What should I plant after this year’s harvest?', 'What if there’s no irrigation in the dry season?', 'Explain my best plan in simple words', 'What does my sensor say right now?', 'How will the 2050 climate affect my farm?'],
  simple: ['What should I plant after harvest?', 'Do I need to irrigate now?', 'How can I save water?', 'What if there’s no irrigation in the dry season?'],
})

function Bubble({ m, latest }) {
  // "Sky" style: conversation sits on a pale-sky panel. You = solid Strata green bubble; Tata = white card
  // with a soft shadow and a name tag; tool steps = small centred pills; errors = soft red card.
  if (m.role === 'user')
    return <div className="ml-auto max-w-[82%] self-end rounded-[24px] rounded-br-[6px] bg-brand px-4 py-3 text-[14.5px] leading-[1.5] whitespace-pre-wrap text-white shadow-[0_3px_10px_rgba(31,138,76,.22)] simple:max-w-[88%] simple:text-[17px]">{m.content}</div>
  if (m.role === 'tool')
    return <div className="mx-auto max-w-[85%] rounded-full bg-[#dceaf8] px-3 py-1 text-center text-[11.5px] font-semibold text-[#1a5fa6]">{m.content}</div>
  return (
    <div className="flex items-end gap-2">
      <BubbleTata m={m} latest={latest} />
      <div className="max-w-[80%] simple:max-w-[84%]">
        <div className="mb-1 ml-1 text-[11px] font-bold tracking-wide text-[#5a7896] uppercase">{tr('Tata')}</div>
        <div className={`rounded-[24px] rounded-bl-[6px] px-4 py-3 text-[14.5px] leading-[1.5] whitespace-pre-wrap text-ink shadow-[0_2px_10px_rgba(30,70,110,.10)] simple:text-[17px] ${m.error ? 'bg-danger-soft ring-1 ring-[#f5cfc5]' : 'bg-white'}`}>
          {m.pending ? <span className="text-[#2f8be0]" role="status" aria-label={tr('Tata is thinking…')}><span className="tata-dot" /><span className="tata-dot" /><span className="tata-dot" /></span> : m.content}
          {!m.pending && !m.error && <div className="mt-2 border-t border-[#eef3f8] pt-2"><SpeakButton text={m.content} label={tr('Listen')} /></div>}
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { messages, busy, ask, clearChat, loadChat, mode, farm } = useApp()
  const { chats, currentId, newChat, open, remove } = useChatHistory(messages, loadChat, clearChat)
  const [showHistory, setShowHistory] = useState(false)
  const [text, setText] = useState('')
  const list = useRef(null)
  const simple = mode === 'simple'
  useEffect(() => {
    const el = list.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const send = () => {
    const t = text.trim()
    if (!t || busy) return
    setText('')
    setShowHistory(false)
    ask(t)
  }

  return (
    <section className="px-4 pt-1.5 pb-2.5" aria-label={tr('Ask Tata')}>
      <style>{TATA_CSS}</style>
      <div className="card mt-2 flex h-[calc(100dvh-196px)] min-h-[420px] flex-col p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <button type="button" className="btn btn-sm" aria-expanded={showHistory} onClick={() => setShowHistory((v) => !v)}>
            {showHistory ? tr('← Back to the conversation') : tr('History ({n})', { n: chats.length })}
          </button>
          {(messages.length > 0 || showHistory) && (
            <button
              type="button"
              className="btn btn-sm"
              disabled={busy}
              onClick={() => {
                newChat()
                setShowHistory(false)
              }}
            >
              {tr('+ New conversation')}
            </button>
          )}
        </div>
        <div ref={list} className="flex-1 overflow-auto rounded-2xl bg-[#f1f6fb] px-2.5 py-3" aria-live="polite">
          {showHistory ? (
            <HistoryList
              chats={chats}
              currentId={currentId}
              busy={busy}
              onOpen={(c) => {
                open(c)
                setShowHistory(false)
              }}
              onRemove={remove}
            />
          ) : messages.length ? (
            <div className="flex flex-col gap-4 simple:gap-5">
              {messages.map((m, i) => <Bubble key={i} m={m} latest={i === messages.length - 1} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center px-3 pt-4 pb-2 text-center">
              <HeroTata typing={text.trim().length > 0} />
              <h2 className="mt-2 text-[22px] font-extrabold text-paddy">{tr('Hi, I’m Tata!')}</h2>
              <p className="mt-1 mb-0 max-w-[300px] text-[15px] leading-[1.45] text-ink-soft simple:text-[17px]">
                {simple
                  ? tr('I know your farm, NASA weather data and your field sensor. Pick a question below, or type your own.')
                  : tr('Your farm helper from Strata. I know your farm profile, NASA climate data for {place}, your field sensor and your crop rotation plans.', { place: farm.prov })}
              </p>
            </div>
          )}
        </div>
        {messages.length === 0 && !showHistory && (
          <div className="mt-1 flex flex-wrap gap-2 border-t border-line pt-3">
            {STARTERS[mode].map((s) => (
              <button key={s} type="button" disabled={busy} onClick={() => ask(s)} className="rounded-xl bg-leaf-soft px-[11px] py-[5px] text-[12.5px] font-semibold text-leaf-ink simple:px-3.5 simple:py-2.5 simple:text-[15px]">
                {s}
              </button>
            ))}
          </div>
        )}
        <div className={`flex gap-2 ${messages.length || showHistory ? 'border-t border-line pt-3' : 'mt-2'}`}>
          <textarea
            className="field h-11 min-h-11! resize-none"
            aria-label={tr('Message')}
            placeholder={simple ? tr('Type your question…') : tr('Ask about your farm…')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
          />
          <button type="button" className="btn btn-pri" onClick={send} disabled={busy}>{tr('Send')}</button>
        </div>
      </div>
    </section>
  )
}
