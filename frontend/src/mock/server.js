// In-browser stand-in for the FastAPI backend. Same routes and response shapes as
// backend/app/routers/*, with data kept in localStorage on this device.
import { CROPS, DEFAULT_FARM, FARM_CROPS, LOGTYPES, MON, PLANS, POST_TYPES, PROV, SAMPLE_POSTS, SCEN } from './data'
import { activePlan, ADVICE_CROPS, buildSegs, climSummary, cropAdvice, evaluatePlan, rankedView, segView } from './engine'
import { tr } from '../lib/i18n'
import { geminiChat } from '../lib/gemini'
import { LIKELIHOOD_TIER, LIKELIHOOD_VERDICT, modelReasons } from '../lib/model'
import { wxDay } from '../lib/weather'

const ME = 'me'

const KEYS = { farm: 'strata_farm', logs: 'strata_logs', posts: 'strata_posts_v8', plots: 'strata_plots' }

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

const today = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function parseDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return null
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return Number.isNaN(dt.getTime()) ? null : dt
}
const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function httpError(status, detail) {
  const e = new Error(tr(detail)) // messages reach the screen, so they follow the app language
  e.status = status
  return e
}

/* ---------- store ---------- */
function seedPosts() {
  const t = Date.now()
  return SAMPLE_POSTS.map((sp, i) => {
    if (Array.isArray(sp)) {
      const [hours, author, verified, prov, crop, type, text] = sp
      return {
        id: i + 1, text, type, crop, prov, mun: '', author_label: author, mine: false, verified, sample: true,
        helpful: [], comments: [], image: '', images: [], created_at: t - hours * 3600e3,
      }
    }
    const imgList = Array.isArray(sp.images) && sp.images.length ? sp.images : (sp.image ? [sp.image] : [])
    return {
      id: i + 1,
      text: sp.text,
      type: sp.type,
      crop: sp.crop || '',
      prov: sp.prov || 'Valencia City',
      mun: sp.mun || '',
      author_label: sp.author,
      mine: false,
      verified: !!sp.verified,
      sample: true,
      helpful: Array.from({ length: sp.helpful_count || 0 }, (_, k) => `farmer_${k}`),
      comments: (sp.comments || []).map((c) => ({
        id: c.id || Date.now() + Math.random(),
        author: c.author,
        location: c.mun ? `${c.mun}, ${c.prov}` : c.prov || '',
        text: c.text,
        created_at: t - (c.hours || 1) * 3600e3,
      })),
      image: imgList[0] || '',
      images: imgList,
      created_at: t - sp.hours * 3600e3,
    }
  })
}
const getFarm = () => normalizeFarm(load(KEYS.farm, () => ({})))
const getLogs = () => load(KEYS.logs, () => [])
const getPosts = () => load(KEYS.posts, () => save(KEYS.posts, seedPosts()))
const nextId = (rows) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1

// The farmer has ONE crop at a time. Older builds stored a list, so keep only the newest entry.
const getCrop = () => {
  const v = load(KEYS.plots, () => null)
  return Array.isArray(v) ? [...v].sort((a, b) => b.created_at - a.created_at)[0] || null : v
}

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
    name: String(f.name ?? '').trim().slice(0, 80) || d.name,
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
  const imgList = Array.isArray(p.images) && p.images.length ? p.images : (p.image ? [p.image] : [])
  return {
    id: p.id,
    text: p.text,
    type: p.type,
    crop: p.crop,
    prov: p.prov,
    mun: p.mun,
    author: p.mine ? getFarm().name : p.author_label, // your own posts show your current name
    mine: p.mine,
    verified: p.verified,
    sample: p.sample,
    helpful_count: (p.helpful || []).length,
    helped: (p.helpful || []).includes(ME),
    comments: (p.comments || []).map((c) => ({
      id: c.id,
      author: c.author,
      location: c.location || '',
      text: c.text,
      created_at: c.created_at,
    })),
    image: imgList[0] || '',
    images: imgList,
    created_at: p.created_at,
  }
}

function addPost(text, type, crop, image = '', images = [], place = '', mun = '', prov = '') {
  const farm = getFarm()
  const posts = getPosts()
  const imgList = Array.isArray(images) && images.length ? images.slice(0, 5) : (image ? [image] : [])
  const m = mun || place || farm.mun || 'Bagontaas'
  const pr = prov || farm.prov || 'Valencia City'
  const p = {
    id: nextId(posts),
    text,
    type,
    crop: crop || '',
    prov: pr,
    mun: m,
    author_label: farm.name,
    mine: true,
    verified: false,
    sample: false,
    helpful: [],
    comments: [],
    image: imgList[0] || '',
    images: imgList,
    created_at: Date.now(),
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
/* ---------- Tata chat context ---------- */
const WATER_TXT = { canal: 'irrigated (canal, reliable)', limited: 'limited irrigation in the dry season', rainfed: 'rainfed only' }
function chatContext(body) {
  const farm = getFarm()
  const crop = getCrop()
  const lines = []
  lines.push(`Farm: ${farm.name}, ${farm.mun}, ${farm.prov}, Philippines. ${farm.area} ha, water: ${WATER_TXT[farm.water] || farm.water}, soil: ${farm.tex}, drainage: ${farm.drain}, pH ${farm.ph}, organic matter ${farm.om}%.`)
  if (crop) {
    const c = CROPS[crop.crop]
    lines.push(`Current crop: ${c.fil} (${c.en}), planting window ${crop.planted}${crop.planted_end ? ' to ' + crop.planted_end : ''}, field at ${crop.mun}, ${crop.prov}.`)
    if (crop.model) {
      const m = crop.model
      lines.push(`STRATA crop model (EcoCrop-informed climate screening on NASA POWER data${m.years ? ' ' + m.years.join('–') : ''}): planting likelihood ${m.likelihood}, climate compatibility score ${(m.score / 100).toFixed(2)}, most compatible planting date ${m.best_date}. Temperature fit ${m.window_temp_score ?? '?'}/100, yearly climate ${m.climate_score ?? '?'}/100, dry spells ~${m.dry_spell_days ?? '?'} days, heavy-rain days ${m.heavy_rain_days ?? '?'}, days over 36°C ${m.heat_days ?? '?'}.`)
    }
  } else lines.push('The farmer has not chosen a crop yet (they can add one with "Choose your crop").')
  const s = body?.sensor
  if (s && s.soil_moisture_pct != null)
    lines.push(`Field sensor now: soil moisture ${Math.round(s.soil_moisture_pct)}%, paddy water level ${Math.round(s.water_level_cm)} cm (AWD: irrigate at -15 cm or lower), soil temperature ${Number(s.soil_temp_c).toFixed(1)}°C.`)
  try {
    const prov = crop?.prov || farm.prov
    const series = climSummary(prov).series
    const today = new Date()
    const days = [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
      const w = wxDay(prov, series, d)
      return `${isoDate(d)}: ${w.txt}, ${w.lo}–${w.hi}°C, rain chance ${w.chance}%${w.mm != null ? `, ~${Math.round(w.mm)} mm` : ''}`
    })
    lines.push(`7-day forecast${'' }:\n` + days.join('\n'))
  } catch {
    /* forecast unavailable */
  }
  const lang = body?.language || 'English'
  return [
    'You are Tata, a friendly, practical farm helper in the Strata app for smallholder farmers in Valencia City, Bukidnon, Philippines (rice/palay, corn/mais, tobacco/tabako).',
    `Always reply in ${lang}, in plain words a farmer understands. Keep answers short: 2–5 sentences or a few bullet points. Use the farm data below; give concrete numbers, days and actions.`,
    'Write plain text only: no markdown, no asterisks, no headings. For a list, start each line with "• ".',
    'If something is outside the data, say so and give general good practice (DA / PhilRice / PAGASA guidance). Never invent sensor readings or forecasts. For pesticides, give safe-use advice and suggest the local agriculturist.',
    `Today is ${isoDate(new Date())}.`,
    '',
    'FARM DATA',
    ...lines,
  ].join('\n')
}

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
      farm_crops: FARM_CROPS,
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
    const images = Array.isArray(body?.images)
      ? body.images.filter((x) => typeof x === 'string' && x).slice(0, 5)
      : []
    const image = typeof body?.image === 'string' && body.image ? body.image : (images[0] || '')
    return addPost(
      text.slice(0, 2000),
      body.type,
      CROPS[body.crop] ? body.crop : '',
      image,
      images,
      body.place || '',
      body.mun || '',
      body.prov || ''
    )
  }
  const helpful = p.match(/^\/posts\/(\d+)\/helpful$/)
  if (method === 'POST' && helpful) {
    const posts = getPosts()
    const post = posts.find((x) => x.id === +helpful[1])
    if (!post) throw httpError(404, 'Post not found')
    post.helpful = post.helpful || []
    post.helpful = post.helpful.includes(ME) ? post.helpful.filter((x) => x !== ME) : [...post.helpful, ME]
    save(KEYS.posts, posts)
    return postView(post)
  }
  const commentRoute = p.match(/^\/posts\/(\d+)\/comments$/)
  if (method === 'POST' && commentRoute) {
    const posts = getPosts()
    const post = posts.find((x) => x.id === +commentRoute[1])
    if (!post) throw httpError(404, 'Post not found')
    const text = String(body?.text || '').trim()
    if (!text) throw httpError(422, 'Comment cannot be empty')
    const farm = getFarm()
    const author = farm.name
    const newComment = {
      id: Date.now(),
      author,
      location: farm.mun ? `${farm.mun}, ${farm.prov}` : farm.prov,
      text: text.slice(0, 1000),
      created_at: Date.now(),
    }
    post.comments = post.comments || []
    post.comments.push(newComment)
    save(KEYS.posts, posts)
    return postView(post)
  }

  /* fields the farmer has planted, each with the advice snapshot taken when it was added */
  if (route === 'GET /crop-advice') {
    const base = getFarm()
    const prov = PROV[q.get('prov')] ? q.get('prov') : base.prov
    const water = oneOf(q.get('water'), ['canal', 'limited', 'rainfed'], base.water)
    const start = parseDate(q.get('start')) || today()
    const moist = q.has('moist') ? num(q.get('moist'), 0, 100, null) : null
    return { prov, water, start: isoDate(start), crops: cropAdvice({ ...base, prov, water }, start, moist) }
  }
  if (route === 'GET /crop') return getCrop()
  if (route === 'PUT /crop') {
    const b = body || {}
    if (!PROV[b.prov]) throw httpError(422, 'Pick a province')
    if (!ADVICE_CROPS.includes(b.crop)) throw httpError(422, 'Pick a crop')
    const planted = parseDate(b.planted)
    if (!planted) throw httpError(422, 'Pick a planting date')
    const farm = getFarm()
    // the form only asks for crop, location and start date; water and size come from the farm profile
    const water = oneOf(b.water, ['canal', 'limited', 'rainfed'], farm.water)
    const moist = b.moist == null ? null : num(b.moist, 0, 100, null)
    const ctx = { ...farm, prov: b.prov, water }
    // analyse on our side so the snapshot can't be tampered with
    const [advice] = cropAdvice(ctx, planted, moist, b.crop)
    // timing check: is the chosen start date a good time? scan the next ~4 months for a better start
    let best = { start: planted, score: advice.score }
    for (let i = 7; i <= 120; i += 7) {
      const d = new Date(planted.getFullYear(), planted.getMonth(), planted.getDate() + i)
      const [a] = cropAdvice(ctx, d, null, b.crop)
      if (a.score > best.score) best = { start: d, score: a.score }
    }
    const timing = {
      verdict: advice.tier === 'recommended' ? 'good' : advice.tier === 'possible' ? 'okay' : 'poor',
      better_start: best.score >= advice.score + 8 ? isoDate(best.start) : null,
      better_score: best.score >= advice.score + 8 ? best.score : null,
    }
    // STRATA crop model result (sent by the client, see src/lib/model.js) overrides the built-in score and timing
    const model = b.model && LIKELIHOOD_TIER[b.model.likelihood] ? b.model : null
    if (model) {
      const best = model.best_date && model.best_date !== isoDate(planted) ? model.best_date : null
      timing.verdict = LIKELIHOOD_VERDICT[model.likelihood]
      timing.better_start = best
      timing.better_score = null // the model scores one window; it gives a better date, not a second score
    }
    const plot = {
      name: String(b.name || '').trim().slice(0, 40) || 'My field',
      prov: b.prov,
      mun: PROV[b.prov].mun.includes(b.mun) ? b.mun : PROV[b.prov].mun[0],
      lat: Number.isFinite(+b.lat) && b.lat !== null ? +b.lat : null,
      lon: Number.isFinite(+b.lon) && b.lon !== null ? +b.lon : null,
      area: num(b.area ?? farm.area, 0.01, 1000, 1),
      water,
      timing,
      crop: b.crop,
      planted: isoDate(planted),
      // end of the farmer's planting window (the start is `planted`)
      planted_end: parseDate(b.planted_end) && parseDate(b.planted_end) >= planted ? isoDate(parseDate(b.planted_end)) : null,
      score: model ? model.score : advice.score,
      tier: model ? LIKELIHOOD_TIER[model.likelihood] : advice.tier,
      reasons: model ? [...modelReasons(model), ...advice.reasons] : advice.reasons,
      model,
      harvest: advice.harvest,
      created_at: Date.now(),
    }
    save(KEYS.plots, plot) // replaces the previous crop
    return plot
  }

  if (route === 'POST /chat') {
    // Tata via Google Gemini (see src/lib/gemini.js); the farm, crop, sensor and forecast go in as context
    const msgs = (body?.messages || []).filter((m) => (m.role === 'user' || m.role === 'assistant') && String(m.content || '').trim()).slice(-16)
    if (!msgs.length || msgs[msgs.length - 1].role !== 'user') throw httpError(422, 'Write something first')
    try {
      const reply = await geminiChat(msgs, chatContext(body))
      return { reply, tool_notes: [] }
    } catch (e) {
      if (e.status === 504) throw httpError(504, 'The adviser took too long. Please try again.')
      if (e.status === 401 || e.status === 403 || e.status === 400) {
        console.warn('[chat] Gemini rejected the request:', e.message)
        throw httpError(503, 'Tata can’t reach the AI service right now. Check the GEMINI_API_KEY in .env.local and restart the dev server.')
      }
      console.warn('[chat] Gemini error:', e.message)
      throw httpError(503, 'Tata is busy right now. Please try again in a minute.')
    }
  }

  throw httpError(404, `No offline route for ${route}`)
}
