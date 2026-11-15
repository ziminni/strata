// App language. English text is the key; src/i18n/<code>.js maps it to a translation.
// Missing entries fall back to English, so nothing ever renders blank.
// tr('Harvest in {n} days', { n: 5 }) — {name} placeholders are filled from `vars`.
import { createElement, Fragment } from 'react'
import ceb from '../i18n/ceb'
import fil from '../i18n/fil'

export const LANGS = [
  { code: 'en', label: 'English', hint: 'English', locale: 'en-PH', speech: 'en-PH', ai: 'English' },
  { code: 'fil', label: 'Filipino', hint: 'Tagalog', locale: 'fil-PH', speech: 'fil-PH', ai: 'Filipino' },
  { code: 'ceb', label: 'Bisaya', hint: 'Cebuano', locale: 'fil-PH', speech: 'fil-PH', ai: 'Cebuano (Bisaya)' },
]
const DICT = { fil, ceb }
const KEY = 'strata_lang'

function stored() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY))
    return LANGS.some((l) => l.code === v) ? v : 'en'
  } catch {
    return 'en'
  }
}

let current = typeof window === 'undefined' ? 'en' : stored()

export const getLang = () => current
export const langInfo = (code = current) => LANGS.find((l) => l.code === code) || LANGS[0]

/** Switch language (AppContext calls this, then re-renders the app). */
export function setLangCode(code) {
  if (!LANGS.some((l) => l.code === code)) return
  current = code
  try {
    localStorage.setItem(KEY, JSON.stringify(code))
  } catch {
    /* storage unavailable */
  }
  if (typeof document !== 'undefined') document.documentElement.lang = code === 'en' ? 'en' : code
}

/** Translate `s` (English) into the current language, filling {placeholders} from `vars`. */
export function tr(s, vars) {
  if (s == null) return s
  let out = (current !== 'en' && DICT[current]?.[s]) || s
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m))
  return out
}

/**
 * Like tr(), but placeholders may be React elements (e.g. <b>…</b>), so a whole sentence is translated
 * as one unit and the bold parts land where each language puts them. Returns renderable children.
 */
export function trn(s, vars = {}) {
  const parts = tr(s).split(/(\{\w+\})/)
  return parts.map((p, i) => {
    const m = /^\{(\w+)\}$/.exec(p)
    return createElement(Fragment, { key: i }, m ? (vars[m[1]] ?? p) : p)
  })
}

/**
 * Wrap a constant table of English labels so every string read from it is translated at read time
 * (arrays and nested objects too). Non-UI strings in the table (icons, colours) pass through unchanged.
 * Don't pass these to structuredClone / postMessage.
 */
export function localized(obj) {
  return new Proxy(obj, {
    get(target, k, recv) {
      const v = Reflect.get(target, k, recv)
      if (typeof v === 'string') return tr(v)
      if (v && typeof v === 'object') return localized(v)
      return v
    },
  })
}

/** A reason line ({ text, warn } or { key, vars, warn }) in the current language; string values (crop, month) are translated too. */
export const rtext = (r) =>
  r?.key ? tr(r.key, r.vars && Object.fromEntries(Object.entries(r.vars).map(([k, v]) => [k, typeof v === 'string' ? tr(v) : v]))) : tr(r?.text)

/** Plan names: "Your current practice: Palay → Monggo" keeps the crop arrows, translates the prefix. */
export const planName = (n = '') => {
  const p = 'Your current practice: '
  return n.startsWith(p) ? tr('Your current practice: {plan}', { plan: n.slice(p.length).replace('fallow', tr('fallow')) }) : n
}

/** Locale for Intl date/number formatting in the current language. */
export const locale = () => langInfo().locale

if (typeof document !== 'undefined') document.documentElement.lang = current === 'en' ? 'en' : current
