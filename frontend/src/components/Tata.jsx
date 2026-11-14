// Tata — Strata's mascot: a little clod of farm soil with a rice sprout.
// Moods follow the mascot sheet: happy (Kumusta!), rain (Uulan!), thirsty (Uhaw ang palay), harvest (Anihan na!).
// Palette: damo #5fae4f · ibabaw #8b5a3c · gitna #a8714a · ilalim #6e4630 · strata green #1f8a4c · ink #3b2a1e

const INK = '#3b2a1e'
const BODY = 'M52 74 Q50 58 66 57 L134 57 Q150 58 148 74 L158 172 Q160 196 136 197 L64 197 Q40 196 42 172 Z'

const MOODS = {
  happy: { grass: '#5fae4f', top: '#6e4630', mid: '#8b5a3c', low: '#a8714a', sprout: '#5fae4f' },
  rain: { grass: '#5fae4f', top: '#6e4630', mid: '#8b5a3c', low: '#a8714a', sprout: '#5fae4f' },
  thirsty: { grass: '#c2b45a', top: '#7a5638', mid: '#97694a', low: '#b48460', sprout: '#b7ad5c' },
  harvest: { grass: '#5fae4f', top: '#6e4630', mid: '#8b5a3c', low: '#a8714a', sprout: '#5fae4f' },
}

function Arm({ d }) {
  return (
    <g strokeLinecap="round" fill="none">
      <path d={d} stroke={INK} strokeWidth="15" />
      <path d={d} stroke="#6e4630" strokeWidth="9" />
    </g>
  )
}

function Hand({ x, y }) {
  return <circle cx={x} cy={y} r="8.5" fill="#6e4630" stroke={INK} strokeWidth="4" />
}

function Eye({ x, mood }) {
  if (mood === 'harvest') return <path d={`M${x - 10} ${104} Q${x} ${92} ${x + 10} ${104}`} fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
  return (
    <g>
      <ellipse cx={x} cy="102" rx="12.5" ry="13.5" fill="#fff" stroke={INK} strokeWidth="4" />
      <circle cx={x + (mood === 'rain' ? 0 : 1.5)} cy={mood === 'rain' ? 101 : 104} r={mood === 'rain' ? 5.5 : 7} fill={INK} />
      <circle cx={x + 3.5} cy="99" r="2.4" fill="#fff" />
      {mood === 'thirsty' && <path d={`M${x - 14} 98 Q${x} 90 ${x + 14} 98 L${x + 14} 88 L${x - 14} 88 Z`} fill="#7a5638" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />}
    </g>
  )
}

// Optional expression overrides (opt-in; used by the chat page). Without `face`, the mood's own face is drawn.
// look = pupil offset, brows = brow path, mouth = 'grin' | 'grin-big' | 'o' | a stroke path.
const RAISED = 'M70 78Q80 72 90 78M110 78Q120 72 130 78'
const FACES = {
  happy: { look: [1.5, 2], brows: 'M70 83Q80 78 90 83M110 83Q120 78 130 83', mouth: 'grin' },
  excited: { eyes: 'arc', brows: RAISED, mouth: 'grin-big' },
  wink: { eyes: 'wink', look: [1.5, 2], brows: 'M70 83Q80 78 90 83M110 80Q120 74 130 80', mouth: 'grin' },
  thinking: { look: [5, -4], brows: 'M70 84Q80 81 90 84M110 78Q120 71 130 79', mouth: 'M92 128Q101 124 110 129' },
  sad: { look: [0, 4], brows: 'M70 84Q80 80 90 77M110 77Q120 80 130 84', mouth: 'M88 132Q100 121 112 132' },
  surprised: { look: [0, 0], pupil: 4.5, brows: RAISED, mouth: 'o' },
  love: { eyes: 'heart', brows: RAISED, mouth: 'grin-big' },
  lookL: { look: [-5, 1], brows: 'M70 83Q80 78 90 83M110 83Q120 78 130 83', mouth: 'grin' },
  lookR: { look: [5, 1], brows: 'M70 83Q80 78 90 83M110 83Q120 78 130 83', mouth: 'grin' },
  worried: { look: [0, 2], brows: 'M70 84Q80 80 90 77M110 77Q120 80 130 84', mouth: 'M88 129q4-5 8 0t8 0t8 0' },
}

function OpenEye({ x, look = [0, 0], pupil = 7 }) {
  return (
    <g>
      <ellipse cx={x} cy="102" rx="12.5" ry="13.5" fill="#fff" stroke={INK} strokeWidth="4" />
      <g style={{ transform: `translate(${look[0]}px, ${look[1]}px)`, transition: 'transform .35s ease' }}>
        <circle cx={x} cy="102" r={pupil} fill={INK} />
        <circle cx={x + 2} cy="98" r="2.4" fill="#fff" />
      </g>
    </g>
  )
}

const HeartEye = ({ x }) => (
  <path className="tata-expr" d={`M${x} 112 C${x - 16} 101 ${x - 12} 88 ${x} 96 C${x + 12} 88 ${x + 16} 101 ${x} 112Z`} fill="#e5566b" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
)
const ArcEye = ({ x }) => <path d={`M${x - 10} 104 Q${x} 92 ${x + 10} 104`} fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />

function Face({ face, blink }) {
  const f = FACES[face] || FACES.happy
  return (
    <g>
      {f.eyes === 'arc' ? (
        <><ArcEye x={80} /><ArcEye x={120} /></>
      ) : f.eyes === 'heart' ? (
        <><HeartEye x={80} /><HeartEye x={120} /></>
      ) : (
        // both eyes share one blink group so they always close together; no blinking mid-wink
        <g className={blink && f.eyes !== 'wink' ? 'tata-blink' : undefined}>
          {f.eyes === 'wink' ? <ArcEye x={80} /> : <OpenEye x={80} look={f.look} pupil={f.pupil} />}
          <OpenEye x={120} look={f.look} pupil={f.pupil} />
        </g>
      )}
      <path key={`b-${face}`} className="tata-expr" d={f.brows} fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      <ellipse cx="64" cy="122" rx="9" ry="5.5" fill="#e8857a" opacity="0.9" />
      <ellipse cx="136" cy="122" rx="9" ry="5.5" fill="#e8857a" opacity="0.9" />
      <g key={`m-${face}`} className="tata-expr">
        {f.mouth === 'grin' ? (
          <><path d="M88 120Q100 138 112 120Z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" /><path d="M94 127Q100 133 106 127Q100 124 94 127z" fill="#e8857a" /></>
        ) : f.mouth === 'grin-big' ? (
          <><path d="M84 117Q100 146 116 117Z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" /><path d="M92 131Q100 139 108 131Q100 127 92 131z" fill="#e8857a" /></>
        ) : f.mouth === 'o' ? (
          <ellipse cx="100" cy="127" rx="6" ry="8" fill={INK} />
        ) : (
          <path d={f.mouth} fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        )}
      </g>
    </g>
  )
}

/**
 * animated  dashboard idle motion: bob, breathing shadow, looping wave (CSS in index.css)
 * face      optional expression override (see FACES)
 * wave      'idle' | 'once' — chat-page wave for the raised arm (happy mood only; CSS lives in ChatPage)
 * blink     blinking eyes (chat page)
 */
export default function Tata({ mood = 'happy', size = 120, className = '', title, animated = false, face, wave, blink }) {
  const c = MOODS[mood] || MOODS.happy
  const thirsty = mood === 'thirsty'
  const label = title || { happy: 'Tata waving hello', rain: 'Tata expecting rain', thirsty: 'Tata, thirsty in the heat', harvest: 'Tata celebrating the harvest' }[mood]
  return (
    <svg viewBox="0 0 200 224" width={size} height={size * 1.12} className={className} role="img" aria-label={label}>
      <title>{label}</title>
      <defs>
        <clipPath id={`tata-body-${mood}`}><path d={BODY} /></clipPath>
      </defs>

      {/* scene props */}
      {mood === 'rain' && (
        <g transform="translate(150 6)">
          <path d="M8 30h28a10 10 0 0 0 1-20A14 14 0 0 0 10 12a9 9 0 0 0-2 18z" fill="#c9d3dc" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M14 38l-3 7M24 38l-3 7M34 38l-3 7" stroke="#2c86d8" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}
      {thirsty && (
        <g transform="translate(22 22)" stroke="#e8a31b" strokeWidth="3.5" strokeLinecap="round">
          <circle r="11" fill="#f6c43a" />
          <path d="M0-19v-5M0 19v5M-19 0h-5M19 0h5M-13.5-13.5l-3.5-3.5M13.5 13.5l3.5 3.5M-13.5 13.5l-3.5 3.5M13.5-13.5l3.5-3.5" />
        </g>
      )}
      {mood === 'harvest' && (
        <g fill="#f2c230" stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
          <path d="M22 70l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" />
          <path d="M176 52l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
          <path d="M178 118l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" />
        </g>
      )}

      {/* ground shadow */}
      <ellipse cx="100" cy="211" rx="62" ry="7" fill={INK} opacity="0.14" className={animated ? 'tata-shadow' : undefined} />

      {/* everything above the shadow bobs when animated */}
      <g className={animated ? 'tata-bob' : undefined}>

      {/* arms (behind the body) */}
      {mood === 'harvest' ? (
        <>
          <Arm d="M50 120 Q30 100 28 76" /><Hand x={28} y={74} />
          <Arm d="M150 120 Q170 100 172 76" /><Hand x={172} y={74} />
        </>
      ) : mood === 'happy' ? (
        <>
          <Arm d="M48 128 Q30 140 26 160" /><Hand x={26} y={162} />
          <g className={wave ? `tata-chat-arm tata-chat-wave-${wave}` : animated ? 'tata-wave' : undefined}><Arm d="M152 124 Q172 112 176 90" /><Hand x={176} y={88} /></g>
        </>
      ) : (
        <>
          <Arm d="M48 128 Q34 142 34 160" /><Hand x={34} y={162} />
          <Arm d="M152 128 Q166 142 166 160" /><Hand x={166} y={162} />
        </>
      )}

      {/* feet */}
      <ellipse cx="76" cy="200" rx="17" ry="8" fill="#6e4630" stroke={INK} strokeWidth="4" />
      <ellipse cx="124" cy="200" rx="17" ry="8" fill="#6e4630" stroke={INK} strokeWidth="4" />

      {/* soil layers */}
      <g clipPath={`url(#tata-body-${mood})`}>
        <rect x="30" y="50" width="140" height="160" fill={c.low} />
        <path d="M30 50H170V150Q150 144 130 150T90 150T50 150T30 148Z" fill={c.mid} />
        <path d="M30 50H170V112Q150 106 130 112T90 112T50 112T30 110Z" fill={c.top} />
        <path d="M30 50H170V80Q156 88 142 80T114 80T86 80T58 80T30 80Z" fill={c.grass} />
        <path d="M30 80Q44 88 58 80T86 80T114 80T142 80T170 80" fill="none" stroke={INK} strokeWidth="3" opacity="0.55" />
        <path d="M30 112Q50 118 70 112T110 112T150 112T170 112" fill="none" stroke={INK} strokeWidth="2.5" opacity="0.35" />
        <path d="M30 150Q50 156 70 150T110 150T150 150T170 150" fill="none" stroke={INK} strokeWidth="2.5" opacity="0.35" />
        {/* roots / squiggles */}
        <g fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" opacity="0.6">
          <path d="M72 126q-4 5 0 10t0 10" /><path d="M100 128q-4 5 0 10t0 10" /><path d="M128 126q-4 5 0 10t0 10" />
        </g>
        {/* pebbles */}
        <g fill="#efe5d8" stroke={INK} strokeWidth="2.2">
          <ellipse cx="62" cy="178" rx="6" ry="4.5" /><ellipse cx="92" cy="186" rx="4.5" ry="3.5" />
          <ellipse cx="118" cy="170" rx="4" ry="3" /><ellipse cx="140" cy="182" rx="6" ry="4.5" /><ellipse cx="84" cy="166" rx="3" ry="2.4" />
        </g>
        {/* worm */}
        <path d="M150 196q4-14 14-20" fill="none" stroke="#e58a95" strokeWidth="7" strokeLinecap="round" />
        {/* sheen */}
        <path d="M58 92Q56 130 62 168" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.14" />
      </g>
      <path d={BODY} fill="none" stroke={INK} strokeWidth="5" strokeLinejoin="round" />

      {/* grass tufts */}
      <g fill={c.grass} stroke={INK} strokeWidth="2.6" strokeLinejoin="round">
        <path d="M60 60l3-11 3 8 3-10 3 13z" /><path d="M128 60l3-12 3 9 3-10 3 13z" /><path d="M82 59l2-8 3 6 2-7 2 9z" />
      </g>

      {/* sprout */}
      {thirsty ? (
        <g stroke={INK} strokeWidth="3.5" strokeLinejoin="round">
          <path d="M100 58Q100 42 108 36" fill="none" stroke={c.sprout} strokeWidth="5" strokeLinecap="round" />
          <path d="M106 36Q98 26 86 38Q98 44 106 36z" fill={c.sprout} />
          <path d="M108 36Q122 26 128 44Q114 46 108 36z" fill={c.sprout} />
        </g>
      ) : (
        <g stroke={INK} strokeWidth="3.5" strokeLinejoin="round">
          <path d="M100 58Q99 38 102 24" fill="none" stroke="#3f8f3a" strokeWidth="5" strokeLinecap="round" />
          <path d="M101 34Q84 18 62 28Q80 46 101 34z" fill={c.sprout} />
          <path d="M103 30Q118 8 146 14Q134 40 103 30z" fill={c.sprout} />
          {mood === 'harvest' && (
            <g fill="#f2c230" strokeWidth="2.5">
              <ellipse cx="102" cy="18" rx="4" ry="6" /><ellipse cx="95" cy="8" rx="3.5" ry="5.5" transform="rotate(-20 95 8)" />
              <ellipse cx="109" cy="8" rx="3.5" ry="5.5" transform="rotate(20 109 8)" /><ellipse cx="102" cy="0" rx="3.2" ry="5" />
            </g>
          )}
        </g>
      )}
      {(mood === 'rain' || thirsty) && <path d="M146 72q-5 8 0 11 5-3 0-11z" fill="#7cc3f0" stroke={INK} strokeWidth="2.4" />}

      {/* face */}
      {face ? <Face face={face} blink={blink} /> : <>
      <g className={blink && mood !== 'harvest' ? 'tata-blink' : undefined}>
        <Eye x={80} mood={mood} />
        <Eye x={120} mood={mood} />
      </g>
      {mood !== 'harvest' && (
        <g fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round">
          {thirsty ? (
            <><path d="M68 87l18-5" /><path d="M132 87l-18-5" /></>
          ) : (
            <><path d="M70 83Q80 78 90 83" /><path d="M110 83Q120 78 130 83" /></>
          )}
        </g>
      )}
      <ellipse cx="64" cy="122" rx="9" ry="5.5" fill="#e8857a" opacity="0.9" />
      <ellipse cx="136" cy="122" rx="9" ry="5.5" fill="#e8857a" opacity="0.9" />
      {mood === 'rain' ? (
        <ellipse cx="100" cy="126" rx="5" ry="6.5" fill={INK} />
      ) : thirsty ? (
        <path d="M88 128q4-5 8 0t8 0t8 0" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      ) : (
        <g>
          <path d="M88 120Q100 138 112 120Z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M94 127Q100 133 106 127Q100 124 94 127z" fill="#e8857a" />
        </g>
      )}
      </>}
      </g>
    </svg>
  )
}

/** Pick Tata's face for the farm's situation. */
export function tataMood({ urgentWater, harvest, rainSoon, hot }) {
  if (urgentWater || hot) return 'thirsty'
  if (harvest) return 'harvest'
  if (rainSoon) return 'rain'
  return 'happy'
}
