import { useEffect, useRef, useState } from 'react'
import { MicButton, SpeakButton } from '../components/Speech'
import { Seg } from '../components/ui'
import { useApp } from '../context/AppContext'

const STARTERS = {
  detailed: ['What should I plant after harvest this year?', 'What if I have no irrigation in the dry season?', 'Explain my best plan in simple words', 'Ano ang sinasabi ng sensor ko ngayon?', 'How will 2050 climate affect my farm?'],
  simple: ['Ano ang itatanim ko pagkatapos ng ani?', 'Kailangan ko bang magpatubig ngayon?', 'Paano makakatipid ng tubig?', 'Paano kung walang patubig sa tag-araw?'],
}

function Bubble({ m, simple }) {
  if (m.role === 'user')
    return <div className="my-2 ml-auto max-w-[86%] rounded-[20px] rounded-br-md bg-linear-135 from-leaf to-[#167a42] px-3.5 py-2.5 text-[14.5px] whitespace-pre-wrap text-white simple:max-w-[90%] simple:text-[17px]">{m.content}</div>
  if (m.role === 'tool')
    return <div className="my-2 max-w-[86%] rounded-[20px] rounded-bl-md bg-[#f6f4ec] px-3.5 py-2.5 text-[12px] text-muted">{m.content}</div>
  return (
    <div className="my-2 max-w-[86%] rounded-[20px] rounded-bl-md bg-surface2 px-3.5 py-2.5 text-[14.5px] whitespace-pre-wrap simple:max-w-[90%] simple:text-[17px]">
      {m.content}
      {!m.pending && !m.error && <><br /><SpeakButton text={m.content} label={simple ? 'Pakinggan' : 'Listen'} /></>}
    </div>
  )
}

export default function ChatPage() {
  const { messages, busy, ask, clearChat, lang, setLang, mode, farm, toast } = useApp()
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
    <section className="px-4 pt-1.5 pb-2.5" aria-label="Chatbot">
      <div className="card mt-2 flex h-[calc(100dvh-160px)] min-h-[420px] flex-col p-3">
        <Seg label="Language" value={lang} onChange={setLang} options={[['English', 'English'], ['Filipino', 'Filipino'], ['Taglish', 'Taglish']]} />
        <div ref={list} className="flex-1 overflow-auto px-0.5 py-1" aria-live="polite">
          {messages.length ? (
            messages.map((m, i) => <Bubble key={i} m={m} simple={simple} />)
          ) : (
            <Bubble
              simple={simple}
              m={{
                role: 'assistant',
                pending: true,
                content: simple
                  ? 'Kumusta po! Ako si Strata. Alam ko ang inyong bukid, ang panahon mula sa NASA, at ang sensor sa palayan. Ano po ang gusto ninyong malaman? Puwede kayong magsalita gamit ang mikropono.'
                  : `Kumusta! I'm Strata. I know your farm profile, the NASA climate data for ${farm.prov}, your field sensor and your rotation plans. What would you like to know?`,
              }}
            />
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
          <MicButton value={text} onChange={setText} onDenied={() => toast('Naka-off ang mikropono. Mag-type na lang.')} />
          <textarea
            className="field h-11 min-h-11! resize-none"
            aria-label="Message"
            placeholder={simple ? 'Itanong dito, o pindutin ang mikropono…' : 'Ask about your farm…'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
          />
          <button type="button" className="btn btn-pri" onClick={send} disabled={busy}>{simple ? 'Ipadala' : 'Send'}</button>
        </div>
        <div className="mt-1.5 flex items-center justify-end">
          <button type="button" className="btn btn-sm" onClick={clearChat}>{simple ? 'Bagong usapan' : 'New chat'}</button>
        </div>
      </div>
    </section>
  )
}
