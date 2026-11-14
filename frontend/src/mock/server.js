// In-browser stand-in for the FastAPI backend. Same routes and response shapes as
// backend/app/routers/*, with data kept in localStorage on this device.
import { CROPS, DEFAULT_FARM, LOGTYPES, MON, PLANS, POST_TYPES, PROV, SAMPLE_POSTS, SCEN } from './data'
import { activePlan, buildSegs, climSummary, evaluatePlan, rankedView, segView } from './engine'

const ME = 'me'
const KEYS = { farm: 'strata_farm', logs: 'strata_logs', posts: 'strata_posts' }

function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key))
    return v ?? fallback()
  } catch {
    return fallback()
  }
}
function save(key, v) {
  try {
    localStorage.setItem(key, JSON.stringify(v))
  } catch {
    /* storage full or blocked: keep working in memory for this session */
  }
  return v
}

function httpError(status, detail) {
  const e = new Error(detail)
  e.status = status
  return e
}

/* ---------- store ---------- */
function seedPosts() {
  const t = Date.now()
  return SAMPLE_POSTS.map(([hours, author, verified, prov, crop, type, text], i) => ({
    id: i + 1, text, type, crop, prov, mun: '', author_label: author, mine: false, verified, sample: true, helpful: [], created_at: t - hours * 3600e3,
  }))
}
const getFarm = () => normalizeFarm(load(KEYS.farm, () => ({})))
const getLogs = () => load(KEYS.logs, () => [])
const getPosts = () => load(KEYS.posts, () => save(KEYS.posts, seedPosts()))
const nextId = (rows) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1

/* ---------- validation (mirrors backend/app/schemas.py) ---------- */
const oneOf = (v, opts, d) => (opts.includes(v) ? v : d)
const num = (v, lo, hi, d) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d
}

function normalizeFarm(f = {}) {
  const d = DEFAULT_FARM
  const prov = PROV[f.prov] ? f.prov : d.prov
  const w = f.w || {}
  return {
    name: String(f.name ?? '').slice(0, 80),
    prov,
    mun: PROV[prov].mun.includes(f.mun) ? f.mun : PROV[prov].mun[0],
    area: num(f.area, 0.1, 1000, d.area),
    water: oneOf(f.water, ['canal', 'limited', 'rainfed'], d.water),
    tex: oneOf(f.tex, ['clay', 'clayloam', 'loam', 'sandy'], d.tex),
    drain: oneOf(f.drain, ['poor', 'mod', 'good'], d.drain),
    ph: num(f.ph, 4, 9, d.ph),
    om: num(f.om, 0.2, 8, d.om),
    wet: 'rice',
    dry: oneOf(f.dry, ['rice', 'fallow', 'monggo', 'sibuyas', 'mais'], d.dry),
    straw: oneOf(f.straw, ['burn', 'remove', 'incorporate'], d.straw),
    budget: num(f.budget, 1, 5, d.budget),
    labor: num(f.labor, 1, 5, d.labor),
    w: Object.fromEntries(Object.entries(d.w).map(([k, v]) => [k, Math.round(num(w[k], 0, 5, v))])),
    adopted: PLANS.some((p) => p.id === f.adopted) ? f.adopted : null,
  }
}

function postView(p) {
  return {
    id: p.id, text: p.text, type: p.type, crop: p.crop, prov: p.prov, mun: p.mun,
    author: p.mine ? 'You' : p.author_label, mine: p.mine, verified: p.verified, sample: p.sample,
    helpful_count: p.helpful.length, helped: p.helpful.includes(ME), created_at: p.created_at,
  }
}

function addPost(text, type, crop) {
  const farm = getFarm()
  const posts = getPosts()
  const p = {
    id: nextId(posts), text, type, crop: crop || '', prov: farm.prov, mun: farm.mun,
    author_label: (farm.name ? farm.name.split(' ')[0] : 'Farmer') + ' · ' + farm.mun,
    mine: true, verified: false, sample: false, helpful: [], created_at: Date.now(),
  }
  save(KEYS.posts, [p, ...posts])
  return postView(p)
}

function scenario(q, fallback) {
  const s = q.get('scenario') || fallback
  if (!SCEN[s]) throw httpError(422, 'Unknown scenario')
  return s
}

/* ---------- routes ---------- */
export async function handle(method, path, body) {
  const url = new URL(path, 'http://local')
  const p = url.pathname
  const q = url.searchParams
  const route = `${method} ${p}`

  if (route === 'GET /health') return { status: 'ok', message: 'Offline preview (no server)' }

  if (route === 'GET /meta')
    return {
      months: MON,
      provinces: Object.fromEntries(Object.entries(PROV).map(([k, v]) => [k, { lat: v.lat, lon: v.lon, mun: v.mun }])),
      scenarios: SCEN,
      crops: Object.fromEntries(Object.entries(CROPS).filter(([k]) => k !== 'fallow').map(([k, c]) => [k, { fil: c.fil, en: c.en, days: c.days, color: c.color, legume: c.legume }])),
      plans: PLANS.map(({ id, name }) => ({ id, name })),
      log_types: LOGTYPES,
      post_types: POST_TYPES,
    }

  if (route === 'GET /farm') return getFarm()
  if (route === 'PUT /farm') {
    if (body?.adopted && !PLANS.some((x) => x.id === body.adopted)) throw httpError(422, 'Unknown plan')
    return save(KEYS.farm, normalizeFarm(body))
  }

  if (route === 'GET /climate') {
    const farm = getFarm()
    const s = scenario(q, 'now')
    const pv = PROV[farm.prov]
    return {
      scenario: s, label: SCEN[s].label,
      province: { name: farm.prov, mun: farm.mun, lat: pv.lat, lon: pv.lon },
      summary: climSummary(farm.prov, s),
      baseline: climSummary(farm.prov, 'now'),
    }
  }

  if (route === 'GET /plans') return rankedView(getFarm(), scenario(q, 'ssp245'))

  if (route === 'GET /season') {
    const farm = getFarm()
    const plan = activePlan(farm)
    const y = new Date().getFullYear()
    const segs = [y - 2, y - 1, y, y + 1].flatMap((year) => buildSegs(plan, year)).map(segView)
    return { plan: { id: plan.id, name: plan.name, adopted: !!farm.adopted }, segs, soil_score: evaluatePlan(farm, plan, 'now').soil }
  }

  if (route === 'GET /logs') return [...getLogs()].sort((a, b) => b.date.localeCompare(a.date) || b.created_at - a.created_at)
  if (route === 'POST /logs') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body?.date || '')) throw httpError(422, 'Pick a valid date')
    if (!LOGTYPES[body.type]) throw httpError(422, 'Unknown log type')
    if (!CROPS[body.crop] || body.crop === 'fallow') throw httpError(422, 'Unknown crop')
    const logs = getLogs()
    const log = {
      id: nextId(logs), date: body.date, type: body.type, crop: body.crop,
      amount: String(body.amount || '').slice(0, 200), cost: num(body.cost, 0, 1e9, 0), yield_kg: num(body.yield_kg, 0, 1e9, 0),
      notes: String(body.notes || '').slice(0, 2000), visibility: body.visibility === 'community' ? 'community' : 'private', created_at: Date.now(),
    }
    save(KEYS.logs, [log, ...logs])
    if (log.visibility === 'community') {
      const parts = [LOGTYPES[log.type], CROPS[log.crop].fil, log.amount, log.yield_kg ? `${log.yield_kg} kg` : ''].filter(Boolean)
      const type = log.type === 'harvest' ? 'harvest' : ['observation', 'weather'].includes(log.type) ? 'warning' : 'update'
      addPost((parts.join(' · ') + '\n' + log.notes).trim(), type, log.crop)
    }
    return log
  }

  if (route === 'GET /posts') return getPosts().sort((a, b) => b.created_at - a.created_at).slice(0, 150).map(postView)
  if (route === 'POST /posts') {
    const text = String(body?.text || '').trim()
    if (!text) throw httpError(422, 'Write something first')
    if (!POST_TYPES.includes(body.type)) throw httpError(422, 'Unknown post type')
    return addPost(text.slice(0, 2000), body.type, CROPS[body.crop] ? body.crop : '')
  }
  const helpful = p.match(/^\/posts\/(\d+)\/helpful$/)
  if (method === 'POST' && helpful) {
    const posts = getPosts()
    const post = posts.find((x) => x.id === +helpful[1])
    if (!post) throw httpError(404, 'Post not found')
    post.helpful = post.helpful.includes(ME) ? post.helpful.filter((x) => x !== ME) : [...post.helpful, ME]
    save(KEYS.posts, posts)
    return postView(post)
  }

  if (route === 'POST /chat')
    throw httpError(503, 'The AI adviser works once the app is connected to the Strata server. Meanwhile, the Rotation plans section shows the full analysis for your farm.')

  throw httpError(404, `No offline route for ${route}`)
}
