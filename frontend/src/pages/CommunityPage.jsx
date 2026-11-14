import { useEffect, useState } from 'react'
import { api } from '../api'
import { Icon } from '../components/Icon'
import { MicButton } from '../components/Speech'
import { Pill } from '../components/ui'
import { useApp } from '../context/AppContext'
import { ago } from '../lib/format'

const AVATAR = ['#2f6b3a', '#2c6e9b', '#8a5a3b', '#7a4a8f', '#c06a1a', '#3f7a74']
const TYPE_CLS = {
  warning: 'bg-[#fbe2dc] text-danger',
  question: 'bg-water-soft text-water',
  advice: 'bg-leaf-soft text-leaf',
  update: 'bg-[#f1eee3] text-[#5d5a48]',
  harvest: 'bg-sun-soft text-sun-ink',
}

function Post({ p, crops, onHelpful }) {
  const color = AVATAR[[...p.author].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR.length]
  return (
    <article className="card mb-3 px-4 py-3.5">
      <div className="flex items-center gap-2.5">
        <div className="grid size-9 flex-none place-items-center rounded-[14px] font-semibold text-white" style={{ background: color }}>{p.author[0] || 'F'}</div>
        <div className="min-w-0">
          <b>{p.author}</b>{' '}
          {p.verified && <span className="inline-block rounded-[7px] bg-water-soft px-1.5 py-px text-[10.5px] font-semibold whitespace-nowrap text-water">✓ Agri technician</span>}{' '}
          {p.sample && <span className="inline-block rounded-[7px] bg-surface2 px-1.5 py-px text-[10.5px] whitespace-nowrap text-muted">Sample post</span>}
          <div className="text-[12px] text-muted simple:text-[14px]">{p.mun ? p.mun + ', ' : ''}{p.prov} · {ago(p.created_at)}</div>
        </div>
        <span className={`ml-auto rounded-lg px-[7px] py-px text-[10.5px] font-semibold tracking-[0.04em] uppercase simple:text-[12.5px] ${TYPE_CLS[p.type]}`}>{p.type}</span>
      </div>
      <p className="mt-2 mb-1.5 whitespace-pre-wrap simple:text-[17px]">{p.text}</p>
      <div className="flex items-center gap-2">
        {p.crop && crops[p.crop] && <Pill>{crops[p.crop].fil}</Pill>}
        <button type="button" className={`btn btn-sm ml-auto ${p.helped ? 'bg-leaf-soft! text-leaf-ink' : ''}`} aria-pressed={p.helped} onClick={() => onHelpful(p.id)}>
          Helpful · {p.helpful_count}
        </button>
      </div>
    </article>
  )
}

export default function CommunityPage() {
  const { meta, crops, farm, mode, toast, postsVersion } = useApp()
  const simple = mode === 'simple'
  const [posts, setPosts] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [text, setText] = useState('')
  const [type, setType] = useState('update')
  const [crop, setCrop] = useState('')
  const [filters, setFilters] = useState({ prov: 'all', type: 'all', crop: 'all' })

  useEffect(() => {
    api.get('/posts').then(setPosts).catch(() => setLoadError('Community feed unavailable right now.'))
  }, [postsVersion])

  const submit = async () => {
    const t = text.trim()
    if (!t) return toast('Write something first')
    try {
      const p = await api.post('/posts', { text: t, type, crop })
      setPosts((xs) => [p, ...(xs || [])])
      setText('')
      toast('Posted')
    } catch (e) {
      toast(e.message)
    }
  }
  const helpful = async (id) => {
    try {
      const p = await api.post(`/posts/${id}/helpful`)
      setPosts((xs) => xs.map((x) => (x.id === id ? p : x)))
    } catch (e) {
      toast(e.message)
    }
  }

  const list = (posts || []).filter(
    (p) => (filters.prov === 'all' || p.prov === filters.prov) && (filters.type === 'all' || p.type === filters.type) && (filters.crop === 'all' || p.crop === filters.crop),
  )
  const warnings = (posts || []).filter((p) => p.type === 'warning' && p.prov === farm.prov && Date.now() - p.created_at < 7 * 864e5)
  const cropOptions = Object.entries(crops).map(([k, c]) => <option key={k} value={k}>{c.fil} ({c.en})</option>)
  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }))

  return (
    <section className="px-4 pt-1.5 pb-2.5" aria-label="Community">
      <div className="card mt-2">
        <div className="flex items-start gap-2">
          <textarea
            className="field"
            aria-label="New post"
            placeholder={simple ? 'Ano ang balita sa bukid mo?' : 'Share an update, ask a question, or warn your neighbors…'}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <MicButton value={text} onChange={setText} onDenied={() => toast('Naka-off ang mikropono. Mag-type na lang.')} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <select className="field" aria-label="Post type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="update">Update</option><option value="question">Question</option><option value="advice">Advice</option><option value="warning">Warning</option><option value="harvest">Harvest</option>
          </select>
          <select className="field" aria-label="Crop" value={crop} onChange={(e) => setCrop(e.target.value)}>
            <option value="">Crop (optional)</option>{cropOptions}
          </select>
        </div>
        <button type="button" className="btn btn-pri mt-2 w-full" onClick={submit}>{simple ? 'I-post' : 'Post'}</button>
        {loadError && <p className="note mt-1.5">{loadError}</p>}
      </div>

      <div className="card mt-2.5 px-3 py-2.5">
        <div className="note">
          {warnings.length
            ? warnings.map((w) => (
                <div key={w.id} className="flex gap-2 border-b border-line py-1.5 text-ink last:border-0">
                  <span className="text-danger"><Icon name="alert" /></span>
                  {w.text.slice(0, 110)}{w.text.length > 110 && '…'}
                </div>
              ))
            : `No warnings in ${farm.prov} this week.`}
        </div>
        <details className="disclosure">
          <summary>Filter posts ▾</summary>
          <div className="grid grid-cols-2 gap-2.5">
            <div><label className="field-label">Province</label>
              <select className="field" value={filters.prov} onChange={setFilter('prov')}>
                <option value="all">All</option>{Object.keys(meta.provinces).map((p) => <option key={p}>{p}</option>)}
              </select></div>
            <div><label className="field-label">Type</label>
              <select className="field" value={filters.type} onChange={setFilter('type')}>
                <option value="all">All</option><option value="warning">Warnings</option><option value="question">Questions</option><option value="advice">Advice</option><option value="harvest">Harvest</option>
              </select></div>
          </div>
          <label className="field-label">Crop</label>
          <select className="field" value={filters.crop} onChange={setFilter('crop')}><option value="all">All crops</option>{cropOptions}</select>
        </details>
      </div>

      <div className="mt-2.5">
        {posts === null && !loadError && <p className="note text-center">Loading…</p>}
        {posts && (list.length
          ? list.map((p) => <Post key={p.id} p={p} crops={crops} onHelpful={helpful} />)
          : <div className="card"><p className="note">No posts match these filters yet. Be the first to share.</p></div>)}
      </div>
    </section>
  )
}
