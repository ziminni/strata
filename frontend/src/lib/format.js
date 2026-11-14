export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const BUWAN = ['Enero', 'Pebrero', 'Marso', 'Abril', 'Mayo', 'Hunyo', 'Hulyo', 'Agosto', 'Setyembre', 'Oktubre', 'Nobyembre', 'Disyembre']
export const ARAW = ['Linggo', 'Lunes', 'Martes', 'Miyerkules', 'Huwebes', 'Biyernes', 'Sabado']

export const DAY_MS = 864e5
export function addDays(dt, n) {
  const x = new Date(dt)
  x.setDate(x.getDate() + n)
  return x
}
export const dayDiff = (a, b) => Math.round((a - b) / DAY_MS)
export const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export function parseYmd(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const fmtD = (d) => d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
export const fmtFil = (d) => `${d.getDate()} ${BUWAN[d.getMonth()]}`

export const r1 = (x) => Math.round(x * 10) / 10
export const signed = (x) => (x > 0 ? '+' : '') + r1(x)
export const dots = (v) => '●'.repeat(v) + '○'.repeat(5 - v)

export function ago(ms) {
  const s = (Date.now() - ms) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return Math.floor(s / 60) + ' min ago'
  if (s < 86400) return Math.floor(s / 3600) + ' h ago'
  return Math.floor(s / 86400) + ' d ago'
}

const HONORIFICS = ['mang', 'aling', 'ka', 'tata', 'nanay', 'tatay', 'lolo', 'lola', 'kuya', 'ate']
/** "Mang Ramon's farm" → "Mang Ramon"; "Juan dela Cruz" → "Juan" */
export function shortName(name) {
  const w = name.trim().split(/\s+/)
  const first = HONORIFICS.includes(w[0].toLowerCase()) && w[1] ? `${w[0]} ${w[1]}` : w[0]
  return first.replace(/['’]s$/, '')
}

export function greeting(name) {
  const h = new Date().getHours()
  const g = h < 12 ? 'Magandang umaga' : h < 18 ? 'Magandang hapon' : 'Magandang gabi'
  return g + (name ? ', ' + shortName(name) : '') + '!'
}

export function lsGet(k) {
  try {
    return JSON.parse(localStorage.getItem(k))
  } catch {
    return null
  }
}
export function lsSet(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch {
    /* storage unavailable */
  }
}
