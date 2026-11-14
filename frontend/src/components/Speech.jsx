import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

// Browser speech APIs stand in for the prototype's tts/dictation runtime capabilities.
const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null
export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

export function SpeakButton({ text, label = 'Pakinggan', className = '', style }) {
  const [on, setOn] = useState(false)
  if (!ttsSupported) return null
  const play = () => {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(typeof text === 'function' ? text() : text)
    u.lang = 'fil-PH'
    u.rate = 0.9
    u.onend = u.onerror = () => setOn(false)
    setOn(true)
    speechSynthesis.speak(u)
  }
  return (
    <button type="button" className={`spk ${on ? 'speaking' : ''} ${className}`} style={style} onClick={play}>
      <Icon name="radio" />{label}
    </button>
  )
}

/** Dictation into a text field (fil-PH). Hidden where the browser has no speech recognition. */
export function MicButton({ value, onChange, onDenied }) {
  const [rec, setRec] = useState(false)
  const ref = useRef(null)
  useEffect(() => () => ref.current?.abort(), [])
  if (!SR) return null
  const toggle = () => {
    if (ref.current) {
      ref.current.stop()
      return
    }
    const r = new SR()
    r.lang = 'fil-PH'
    r.interimResults = true
    r.continuous = true
    const base = value ? value.trim() + ' ' : ''
    r.onresult = (e) => {
      let t = ''
      for (const res of e.results) t += res[0].transcript
      onChange(base + t)
    }
    r.onerror = (e) => {
      if (e.error === 'not-allowed') onDenied?.()
    }
    r.onend = () => {
      ref.current = null
      setRec(false)
    }
    ref.current = r
    r.start()
    setRec(true)
  }
  return (
    <button type="button" className={`mic ${rec ? 'rec' : ''}`} onClick={toggle} aria-label="Magsalita / Speak" aria-pressed={rec}>
      <Icon name="mic" />
    </button>
  )
}
