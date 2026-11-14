import { useEffect, useRef, useState } from 'react'
import Tata from './Tata'

// Tap reactions, in order: body motion, face, little effect, and Tata says a line.
const REACTIONS = [
  { motion: 'tata-b-jump', face: 'excited', fx: 'spark' },
  { motion: 'tata-b-spin', face: 'wink', fx: 'spark' },
  { motion: 'tata-b-shake', face: 'surprised', fx: null },
  { motion: 'tata-b-jump', face: 'love', fx: 'heart' },
  { motion: 'tata-b-squish', face: 'excited', fx: 'leaf' },
]
const FX = { spark: ['✦', '#f2b81f'], heart: ['♥', '#e5566b'], leaf: ['❦', '#4f9e44'] }
const BURST = [[-46, -38, -30], [-22, -60, 15], [8, -66, -10], [34, -52, 25], [50, -26, 40]]
const IDLE = ['happy', 'happy', 'lookL', 'happy', 'lookR', 'wink']
const DEFAULT_LINES = ['Hi! I’m Tata!', 'Hehe, that tickles!', 'Let’s grow something great!', 'I’m made of good soil!', 'Did you check the weather today?']

/**
 * Expressive Tata: floats, blinks, looks around, waves; tap him and he reacts and talks.
 * bubble: where the speech bubble shows ('left' of him, or 'top').
 */
export default function TataBuddy({ mood = 'happy', size = 100, className = '', lines = DEFAULT_LINES, bubble = 'left' }) {
  const [n, setN] = useState(0) // taps so far
  const [reaction, setReaction] = useState(null)
  const [idle, setIdle] = useState('happy')
  const hide = useRef(null)

  // idle: glance around now and then (only in the plain happy mood; other moods keep their own face)
  useEffect(() => {
    if (mood !== 'happy') return
    let i = 0
    const id = setInterval(() => setIdle(IDLE[++i % IDLE.length]), 2600)
    return () => clearInterval(id)
  }, [mood])
  useEffect(() => () => clearTimeout(hide.current), [])

  const tap = () => {
    const r = REACTIONS[n % REACTIONS.length]
    setReaction({ ...r, line: lines[n % lines.length] })
    setN(n + 1)
    clearTimeout(hide.current)
    hide.current = setTimeout(() => setReaction(null), 2400)
  }

  const face = reaction?.face || (mood === 'happy' ? idle : undefined)
  const [glyph, color] = reaction?.fx ? FX[reaction.fx] : []
  const bubblePos = bubble === 'top'
    ? 'bottom-[calc(100%+14px)] left-1/2 -translate-x-1/2 origin-bottom'
    : 'right-[78%] top-1 origin-right'

  return (
    <button type="button" onClick={tap} aria-label="Tata. Tap to say hi" className={`relative inline-block cursor-pointer border-0 bg-transparent p-0 [-webkit-tap-highlight-color:transparent] ${className}`}>
      <span className="tata-anim tata-b-float">
        <span key={n} className={`tata-anim ${reaction?.motion || ''}`}>
          <Tata mood={mood} face={face} blink wave={mood === 'happy' ? (reaction ? 'once' : 'idle') : undefined} size={size} className="block" />
        </span>
      </span>

      {glyph && BURST.map(([dx, dy, r], i) => (
        <span key={`${n}-${i}`} className="tata-fx" style={{ color, '--dx': `${dx}px`, '--dy': `${dy}px`, '--r': `${r}deg`, animationDelay: `${i * 40}ms` }} aria-hidden="true">{glyph}</span>
      ))}

      <span aria-live="polite" className="sr-only">{reaction?.line || ''}</span>
      {reaction && (
        <span className={`absolute z-10 ${bubblePos}`} aria-hidden="true">
          <span key={n} className="tata-bubble relative block w-max max-w-[170px] rounded-2xl bg-white px-3 py-2 text-left text-[13px] leading-[1.3] font-bold text-ink shadow-[0_6px_18px_rgb(16_34_26/0.16)]">
            {reaction.line}
            <i className={`absolute size-2.5 rotate-45 bg-white ${bubble === 'top' ? '-bottom-1 left-1/2 -ml-1' : 'top-4 -right-1'}`} />
          </span>
        </span>
      )}
    </button>
  )
}
