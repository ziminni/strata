import { useEffect, useState } from 'react'
import { api } from '../api'
import { Icon } from '../components/Icon'
import { Pill } from '../components/ui'
import { useApp } from '../context/AppContext'
import { ago } from '../lib/format'
import { VALENCIA_PLACES } from '../mock/data'
import { localized, tr } from '../lib/i18n'

const VALENCIA_BARANGAYS = VALENCIA_PLACES || [
  'Bagontaas', 'Banlag', 'Barobo', 'Batangan', 'Catumbalon', 'Colonia',
  'Concepcion', 'Dagat-Kidavao', 'Guinoyuran', 'Kahaponan', 'Laligan',
  'Lilingayon', 'Lourdes', 'Lumbayao', 'Lumbo', 'Lurogan', 'Maapag',
  'Mabuhay', 'Mailag', 'Mt. Nebo', 'Nabago', 'Pinatilan', 'Poblacion',
  'San Carlos', 'San Isidro', 'Sinabuagan', 'Sinayawan', 'Sugod',
  'Tongantongan', 'Tugaya', 'Vintar',
]

const AVATAR = ['#2f6b3a', '#2c6e9b', '#8a5a3b', '#7a4a8f', '#c06a1a', '#3f7a74']
const TYPE_CLS = {
  warning: 'bg-[#fbe2dc] text-danger border border-danger/20',
  question: 'bg-water-soft text-water border border-water/20',
  advice: 'bg-leaf-soft text-leaf border border-leaf/20',
  update: 'bg-[#f1eee3] text-[#5d5a48] border border-[#d3cebe]',
  harvest: 'bg-sun-soft text-sun-ink border border-sun/20',
}

const PAGE_SIZE = 5
const POST_KINDS = localized([
  ['update', 'Update', 'note'],
  ['question', 'Question', 'chat'],
  ['advice', 'Advice', 'leaf'],
  ['warning', 'Warning', 'alert'],
  ['harvest', 'Harvest', 'sprout'],
])

export function isNewsPost(p) {
  if (p.verified) return true
  if (p.is_news || p.role === 'moderator' || p.role === 'technician') return true
  const a = (p.author || '').toLowerCase()
  return (
    a.includes('technician') ||
    a.includes('philrice') ||
    a.includes('rfo') ||
    a.includes('da ') ||
    a.includes('nia') ||
    a.includes('cooperative') ||
    a.includes('engr.') ||
    a.includes('moderator')
  )
}

function PostImagesGrid({ images, onImageClick }) {
  if (!images || images.length === 0) return null

  if (images.length === 1) {
    return (
      <div className="mt-2.5 border-y border-line/50 bg-black/5 overflow-hidden">
        <img
          src={images[0]}
          alt={tr('Attached farm photograph')}
          className="w-full max-h-[380px] object-cover cursor-pointer hover:brightness-95 transition-all"
          onClick={() => onImageClick(0)}
          loading="lazy"
        />
      </div>
    )
  }

  if (images.length === 2) {
    return (
      <div className="mt-2.5 border-y border-line/50 bg-black/5 grid grid-cols-2 gap-1 overflow-hidden">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={tr('Photo {n}', { n: idx + 1 })}
            className="w-full h-[220px] object-cover cursor-pointer hover:brightness-95 transition-all"
            onClick={() => onImageClick(idx)}
            loading="lazy"
          />
        ))}
      </div>
    )
  }

  if (images.length === 3) {
    return (
      <div className="mt-2.5 border-y border-line/50 bg-black/5 grid grid-cols-2 gap-1 overflow-hidden">
        <img
          src={images[0]}
          alt={tr('Photo 1')}
          className="col-span-2 w-full h-[200px] object-cover cursor-pointer hover:brightness-95 transition-all"
          onClick={() => onImageClick(0)}
          loading="lazy"
        />
        <img
          src={images[1]}
          alt={tr('Photo 2')}
          className="w-full h-[150px] object-cover cursor-pointer hover:brightness-95 transition-all"
          onClick={() => onImageClick(1)}
          loading="lazy"
        />
        <img
          src={images[2]}
          alt={tr('Photo 3')}
          className="w-full h-[150px] object-cover cursor-pointer hover:brightness-95 transition-all"
          onClick={() => onImageClick(2)}
          loading="lazy"
        />
      </div>
    )
  }

  if (images.length === 4) {
    return (
      <div className="mt-2.5 border-y border-line/50 bg-black/5 grid grid-cols-2 gap-1 overflow-hidden">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={tr('Photo {n}', { n: idx + 1 })}
            className="w-full h-[160px] object-cover cursor-pointer hover:brightness-95 transition-all"
            onClick={() => onImageClick(idx)}
            loading="lazy"
          />
        ))}
      </div>
    )
  }

  // 5 images
  return (
    <div className="mt-2.5 border-y border-line/50 bg-black/5 grid grid-cols-6 gap-1 overflow-hidden">
      <img
        src={images[0]}
        alt={tr('Photo 1')}
        className="col-span-3 w-full h-[180px] object-cover cursor-pointer hover:brightness-95 transition-all"
        onClick={() => onImageClick(0)}
        loading="lazy"
      />
      <img
        src={images[1]}
        alt={tr('Photo 2')}
        className="col-span-3 w-full h-[180px] object-cover cursor-pointer hover:brightness-95 transition-all"
        onClick={() => onImageClick(1)}
        loading="lazy"
      />
      <img
        src={images[2]}
        alt={tr('Photo 3')}
        className="col-span-2 w-full h-[130px] object-cover cursor-pointer hover:brightness-95 transition-all"
        onClick={() => onImageClick(2)}
        loading="lazy"
      />
      <img
        src={images[3]}
        alt={tr('Photo 4')}
        className="col-span-2 w-full h-[130px] object-cover cursor-pointer hover:brightness-95 transition-all"
        onClick={() => onImageClick(3)}
        loading="lazy"
      />
      <img
        src={images[4]}
        alt={tr('Photo 5')}
        className="col-span-2 w-full h-[130px] object-cover cursor-pointer hover:brightness-95 transition-all"
        onClick={() => onImageClick(4)}
        loading="lazy"
      />
    </div>
  )
}

function FacebookPost({ p, crops, farm, onLike, onComment, toast }) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [activeImageIdx, setActiveImageIdx] = useState(null)

  const color = AVATAR[[...p.author].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR.length]
  const comments = p.comments || []
  const likesCount = p.helpful_count || 0
  const isLiked = p.helped
  const postImages = Array.isArray(p.images) && p.images.length > 0 ? p.images : p.image ? [p.image] : []

  const handleSendComment = async (e) => {
    e?.preventDefault()
    const t = commentText.trim()
    if (!t) return
    setSubmittingComment(true)
    try {
      await onComment(p.id, t)
      setCommentText('')
      setShowComments(true)
      toast(tr('Comment posted'))
    } catch (err) {
      toast(err.message || tr('Could not post comment'))
    } finally {
      setSubmittingComment(false)
    }
  }

  return (
    <article className="card mb-3.5 p-0 overflow-hidden shadow-card border border-line bg-surface transition-all">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-3.5 pb-2">
        <div
          className="grid size-10 flex-none place-items-center rounded-full font-bold text-[15px] text-white shadow-xs"
          style={{ background: p.mine ? '#1e7f43' : color }}
        >
          {p.author[0]?.toUpperCase() || 'F'}
        </div>
        <div className="min-w-0 flex-1">
          {/* name · badge … time · post type */}
          <div className="flex items-center gap-1.5 leading-snug">
            <b className="min-w-0 truncate text-[15px] font-bold text-ink">{p.author}</b>
            {isNewsPost(p) ? (
              <span className="inline-flex flex-none items-center gap-0.5 rounded-[6px] bg-water-soft px-1.5 py-0.5 text-[10.5px] font-semibold text-water">
                <Icon name="check" className="size-3" /> {tr('Official')}
              </span>
            ) : p.verified ? (
              <span className="inline-flex flex-none items-center gap-0.5 rounded-[6px] bg-water-soft px-1.5 py-0.5 text-[10.5px] font-semibold text-water">
                <Icon name="check" className="size-3" /> {tr('Verified')}
              </span>
            ) : null}
            <span className="ml-auto flex-none text-[12px] whitespace-nowrap text-muted">{ago(p.created_at)}</span>
            <span className={`flex-none rounded-lg px-2 py-0.5 text-[10.5px] font-bold tracking-[0.04em] uppercase ${TYPE_CLS[p.type] || TYPE_CLS.update}`}>
              {tr(p.type)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[12px] text-muted">
            <Icon name="pin" className="size-3 flex-none text-muted" />
            <span className="min-w-0 truncate">{p.mun ? `${p.mun}, ` : ''}{p.prov}</span>
            <span className="flex-none">·</span>
            <span title={tr('Public')} className="inline-flex flex-none items-center text-muted">
              <Icon name="globe" className="size-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Post Text */}
      <div className="px-4 py-1.5">
        <p className="text-[15px] leading-relaxed text-ink whitespace-pre-wrap">{p.text}</p>
        {p.crop && crops[p.crop] && (
          <div className="mt-2.5 flex items-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft px-2.5 py-0.5 text-[12px] font-semibold text-leaf-ink">
              <Icon name="sprout" className="size-3.5" />
              {crops[p.crop].fil} ({crops[p.crop].en})
            </span>
          </div>
        )}
      </div>

      {/* Post Images Grid */}
      <PostImagesGrid images={postImages} onImageClick={(idx) => setActiveImageIdx(idx)} />

      {/* Social Engagement Counters */}
      <div className="flex items-center justify-between px-4 pt-2.5 pb-1 text-[12.5px] text-muted">
        <div className="flex items-center gap-1.5">
          <span className="grid size-4.5 place-items-center rounded-full bg-leaf text-white shadow-xs">
            <Icon name="thumb" className="size-2.5 stroke-[2.5]" />
          </span>
          <span className="font-medium text-ink-soft">
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </span>
        </div>
        {comments.length > 0 && (
          <button
            type="button"
            className="hover:underline font-medium text-ink-soft"
            onClick={() => setShowComments(!showComments)}
          >
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </button>
        )}
      </div>

      {/* Action Buttons Bar */}
      <div className="mx-4 border-t border-line/70 my-1" />
      <div className="grid grid-cols-2 gap-1 px-3 py-1">
        <button
          type="button"
          onClick={() => onLike(p.id)}
          aria-pressed={isLiked}
          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-[13.5px] font-semibold transition-all ${
            isLiked
              ? 'text-leaf bg-leaf-soft/60 font-bold'
              : 'text-ink/80 hover:bg-surface2 active:scale-95'
          }`}
        >
          <Icon name="thumb" className={`size-[18px] ${isLiked ? 'stroke-[2.3]' : ''}`} />
          <span>{isLiked ? 'Liked' : 'Like'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center justify-center gap-2 py-2 rounded-xl text-[13.5px] font-semibold transition-all ${
            showComments
              ? 'text-water bg-water-soft/60 font-bold'
              : 'text-ink/80 hover:bg-surface2 active:scale-95'
          }`}
        >
          <Icon name="comment" className="size-[18px]" />
          <span>{tr('Comment')}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-line/50 bg-[#fafaf8] dark:bg-surface/60 px-4 py-3 space-y-3">
          {/* List of comments */}
          {comments.length > 0 && (
            <div className="space-y-2.5">
              {comments.map((c, i) => {
                const cColor = AVATAR[[...c.author].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AVATAR.length]
                return (
                  <div key={c.id || i} className="flex items-start gap-2.5">
                    <div
                      className="grid size-7 flex-none place-items-center rounded-full text-[11px] font-bold text-white shadow-xs"
                      style={{ background: cColor }}
                    >
                      {c.author[0]?.toUpperCase() || 'F'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="inline-block rounded-2xl bg-surface px-3.5 py-2 border border-line/70 shadow-xs max-w-full">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="font-bold text-[13px] text-ink">{c.author}</span>
                          {c.location && (
                            <span className="text-[11px] text-muted truncate">({c.location})</span>
                          )}
                        </div>
                        <p className="text-[13px] text-ink leading-relaxed whitespace-pre-wrap mt-0.5">{c.text}</p>
                      </div>
                      <div className="text-[10.5px] text-muted pl-2 mt-0.5">
                        {c.created_at ? ago(c.created_at) : tr('Just now')}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* New Comment Input Box */}
          <form onSubmit={handleSendComment} className="flex items-center gap-2 pt-1">
            <div
              className="grid size-8 flex-none place-items-center rounded-full text-[12px] font-bold text-white shadow-xs"
              style={{ background: '#1e7f43' }}
            >
              {(farm.name ? farm.name[0] : 'Y').toUpperCase()}
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                className="field !rounded-full !py-1.5 !px-3.5 !text-[13px] !pr-10"
                placeholder={tr('Comment as {name}…', { name: farm.name || tr('Farmer') })}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={submittingComment}
              />
              {commentText.trim() && (
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-full bg-leaf text-white hover:bg-leaf/90 transition-transform active:scale-95"
                  aria-label={tr('Send comment')}
                >
                  <Icon name="chevron" className="size-4 -rotate-90 stroke-[2.5]" />
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Lightbox Carousel for Post Images */}
      {activeImageIdx !== null && postImages[activeImageIdx] && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setActiveImageIdx(null)}
        >
          <div
            className="relative max-w-[430px] w-full max-h-[88vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with Counter and Close */}
            <div className="w-full flex items-center justify-between text-white pb-3 px-2">
              <span className="text-[13px] font-semibold text-white/80">
                Photo {activeImageIdx + 1} of {postImages.length}
              </span>
              <button
                type="button"
                className="grid size-8 place-items-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
                onClick={() => setActiveImageIdx(null)}
                aria-label={tr('Close photo')}
              >
                <Icon name="close" className="size-5" />
              </button>
            </div>

            {/* Main Image */}
            <div className="relative w-full max-h-[75vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black/40">
              <img
                src={postImages[activeImageIdx]}
                alt={tr('Photo {n}', { n: activeImageIdx + 1 })}
                className="max-h-[75vh] w-full object-contain"
              />

              {/* Prev / Next buttons */}
              {postImages.length > 1 && (
                <>
                  <button
                    type="button"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 grid size-9 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-transform active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : postImages.length - 1))
                    }}
                    aria-label={tr('Previous photo')}
                  >
                    <Icon name="chevron" className="size-5 rotate-180 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 grid size-9 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-transform active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveImageIdx((prev) => (prev < postImages.length - 1 ? prev + 1 : 0))
                    }}
                    aria-label={tr('Next photo')}
                  >
                    <Icon name="chevron" className="size-5 stroke-[2.5]" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

/** Dedicated Full Page for Creating a Post with Back Confirmation & Multi-image upload (up to 5) */
function CreatePostPage({ onBack, onCreated, farm, meta, crops, toast, simple }) {
  const defaultCrop = meta?.farm_crops?.[0] || 'rice'
  const defaultPlace = farm?.mun && VALENCIA_BARANGAYS.includes(farm.mun) ? farm.mun : 'Bagontaas'
  const [text, setText] = useState('')
  const [type, setType] = useState('update')
  const [crop, setCrop] = useState(defaultCrop)
  const [place, setPlace] = useState(defaultPlace)
  const [images, setImages] = useState([])
  const [posting, setPosting] = useState(false)
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const isDirty = text.trim().length > 0 || images.length > 0

  const handleBackClick = () => {
    if (isDirty) {
      setShowConfirmDiscard(true)
    } else {
      onBack()
    }
  }

  const handleImageFiles = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const remainingSlots = 5 - images.length
    if (remainingSlots <= 0) {
      toast(tr('Maximum of 5 photos reached'))
      return
    }

    const filesToProcess = files.slice(0, remainingSlots)
    if (files.length > remainingSlots) {
      toast(tr('Added {n} photo(s). Maximum is 5 photos per post.', { n: remainingSlots }))
    }

    filesToProcess.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast(`${file.name} is larger than 5MB`)
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        setImages((prev) => (prev.length < 5 ? [...prev, reader.result] : prev))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const addSampleImage = (imgPath) => {
    if (images.length >= 5) {
      toast(tr('Maximum of 5 photos reached'))
      return
    }
    setImages((prev) => [...prev, imgPath])
  }

  const handleCreate = async () => {
    const t = text.trim()
    if (!t) return toast(tr('Write something before posting'))
    setPosting(true)
    try {
      const p = await api.post('/posts', {
        text: t,
        type,
        crop: crop || defaultCrop,
        place,
        mun: place,
        prov: tr('Valencia City'),
        image: images[0] || '',
        images,
      })
      onCreated(p)
      toast(tr('Post published to community!'))
    } catch (e) {
      toast(e.message || tr('Unable to publish post'))
    } finally {
      setPosting(false)
    }
  }

  const availableCrops = meta?.farm_crops || ['rice', 'mais', 'tabako']
  const name = farm.name || 'Farmer'

  return (
    <section className="px-4 pt-3 pb-4" aria-label={tr('Create post')}>
      {/* title row: back · title · post */}
      <div className="mb-3 flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleBackClick}
          aria-label={tr('Back to community feed')}
          className="grid size-10 flex-none place-items-center rounded-full bg-surface text-ink shadow-card transition-transform active:scale-95 [&_.ic]:size-5"
        >
          <Icon name="arrowLeft" className="stroke-[2.4]" />
        </button>
        <h1 className="flex-1 text-[22px] font-extrabold">{tr('Create post')}</h1>
        <button type="button" onClick={handleCreate} disabled={posting || !text.trim()} className="btn btn-pri btn-sm px-5 disabled:opacity-45">
          {posting ? tr('Posting…') : 'Post'}
        </button>
      </div>

      {/* composer */}
      <div className="rounded-[26px] bg-surface p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="grid size-11 flex-none place-items-center rounded-full bg-[#1e7f43] text-[16px] font-bold text-white">{name[0].toUpperCase()}</div>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-bold">{name}</div>
            <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-surface2 px-2 py-0.5 text-[11.5px] font-semibold text-muted [&_.ic]:size-3">
              <Icon name="globe" />{tr('Public')} · {place}, Valencia City
            </div>
          </div>
        </div>

        <textarea
          className="mt-3 block min-h-[130px] w-full resize-none border-0 bg-transparent p-0 text-[17px] leading-[1.5] text-ink outline-none placeholder:text-muted/80"
          placeholder={simple ? tr('What’s new on your farm?') : tr('Share an update, ask a question, or give advice…')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label={tr('Post text')}
          maxLength={1000}
          autoFocus
        />

        {/* photos */}
        <div className="no-scrollbar -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1" data-noswipe>
          {images.map((img, idx) => (
            <div key={idx} className="relative size-[76px] flex-none overflow-hidden rounded-2xl bg-surface2">
              <img src={img} alt={tr('Photo {n}', { n: idx + 1 })} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                aria-label={tr('Remove photo {n}', { n: idx + 1 })}
                className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-black/65 text-white [&_.ic]:size-3.5"
              >
                <Icon name="close" className="stroke-[2.6]" />
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <label className="grid size-[76px] flex-none cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-line text-center text-[11.5px] font-bold text-muted transition-colors hover:bg-surface2 [&_.ic]:mx-auto [&_.ic]:mb-0.5 [&_.ic]:size-6 [&_.ic]:text-leaf">
              <span><Icon name="photo" />{tr('Add photo')}</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageFiles} />
            </label>
          )}
        </div>

        <div className="mt-2 flex items-center border-t border-line pt-3">
          <span className="ml-auto text-[12px] text-muted tabular-nums">{images.length}/5 photos · {text.length}/1000</span>
        </div>
        {images.length < 5 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11.5px]">
            <span className="text-muted">{tr('No photo? Try a sample:')}</span>
            <button type="button" className="rounded-full bg-leaf-soft px-2.5 py-1 font-bold text-leaf-ink" onClick={() => addSampleImage('/posts/sample-post-1.jpg')}>{tr('Golden rice')}</button>
            <button type="button" className="rounded-full bg-leaf-soft px-2.5 py-1 font-bold text-leaf-ink" onClick={() => addSampleImage('/posts/sample-post-2.avif')}>{tr('Tillering plot')}</button>
          </div>
        )}
      </div>

      {/* details */}
      <div className="mt-3 rounded-[26px] bg-surface p-4 shadow-card">
        <h2 className="text-[14px] font-extrabold">{tr('What kind of post?')}</h2>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={tr('Post category')}>
          {POST_KINDS.map(([k, label, icon]) => {
            const on = type === k
            return (
              <button key={k} type="button" role="radio" aria-checked={on} onClick={() => setType(k)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13.5px] font-bold transition-colors [&_.ic]:size-4 ${on ? TYPE_CLS[k] : 'border border-transparent bg-surface2 text-muted'}`}>
                <Icon name={icon} />{label}
              </button>
            )
          })}
        </div>

        <h2 className="mt-4 text-[14px] font-extrabold">{tr('Crop')}</h2>
        <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label={tr('Tagged crop')}>
          {availableCrops.map((k) => {
            const c = crops[k], on = crop === k
            return (
              <button key={k} type="button" role="radio" aria-checked={on} onClick={() => setCrop(k)}
                className={`flex items-center justify-center gap-1.5 rounded-2xl px-2 py-2.5 text-[14px] font-bold ${on ? '' : 'bg-surface2 text-ink-soft'}`}
                style={on ? { outline: `2px solid ${c?.color}`, outlineOffset: -1, background: `color-mix(in srgb, ${c?.color} 12%, white)` } : undefined}>
                <i className="size-2.5 rounded-full" style={{ background: c?.color }} />{c?.fil || k}
              </button>
            )
          })}
        </div>

        <h2 className="mt-4 flex items-center gap-1 text-[14px] font-extrabold [&_.ic]:size-4 [&_.ic]:text-leaf"><Icon name="pin" />{tr('Place')}</h2>
        <select className="field mt-2" value={place} onChange={(e) => setPlace(e.target.value)} aria-label={tr('Barangay in Valencia City')}>
          {VALENCIA_BARANGAYS.map((p) => <option key={p} value={p}>{p}, Valencia City</option>)}
        </select>
      </div>

      <button type="button" onClick={handleCreate} disabled={posting || !text.trim()} className="btn btn-pri mt-4 w-full py-3.5 text-[15.5px] disabled:opacity-45">
        {posting ? tr('Posting…') : tr('Post to community')}
      </button>

      {/* discard confirmation */}
      {showConfirmDiscard && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgb(13_35_26/0.45)] p-6 backdrop-blur-[3px]" role="dialog" aria-modal="true" aria-labelledby="discard-title">
          <div className="w-full max-w-[340px] rounded-[26px] bg-surface p-5 text-center shadow-card">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-danger-soft text-danger [&_.ic]:size-6"><Icon name="alert" /></div>
            <h2 id="discard-title" className="mt-3 text-[19px] font-extrabold">{tr('Discard this post?')}</h2>
            <p className="mt-1 mb-0 text-[14px] text-ink-soft">{tr('If you leave now, what you wrote won’t be saved.')}</p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn flex-1" onClick={() => setShowConfirmDiscard(false)}>{tr('Keep editing')}</button>
              <button type="button" className="btn flex-1 bg-danger! text-white" onClick={() => { setShowConfirmDiscard(false); onBack() }}>{tr('Discard')}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default function CommunityPage() {
  const { meta, crops, farm, mode, toast, postsVersion } = useApp()
  const simple = mode === 'simple'
  const [posts, setPosts] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [activeTab, setActiveTab] = useState('farmers') // 'farmers' | 'news'
  const [searchQuery, setSearchQuery] = useState('')
  const [placeFilter, setPlaceFilter] = useState('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [isCreatingPost, setIsCreatingPost] = useState(false)

  useEffect(() => {
    api
      .get('/posts')
      .then(setPosts)
      .catch(() => setLoadError(tr('Community feed unavailable right now.')))
  }, [postsVersion])

  const handleLike = async (id) => {
    try {
      const updated = await api.post(`/posts/${id}/helpful`)
      setPosts((xs) => (xs || []).map((x) => (x.id === id ? updated : x)))
    } catch (e) {
      toast(e.message || tr('Could not update like'))
    }
  }

  const handleComment = async (id, text) => {
    const updated = await api.post(`/posts/${id}/comments`, { text })
    setPosts((xs) => (xs || []).map((x) => (x.id === id ? updated : x)))
  }

  // Separate posts into Farmer Concerns and Official News / Advisories
  const farmerPosts = (posts || []).filter((p) => !isNewsPost(p))
  const newsPosts = (posts || []).filter((p) => isNewsPost(p))
  const currentBase = activeTab === 'news' ? newsPosts : farmerPosts

  // Filter posts based on Place and Search query
  const q = searchQuery.toLowerCase().trim()
  const filtered = currentBase.filter((p) => {
    const matchPlace =
      placeFilter === 'all' ||
      p.mun === placeFilter ||
      p.prov === placeFilter ||
      (p.place && p.place === placeFilter) ||
      (p.location && p.location.toLowerCase().includes(placeFilter.toLowerCase())) ||
      (p.author_label && p.author_label.toLowerCase().includes(placeFilter.toLowerCase()))
    if (!matchPlace) return false
    if (!q) return true
    const authorMatch = (p.author || '').toLowerCase().includes(q)
    const textMatch = (p.text || '').toLowerCase().includes(q)
    const munMatch = (p.mun || '').toLowerCase().includes(q)
    const provMatch = (p.prov || '').toLowerCase().includes(q)
    const cropFil = crops[p.crop]?.fil?.toLowerCase() || ''
    const cropEn = crops[p.crop]?.en?.toLowerCase() || ''
    const cropMatch = cropFil.includes(q) || cropEn.includes(q) || (p.crop || '').toLowerCase().includes(q)
    return authorMatch || textMatch || munMatch || provMatch || cropMatch
  })

  // Sliced for pagination (5 posts per page)
  const visiblePosts = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey)
    setVisibleCount(PAGE_SIZE)
  }

  const handlePlaceChange = (e) => {
    setPlaceFilter(e.target.value)
    setVisibleCount(PAGE_SIZE)
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setVisibleCount(PAGE_SIZE)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setPlaceFilter('all')
    setVisibleCount(PAGE_SIZE)
  }

  // Render the Dedicated Create Post Page when creating
  if (isCreatingPost) {
    return (
      <CreatePostPage
        onBack={() => setIsCreatingPost(false)}
        onCreated={(newPost) => {
          setPosts((xs) => [newPost, ...(xs || [])])
          setActiveTab('farmers')
          setIsCreatingPost(false)
        }}
        farm={farm}
        meta={meta}
        crops={crops}
        toast={toast}
        simple={simple}
      />
    )
  }

  return (
    <section className="relative px-4 pt-2 pb-16 min-h-[80vh]" aria-label={tr('Community')}>
      {/* Header Bar */}
      <div className="mb-3">
        <h1 className="text-[24px] font-extrabold tracking-tight text-ink">{tr('Community')}</h1>
        <p className="text-[12.5px] text-muted">{tr('Farmers & Technical Advisers in Valencia City, Bukidnon')}</p>
      </div>

      {/* Farmers | News switch: a white pill slides under the active side */}
      <div className="relative mb-3 grid grid-cols-2 rounded-full bg-[#e2e8e3] p-1" role="tablist" aria-label={tr('Feed')}>
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-surface shadow-[0_2px_8px_rgb(16_34_26/0.12)] transition-transform duration-300"
          style={{ transform: activeTab === 'news' ? 'translateX(100%)' : 'none', transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)' }}
        />
        {[
          ['farmers', tr('Farmers'), 'users', farmerPosts.length, 'text-leaf', 'bg-leaf-soft text-leaf-ink'],
          ['news', tr('News'), 'note', newsPosts.length, 'text-water', 'bg-water-soft text-water'],
        ].map(([key, label, icon, count, on, badge]) => {
          const active = activeTab === key
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleTabChange(key)}
              className={`relative z-[1] flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[14.5px] font-bold transition-colors duration-200 [&_.ic]:size-[18px] ${active ? on : 'text-muted'}`}
            >
              <Icon name={icon} className="stroke-[2.2]" />
              {label}
              {posts && (
                <span className={`min-w-5 rounded-full px-1.5 py-px text-[11px] font-extrabold tabular-nums transition-colors ${active ? badge : 'bg-black/[0.06] text-muted'}`}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* search + place filter */}
      <div className="mb-3.5 flex gap-2">
        <label className="relative flex min-w-0 flex-1 items-center rounded-full bg-surface shadow-card focus-within:ring-2 focus-within:ring-leaf/40">
          <span className="pointer-events-none absolute left-3.5 text-muted [&_.ic]:size-[18px]"><Icon name="search" /></span>
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={activeTab === 'news' ? tr('Search news') : tr('Search posts')}
            aria-label={tr('Search posts')}
            className="h-11 w-full min-w-0 rounded-full border-0 bg-transparent pr-9 pl-10 text-[14.5px] text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setVisibleCount(PAGE_SIZE)
              }}
              aria-label={tr('Clear search')}
              className="absolute right-2 grid size-7 place-items-center rounded-full bg-surface2 text-muted [&_.ic]:size-3.5"
            >
              <Icon name="close" className="stroke-[2.6]" />
            </button>
          )}
        </label>

        {/* styled pill; the real <select> sits invisibly on top so the native picker opens */}
        <div className={`relative flex h-11 max-w-[44%] flex-none items-center gap-1.5 rounded-full pr-3 pl-3.5 shadow-card [&_.ic]:size-4 ${placeFilter === 'all' ? 'bg-surface text-ink' : 'bg-leaf text-white'}`}>
          <Icon name="pin" className={placeFilter === 'all' ? 'text-leaf' : ''} />
          <span className="truncate text-[14px] font-bold">{placeFilter === 'all' ? tr('All places') : placeFilter}</span>
          <Icon name="chevronDown" className="flex-none stroke-[2.4]" />
          <select
            value={placeFilter}
            onChange={handlePlaceChange}
            aria-label={tr('Filter by place in Valencia City')}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            <option value="all">{tr('All places')}</option>
            {VALENCIA_BARANGAYS.map((place) => <option key={place} value={place}>{place}</option>)}
          </select>
        </div>
      </div>

      {(placeFilter !== 'all' || searchQuery) && posts && (
        <div className="-mt-1.5 mb-3 flex items-center justify-between px-1 text-[12.5px] font-semibold text-muted">
          <span>{filtered.length} {filtered.length === 1 ? 'result' : 'results'}</span>
          <button type="button" onClick={clearFilters} className="font-bold text-leaf">{tr('Clear filters')}</button>
        </div>
      )}

      {/* Feed List */}
      <div>
        {posts === null && !loadError && (
          <div className="card py-12 text-center">
            <div className="inline-block size-6 animate-spin rounded-full border-2 border-leaf border-t-transparent mb-2" />
            <p className="note text-[13.5px]">{activeTab === 'news' ? tr('Loading news & advisories…') : tr('Loading farmer concerns…')}</p>
          </div>
        )}

        {loadError && (
          <div className="card text-center py-6">
            <p className="text-danger font-semibold text-[14px]">{loadError}</p>
            <button
              type="button"
              className="btn btn-sm btn-sec mt-3"
              onClick={() => {
                setPosts(null)
                setLoadError('')
                api.get('/posts').then(setPosts).catch(() => setLoadError(tr('Community feed unavailable right now.')))
              }}
            >
              {tr('Retry')}
            </button>
          </div>
        )}

        {posts && (
          <>
            {filtered.length === 0 ? (
              <div className="card text-center py-10 px-4">
                <div className="grid size-12 place-items-center rounded-2xl bg-surface2 text-muted mx-auto mb-2.5">
                  <Icon name="search" className="size-6 stroke-[2]" />
                </div>
                <h3 className="text-[16px] font-bold text-ink">
                  {activeTab === 'news'
                    ? tr('No official news found matching these filters')
                    : tr('No farmer concerns found matching these filters')}
                </h3>
                <p className="note text-[13px] mt-1 max-w-[280px] mx-auto">
                  {searchQuery || placeFilter !== 'all'
                    ? tr('Try clearing your search or selecting "All Places".')
                    : activeTab === 'news'
                      ? tr('Official bulletins from agri technicians will appear here.')
                      : tr('Be the first farmer to post a question or concern!')}
                </p>
                {(searchQuery || placeFilter !== 'all') && (
                  <button type="button" className="btn btn-sec btn-sm mt-3" onClick={clearFilters}>
                    {tr('Clear filters')}
                  </button>
                )}
              </div>
            ) : (
              <>
                {visiblePosts.map((p) => (
                  <FacebookPost
                    key={p.id}
                    p={p}
                    crops={crops}
                    farm={farm}
                    onLike={handleLike}
                    onComment={handleComment}
                    toast={toast}
                  />
                ))}

                {/* more posts / end of feed */}
                {hasMore ? (
                  <div className="flex justify-center pt-1 pb-6">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      className="group inline-flex items-center gap-2.5 rounded-full bg-surface py-2 pr-2 pl-5 text-[14.5px] font-bold text-ink shadow-card transition-transform active:scale-[0.97]"
                    >
                      {tr('Show more posts')}
                      <span className="rounded-full bg-leaf-soft px-2 py-0.5 text-[12px] font-extrabold text-leaf-ink tabular-nums">+{filtered.length - visibleCount}</span>
                      <span className="grid size-8 place-items-center rounded-full bg-leaf text-white transition-transform group-hover:translate-y-0.5 [&_.ic]:size-[18px]">
                        <Icon name="chevronDown" className="stroke-[2.6]" />
                      </span>
                    </button>
                  </div>
                ) : (
                  filtered.length > PAGE_SIZE && (
                    <div className="flex items-center gap-3 px-2 pt-2 pb-6 text-[12.5px] font-semibold text-muted">
                      <span className="h-px flex-1 bg-line" />
                      <span className="inline-flex items-center gap-1.5 [&_.ic]:size-4 [&_.ic]:text-leaf"><Icon name="check" className="stroke-[2.6]" />{tr('You’re all caught up')}</span>
                      <span className="h-px flex-1 bg-line" />
                    </div>
                  )
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Floating Action Button (FAB) bottom-right */}
      <div className="fixed bottom-[96px] inset-x-0 mx-auto max-w-[430px] pointer-events-none px-4 flex justify-end z-30">
        <button
          type="button"
          className="pointer-events-auto size-14 rounded-full bg-leaf text-white shadow-[0_8px_25px_-4px_rgba(31,157,85,0.6)] flex items-center justify-center hover:bg-leaf/90 hover:scale-105 active:scale-95 transition-all"
          onClick={() => setIsCreatingPost(true)}
          aria-label={tr('Post a concern or question')}
          title={tr('Post a concern or question')}
        >
          <Icon name="plus" className="size-7 stroke-[2.5]" />
        </button>
      </div>
    </section>
  )
}
