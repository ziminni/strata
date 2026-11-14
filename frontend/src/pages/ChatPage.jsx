import { useEffect, useRef, useState } from 'react'
import { MicButton, SpeakButton } from '../components/Speech'
import Tata from '../components/Tata'
import { useApp } from '../context/AppContext'

const STARTERS = {
  detailed: ['What should I plant after harvest this year?', 'What if I have no irrigation in the dry season?', 'Explain my best plan in simple words', 'What is my sensor saying now?', 'How will the 2050 climate affect my farm?'],
  simple: ['What should I plant after harvest?', 'Do I need to irrigate today?', 'How can I save water?', 'What if there’s no irrigation in the dry season?'],
}

function Bubble({ m }) {
  if (m.role === 'user')
    return <div className="my-2 ml-auto max-w-[86%] rounded-[20px] rounded-br-md bg-linear-135 from-leaf to-[#167a42] px-3.5 py-2.5 text-[14.5px] whitespace-pre-wrap text-white simple:max-w-[90%] simple:text-[17px]">{m.content}</div>
  if (m.role === 'tool')
    return <div className="my-2 ml-11 max-w-[80%] rounded-[20px] rounded-bl-md bg-[#f6f4ec] px-3.5 py-2.5 text-[12px] text-muted">{m.content}</div>
  return (
    <div className="my-2 flex items-end gap-1.5">
      <Tata mood={m.error ? 'rain' : 'happy'} size={38} className="mb-0.5 flex-none" title="Tata" />
      <div className="max-w-[82%] rounded-[20px] rounded-bl-md bg-surface2 px-3.5 py-2.5 text-[14.5px] whitespace-pre-wrap simple:max-w-[86%] simple:text-[17px]">
        {m.content}
        {!m.pending && !m.error && <><br /><SpeakButton text={m.content} /></>}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { messages, busy, ask, clearChat, mode, farm, toast } = useApp()
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
    ask(t)
  }

  return (
    <section className="px-4 pt-1.5 pb-2.5" aria-label="Ask Strata">
      <div className="card mt-2 flex h-[calc(100dvh-196px)] min-h-[420px] flex-col p-3">
        <div ref={list} className="flex-1 overflow-auto px-0.5 py-1" aria-live="polite">
          {messages.length ? (
            messages.map((m, i) => <Bubble key={i} m={m} />)
          ) : (
            <div className="flex flex-col items-center px-3 pt-4 pb-2 text-center">
              <Tata mood="happy" size={112} />
              <h2 className="mt-2 text-[22px] font-extrabold text-paddy">Hi, I’m Tata!</h2>
              <p className="mt-1 mb-0 max-w-[300px] text-[15px] leading-[1.45] text-ink-soft simple:text-[17px]">
                {simple
                  ? 'I know your farm, the NASA weather data and your field sensor. Tap a question below, or type your own.'
                  : `Strata’s farm assistant. I know your farm profile, NASA climate data for ${farm.prov}, your field sensor and your rotation plans.`}
              </p>
            </div>
          )}
        </div>
        <div className="my-2 flex flex-wrap gap-1.5">
          {STARTERS[mode].map((s) => (
            <button key={s} type="button" disabled={busy} onClick={() => ask(s)} className="rounded-xl bg-leaf-soft px-[11px] py-[5px] text-[12.5px] font-semibold text-leaf-ink simple:px-3.5 simple:py-2.5 simple:text-[15px]">
              {s}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <MicButton value={text} onChange={setText} onDenied={() => toast('Microphone is off. Please type instead.')} />
          <textarea
            className="field h-11 min-h-11! resize-none"
            aria-label="Message"
            placeholder={simple ? 'Type a question, or tap the mic…' : 'Ask about your farm…'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
          />
          <button type="button" className="btn btn-pri" onClick={send} disabled={busy}>Send</button>
        </div>
        {messages.length > 0 && (
          <div className="mt-1.5 flex items-center justify-end">
            <button type="button" className="btn btn-sm" onClick={clearChat}>New chat</button>
          </div>
        )}
      </div>
    </section>
  )
}
