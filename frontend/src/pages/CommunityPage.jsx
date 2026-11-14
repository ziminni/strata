import { useEffect, useState } from 'react'
import { api } from '../api'
import { Icon } from '../components/Icon'
import { MicButton } from '../components/Speech'
import { Pill } from '../components/ui'
import { useApp } from '../context/AppContext'
import { ago } from '../lib/format'
import { VALENCIA_PLACES } from '../mock/data'

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
          alt="Attached farm photograph"
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
            alt={`Photo ${idx + 1}`}
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
          alt="Photo 1"
          className="col-span-2 w-full h-[200px] object-cover cursor-pointer hover:brightness-95 transition-all"
          onClick={() => onImageClick(0)}
          loading="lazy"
        />
        <img
          src={images[1]}
          alt="Photo 2"
          className="w-full h-[150px] object-cover cursor-pointer hover:brightness-95 transition-all"
          onClick={() => onImageClick(1)}
          loading="lazy"
        />
        <img
          src={images[2]}
          alt="Photo 3"
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
            alt={`Photo ${idx + 1}`}
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
        alt="Photo 1"
        className="col-span-3 w-full h-[180px] object-cover cursor-pointer hover:brightness-95 transition-all"
        onClick={() => onImageClick(0)}
        loading="lazy"
      />
      <img
        src={images[1]}
        alt="Photo 2"
        className="col-span-3 w-full h-[180px] object-cover cursor-pointer hover:brightness-95 transition-all"
        onClick={() => onImageClick(1)}
        loading="lazy"
      />
      <img
        src={images[2]}
        alt="Photo 3"
        className="col-span-2 w-full h-[130px] object-cover cursor-pointer hover:brightness-95 transition-all"
        onClick={() => onImageClick(2)}
        loading="lazy"
      />
      <img
        src={images[3]}
        alt="Photo 4"
        className="col-span-2 w-full h-[130px] object-cover cursor-pointer hover:brightness-95 transition-all"
        onClick={() => onImageClick(3)}
        loading="lazy"
      />
      <img
        src={images[4]}
        alt="Photo 5"
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
      toast('Comment posted')
    } catch (err) {
      toast(err.message || 'Could not post comment')
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
          <div className="flex flex-wrap items-center gap-1.5 leading-snug">
            <b className="text-[15px] text-ink font-bold">{p.author}</b>
            {isNewsPost(p) ? (
              <span className="inline-flex items-center gap-0.5 rounded-[6px] bg-water-soft px-1.5 py-0.5 text-[10.5px] font-semibold text-water">
                <Icon name="check" className="size-3" /> Official
              </span>
            ) : p.verified ? (
              <span className="inline-flex items-center gap-0.5 rounded-[6px] bg-water-soft px-1.5 py-0.5 text-[10.5px] font-semibold text-water">
                <Icon name="check" className="size-3" /> Verified
              </span>
            ) : null}
            {p.sample && (
              <span className="inline-block rounded-[6px] bg-surface2 px-1.5 py-0.5 text-[10.5px] text-muted">
                Sample
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[12px] text-muted mt-0.5">
            <Icon name="pin" className="size-3 flex-none text-muted" />
            <span className="truncate">{p.mun ? `${p.mun}, ` : ''}{p.prov}</span>
            <span>·</span>
            <span>{ago(p.created_at)}</span>
            <span>·</span>
            <span title="Public" className="inline-flex items-center text-muted">
              <Icon name="globe" className="size-3" />
            </span>
          </div>
        </div>
        <span className={`ml-auto flex-none rounded-lg px-2 py-0.5 text-[10.5px] font-bold tracking-[0.04em] uppercase ${TYPE_CLS[p.type] || TYPE_CLS.update}`}>
          {p.type}
        </span>
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
          <span>Comment</span>
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
                        {c.created_at ? ago(c.created_at) : 'Just now'}
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
                placeholder={`Comment as ${farm.name ? farm.name.split(' ')[0] : 'Farmer'}…`}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={submittingComment}
              />
              {commentText.trim() && (
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-full bg-leaf text-white hover:bg-leaf/90 transition-transform active:scale-95"
                  aria-label="Send comment"
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
                aria-label="Close photo"
              >
                <Icon name="close" className="size-5" />
              </button>
            </div>

            {/* Main Image */}
            <div className="relative w-full max-h-[75vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black/40">
              <img
                src={postImages[activeImageIdx]}
                alt={`Photo ${activeImageIdx + 1}`}
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
                    aria-label="Previous photo"
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
                    aria-label="Next photo"
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
      toast('Maximum of 5 photos reached')
      return
    }

    const filesToProcess = files.slice(0, remainingSlots)
    if (files.length > remainingSlots) {
      toast(`Added ${remainingSlots} photo(s). Maximum is 5 photos per post.`)
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
      toast('Maximum of 5 photos reached')
      return
    }
    setImages((prev) => [...prev, imgPath])
  }

  const handleCreate = async () => {
    const t = text.trim()
    if (!t) return toast('Write something before posting')
    setPosting(true)
    try {
      const p = await api.post('/posts', {
        text: t,
        type,
        crop: crop || defaultCrop,
        place,
        mun: place,
        prov: 'Valencia City',
        image: images[0] || '',
        images,
      })
      onCreated(p)
      toast('Post published to community!')
    } catch (e) {
      toast(e.message || 'Unable to publish post')
    } finally {
      setPosting(false)
    }
  }

  // Choices only include actual crops, without "Crop (Optional)"
  const availableCrops = meta?.farm_crops || ['rice', 'mais', 'tabako']
  const cropOptions = availableCrops.map((k) => (
    <option key={k} value={k}>
      {crops[k]?.fil || k} ({crops[k]?.en || k})
    </option>
  ))

  return (
    <div className="fixed inset-0 z-50 bg-canvas max-w-[430px] mx-auto flex flex-col h-full overflow-hidden">
      {/* Top Navigation Bar with Back Button */}
      <header className="flex-none bg-surface border-b border-line px-4 py-3.5 flex items-center justify-between shadow-xs">
        <button
          type="button"
          onClick={handleBackClick}
          className="flex items-center gap-1.5 py-1 px-2 -ml-2 rounded-lg text-ink font-semibold hover:bg-surface2 transition-colors active:scale-95"
          aria-label="Back to community feed"
        >
          <Icon name="arrowLeft" className="size-5 stroke-[2.4]" />
          <span className="text-[14px]">Back</span>
        </button>

        <h1 className="text-[17px] font-extrabold text-ink">Create Post</h1>

        {/* Spacer to keep title centered */}
        <div className="w-14" aria-hidden="true" />
      </header>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-12">
        {/* Author Info */}
        <div className="flex items-center gap-3">
          <div
            className="grid size-11 flex-none place-items-center rounded-full font-bold text-white text-[15px] shadow-xs"
            style={{ background: '#1e7f43' }}
          >
            {(farm.name ? farm.name[0] : 'Y').toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[15px] text-ink">{farm.name || 'Farmer'}</div>
            <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-surface2 text-[11px] font-medium text-muted border border-line/60">
              <Icon name="globe" className="size-3" />
              <span>Public · {place || 'Bagontaas'}, Valencia City</span>
            </div>
          </div>
        </div>

        {/* Text Area with Dictation */}
        <div className="relative">
          <textarea
            className="field !min-h-[140px] !text-[15.5px] !leading-relaxed !p-3.5"
            placeholder={
              simple
                ? 'What’s new on your farm? (You can type or speak)'
                : 'Share an update, ask questions, or advise your fellow farmers…'
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <div className="absolute right-2.5 bottom-2.5">
            <MicButton
              value={text}
              onChange={setText}
              onDenied={() => toast('Microphone is off. Please type instead.')}
            />
          </div>
        </div>

        {/* Place / Barangay Field in Valencia City */}
        <div className="w-full text-left">
          <label className="field-label !m-0 !mb-1.5 font-bold text-ink-soft text-left flex items-center gap-1">
            <Icon name="pin" className="size-3.5 text-leaf" />
            <span>Barangay / Place (Valencia City)</span>
          </label>
          <div className="w-full relative">
            <select
              className="field w-full text-left font-medium"
              style={{ textAlign: 'left', textAlignLast: 'left' }}
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              aria-label="Barangay in Valencia City"
            >
              {VALENCIA_BARANGAYS.map((p) => (
                <option key={p} value={p}>
                  {p}, Valencia City
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tagged Crop Field - Debugged full-width left-aligned layout */}
        <div className="w-full text-left">
          <label className="field-label !m-0 !mb-1.5 font-bold text-ink-soft text-left">
            Tagged Crop
          </label>
          <div className="w-full relative">
            <select
              className="field w-full text-left font-medium"
              style={{ textAlign: 'left', textAlignLast: 'left' }}
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              aria-label="Tagged Crop"
            >
              {cropOptions}
            </select>
          </div>
        </div>

        {/* Post Category Field */}
        <div className="w-full text-left">
          <label className="field-label !m-0 !mb-1.5 font-bold text-ink-soft text-left">
            Post Category
          </label>
          <div className="w-full relative">
            <select
              className="field w-full text-left font-medium"
              style={{ textAlign: 'left', textAlignLast: 'left' }}
              value={type}
              onChange={(e) => setType(e.target.value)}
              aria-label="Post category"
            >
              <option value="update">Update</option>
              <option value="question">Question</option>
              <option value="advice">Advice</option>
              <option value="warning">Warning</option>
              <option value="harvest">Harvest</option>
            </select>
          </div>
        </div>

        {/* Multi-Image Upload Section (Up to 5) */}
        <div className="w-full text-left pt-1">
          <div className="flex items-center justify-between mb-2">
            <label className="field-label !m-0 font-bold text-ink-soft">
              Photos ({images.length}/5)
            </label>
            {images.length > 0 && (
              <span className="text-[11.5px] text-muted">
                {images.length === 5 ? 'Maximum reached' : `Can add ${5 - images.length} more`}
              </span>
            )}
          </div>

          {/* Attached Images Grid Preview */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-line bg-surface2 shadow-xs group"
                >
                  <img src={img} alt={`Attached ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-black/75 text-white hover:bg-black transition-transform active:scale-90"
                    title="Remove photo"
                    aria-label={`Remove photo ${idx + 1}`}
                  >
                    <Icon name="close" className="size-3.5 stroke-[2.5]" />
                  </button>
                  <span className="absolute bottom-1 left-1.5 px-1.5 py-0.2 rounded bg-black/60 text-[10px] text-white font-bold">
                    {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* File Upload Button */}
          {images.length < 5 ? (
            <div className="space-y-2">
              <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-line p-3.5 text-[13.5px] font-semibold text-ink cursor-pointer hover:bg-surface2 transition-colors">
                <Icon name="photo" className="size-5 text-leaf" />
                <span>Upload photos ({images.length}/5)</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFiles}
                />
              </label>

              {/* Sample Photo Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-muted">Or add sample photo:</span>
                <button
                  type="button"
                  className="text-[11.5px] font-semibold text-leaf hover:underline bg-leaf-soft/60 px-2.5 py-1 rounded-md transition-colors"
                  onClick={() => addSampleImage('/posts/sample-post-1.jpg')}
                >
                  + Golden Rice
                </button>
                <button
                  type="button"
                  className="text-[11.5px] font-semibold text-leaf hover:underline bg-leaf-soft/60 px-2.5 py-1 rounded-md transition-colors"
                  onClick={() => addSampleImage('/posts/sample-post-2.avif')}
                >
                  + Tillering Plot
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-leaf-soft/50 border border-leaf/20 px-3 py-2 text-[12px] font-semibold text-leaf-ink flex items-center gap-2">
              <Icon name="check" className="size-4 text-leaf" />
              <span>You have attached the maximum of 5 photos.</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sticky Action Footer with Post Button */}
      <footer className="flex-none bg-surface border-t border-line px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          onClick={handleCreate}
          disabled={posting || !text.trim()}
          className="btn btn-pri w-full py-3.5 text-[15px] font-bold shadow-sm disabled:opacity-50 transition-all active:scale-[0.99]"
        >
          {posting ? 'Posting…' : 'Post'}
        </button>
      </footer>

      {/* Discard Confirmation Modal */}
      {showConfirmDiscard && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="discard-title"
        >
          <div className="card w-full max-w-[340px] p-5 rounded-2xl shadow-xl text-center space-y-3 bg-surface border border-line">
            <div className="grid size-12 place-items-center rounded-2xl bg-danger-soft text-danger mx-auto">
              <Icon name="alert" className="size-6 stroke-[2.2]" />
            </div>
            <h2 id="discard-title" className="text-[18px] font-extrabold text-ink leading-tight">
              Discard this post?
            </h2>
            <p className="note text-[13px] text-ink-soft leading-relaxed">
              If you leave now, your changes will not be saved.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="btn btn-sec flex-1 font-bold text-[13.5px]"
                onClick={() => setShowConfirmDiscard(false)}
              >
                Continue editing
              </button>
              <button
                type="button"
                className="btn flex-1 bg-danger text-white hover:bg-danger/90 font-bold text-[13.5px]"
                onClick={() => {
                  setShowConfirmDiscard(false)
                  onBack()
                }}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
      .catch(() => setLoadError('Community feed unavailable right now.'))
  }, [postsVersion])

  const handleLike = async (id) => {
    try {
      const updated = await api.post(`/posts/${id}/helpful`)
      setPosts((xs) => (xs || []).map((x) => (x.id === id ? updated : x)))
    } catch (e) {
      toast(e.message || 'Could not update like')
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
    <section className="relative px-4 pt-2 pb-16 min-h-[80vh]" aria-label="Community">
      {/* Header Bar */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-ink">Community</h1>
          <p className="text-[12.5px] text-muted">Farmers & Technical Advisers in Valencia City, Bukidnon</p>
        </div>
        {posts && (
          <span className="rounded-full bg-leaf-soft px-2.5 py-1 text-[11.5px] font-bold text-leaf-ink">
            {filtered.length} {filtered.length === 1 ? 'post' : 'posts'}
          </span>
        )}
      </div>

      {/* Tabs: Farmer Concerns vs News */}
      <div className="flex rounded-2xl bg-surface2 p-1 mb-3 border border-line/70 shadow-xs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'farmers'}
          onClick={() => handleTabChange('farmers')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[13.5px] font-bold transition-all ${
            activeTab === 'farmers'
              ? 'bg-surface text-leaf shadow-sm'
              : 'text-muted hover:text-ink'
          }`}
        >
          <Icon name="users" className="size-4 stroke-[2.2]" />
          <span>Farmer Concerns</span>
          {posts && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'farmers' ? 'bg-leaf-soft text-leaf-ink' : 'bg-line/70 text-muted'
              }`}
            >
              {farmerPosts.length}
            </span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'news'}
          onClick={() => handleTabChange('news')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[13.5px] font-bold transition-all ${
            activeTab === 'news'
              ? 'bg-surface text-water shadow-sm'
              : 'text-muted hover:text-ink'
          }`}
        >
          <Icon name="note" className="size-4 stroke-[2.2]" />
          <span>News & Advisories</span>
          {posts && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'news' ? 'bg-water-soft text-water' : 'bg-line/70 text-muted'
              }`}
            >
              {newsPosts.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Context Banner */}
      {activeTab === 'news' ? (
        <div className="mb-3 px-3.5 py-2 rounded-xl bg-water-soft/50 border border-water/20 text-[12.5px] text-water font-medium flex items-center gap-2">
          <Icon name="check" className="size-4 flex-none" />
          <span>Official announcements, bulletins, and crop guidance from Agri Technicians, PhilRice, and DA.</span>
        </div>
      ) : (
        <div className="mb-3 px-3.5 py-2 rounded-xl bg-leaf-soft/40 border border-leaf/20 text-[12.5px] text-leaf-ink font-medium flex items-center gap-2">
          <Icon name="users" className="size-4 flex-none text-leaf" />
          <span>Questions, pest reports, and field updates shared by fellow local farmers.</span>
        </div>
      )}

      {/* Search Bar + Places Filter Dropdown */}
      <div className="card mb-3.5 p-3 space-y-2.5 shadow-card border border-line">
        {/* Search input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            <Icon name="search" className="size-4" />
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={
              activeTab === 'news'
                ? 'Search news, technician advisories, or topics…'
                : 'Search farmer questions, field updates, or crops…'
            }
            className="field !pl-9 !pr-8 !py-2 !text-[13.5px] !rounded-xl"
            aria-label="Search posts"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setVisibleCount(PAGE_SIZE)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              aria-label="Clear search"
            >
              <Icon name="close" className="size-4" />
            </button>
          )}
        </div>

        {/* Places Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-[12.5px] font-bold text-muted flex-none flex items-center gap-1">
            <Icon name="pin" className="size-3.5 text-leaf" />
            <span>Place:</span>
          </label>
          <select
            className="field !py-1.5 !text-[13px] !rounded-xl flex-1 font-medium text-left"
            style={{ textAlign: 'left', textAlignLast: 'left' }}
            value={placeFilter}
            onChange={handlePlaceChange}
            aria-label="Filter by place in Valencia City"
          >
            <option value="all">All Places (Valencia City, Bukidnon)</option>
            {VALENCIA_BARANGAYS.map((place) => (
              <option key={place} value={place}>
                {place}
              </option>
            ))}
          </select>
          {(placeFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={clearFilters}
              className="btn btn-sm flex-none text-[12px] text-muted hover:text-ink"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Feed List */}
      <div>
        {posts === null && !loadError && (
          <div className="card py-12 text-center">
            <div className="inline-block size-6 animate-spin rounded-full border-2 border-leaf border-t-transparent mb-2" />
            <p className="note text-[13.5px]">Loading {activeTab === 'news' ? 'news & advisories' : 'farmer concerns'}…</p>
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
                api.get('/posts').then(setPosts).catch(() => setLoadError('Community feed unavailable right now.'))
              }}
            >
              Retry
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
                    ? 'No official news found matching these filters'
                    : 'No farmer concerns found matching these filters'}
                </h3>
                <p className="note text-[13px] mt-1 max-w-[280px] mx-auto">
                  {searchQuery || placeFilter !== 'all'
                    ? 'Try clearing your search or selecting "All Places".'
                    : activeTab === 'news'
                      ? 'Official bulletins from agri technicians will appear here.'
                      : 'Be the first farmer to post a question or concern!'}
                </p>
                {(searchQuery || placeFilter !== 'all') && (
                  <button type="button" className="btn btn-sec btn-sm mt-3" onClick={clearFilters}>
                    Clear filters
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

                {/* More Posts Button / Pagination */}
                {hasMore ? (
                  <div className="pt-1 pb-4">
                    <button
                      type="button"
                      className="btn btn-sec w-full py-3 font-bold text-[14px] flex items-center justify-center gap-2 shadow-xs hover:bg-surface2 transition-all active:scale-[0.99]"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    >
                      <span>More posts</span>
                      <span className="text-[12px] opacity-70">
                        ({filtered.length - visibleCount} remaining)
                      </span>
                      <Icon name="chevron" className="size-4 rotate-90 stroke-[2.5]" />
                    </button>
                  </div>
                ) : (
                  filtered.length > PAGE_SIZE && (
                    <div className="flex items-center justify-center gap-1.5 py-4 text-[12px] text-muted">
                      <Icon name="check" className="size-3.5 text-leaf stroke-[2.5]" />
                      <span>You have caught up with all {filtered.length} posts</span>
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
          aria-label="Post a concern or question"
          title="Post a concern or question"
        >
          <Icon name="plus" className="size-7 stroke-[2.5]" />
        </button>
      </div>
    </section>
  )
}
