/**
 * Immich Snaps — loads photos from an Immich album via the val.town proxy
 * and displays them in a full-screen gallery overlay using <masonry-grid-lanes>.
 *
 * The overlay lives in Gallery.astro and is `transition:persist`ed, so this
 * module runs once and simply opens/closes the gallery in response to the URL
 * (`/snaps/`) on every `astro:page-load`. Navigation itself is handled by the
 * ClientRouter (the snaps button is wired in route.js).
 */
import { adoptMasonryGridLanesStyles, defineMasonryGridLanes } from '@schalkneethling/masonry-gridlanes-wc'
import { navigate } from 'astro:transitions/client'

const SNAPS_PROXY_URL = 'https://spren-immichgrabber.val.run/'

// ─── State ──────────────────────────────────────────────────────────
let assets = []
let currentIndex = -1
let _closeToken = 0
let rendered = false

// ─── DOM refs (elements provided by Gallery.astro) ──────────────────
const overlay = document.querySelector('.snaps-overlay')
const grid = overlay?.querySelector('masonry-grid-lanes')
const lightbox = document.querySelector('.snaps-lightbox')
const lightboxImg = lightbox?.querySelector('.snaps-lightbox-img')
const lightboxSpinner = lightbox?.querySelector('.snaps-spinner')
const prevBtn = lightbox?.querySelector('.snaps-prev')
const nextBtn = lightbox?.querySelector('.snaps-next')

if (!overlay || !grid || !lightbox || !lightboxImg || !lightboxSpinner || !prevBtn || !nextBtn) {
  throw new Error('Gallery: required DOM elements not found — is Gallery.astro included in the page?')
}

function isSnapsPath(p = location.pathname) {
  return p === '/snaps/' || p === '/snaps'
}

function isGalleryOpen() {
  return overlay.style.display === 'flex' || getComputedStyle(overlay).display === 'flex'
}

function setBodyScrollLocked(locked) {
  document.body.style.overflow = locked ? 'hidden' : ''
}

let cachedSnapsCount = null
function setSnapsCount(value) {
  if (value == null) return
  cachedSnapsCount = value
  const num = document.querySelector('h2 a.category[data-snaps] num')
  if (num) num.textContent = String(value)
}
function reapplySnapsCount() {
  if (cachedSnapsCount == null) return
  const num = document.querySelector('h2 a.category[data-snaps] num')
  if (num) num.textContent = String(cachedSnapsCount)
}

// ─── Album loading ──────────────────────────────────────────────────
async function fetchAlbum() {
  try {
    const res = await fetch(SNAPS_PROXY_URL)
    if (!res.ok) throw new Error(`Proxy error: ${res.status}`)
    return await res.json()
  } catch {
    return null
  }
}

async function loadAlbum() {
  const data = await fetchAlbum()
  if (!data) return false
  if (typeof data.assetCount === 'number') setSnapsCount(data.assetCount)
  if (data.assets) assets = data.assets
  return assets.length > 0
}

// ─── One-time init ──────────────────────────────────────────────────
defineMasonryGridLanes()

const ready = (async () => {
  await adoptMasonryGridLanesStyles(document)
  if (document.fonts?.ready != null) await document.fonts.ready
  await loadAlbum()
})()

// ─── Lightbox ───────────────────────────────────────────────────────
function showLightbox(index) {
  if (!assets.length) return
  const total = assets.length
  index = ((index % total) + total) % total
  currentIndex = index

  const asset = assets[currentIndex]
  lightboxImg.alt = asset.originalFileName ?? ''
  lightboxImg.style.opacity = '0'
  lightboxImg.src = `${SNAPS_PROXY_URL}preview/${asset.id}`
  lightboxSpinner.textContent = ['*', ',', '-'][Math.floor(Math.random() * 3)]
  lightboxSpinner.style.display = 'block'
  lightbox.style.display = 'flex'
  prevBtn.style.display = total > 1 ? 'block' : 'none'
  nextBtn.style.display = total > 1 ? 'block' : 'none'
}

function closeLightbox() {
  lightbox.style.display = 'none'
  lightboxImg.src = ''
  lightboxSpinner.textContent = ''
  lightboxSpinner.style.display = 'none'
}

lightboxImg.addEventListener('load', () => {
  lightboxImg.style.opacity = '1'
  lightboxSpinner.style.display = 'none'
})
lightboxImg.addEventListener('error', () => {
  lightboxImg.style.opacity = '1'
  lightboxSpinner.style.display = 'none'
})

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox()
})
prevBtn.addEventListener('click', (e) => {
  e.stopPropagation()
  showLightbox(currentIndex - 1)
})
nextBtn.addEventListener('click', (e) => {
  e.stopPropagation()
  showLightbox(currentIndex + 1)
})

document.addEventListener('keydown', (e) => {
  if (!isGalleryOpen()) return
  if (e.key === 'Escape') {
    if (lightbox.style.display === 'flex') closeLightbox()
    else navigate('/')
    return
  }
  if (lightbox.style.display === 'flex') {
    if (e.key === 'ArrowLeft') showLightbox(currentIndex - 1)
    if (e.key === 'ArrowRight') showLightbox(currentIndex + 1)
  }
})

// ─── Masonry render ─────────────────────────────────────────────────
function renderGrid() {
  grid.innerHTML = ''
  // Fisher-Yates shuffle
  for (let i = assets.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[assets[i], assets[j]] = [assets[j], assets[i]]
  }
  for (const [i, asset] of assets.entries()) {
    const fig = document.createElement('figure')
    fig.className = 'snaps-figure'
    fig.addEventListener('click', () => showLightbox(i))
    const img = document.createElement('img')
    img.loading = 'lazy'
    img.alt = asset.originalFileName ?? ''
    img.src = `${SNAPS_PROXY_URL}thumb/${asset.id}`
    fig.appendChild(img)
    grid.appendChild(fig)
  }
}

// ─── Open / close ───────────────────────────────────────────────────
async function openGallery() {
  _closeToken++ // invalidate any pending close
  await ready
  if (!assets.length) return
  if (!rendered) {
    renderGrid()
    rendered = true
  }
  overlay.style.display = 'flex'
  requestAnimationFrame(() => {
    overlay.style.opacity = '1'
  })
  setBodyScrollLocked(true)
}

function closeGallery() {
  const token = ++_closeToken
  overlay.style.opacity = '0'
  closeLightbox()
  setBodyScrollLocked(false)
  setTimeout(() => {
    if (_closeToken !== token) return // re-opened since
    overlay.style.display = 'none'
  }, 300)
}

// ─── Route-driven lifecycle ─────────────────────────────────────────
function handleRoute() {
  reapplySnapsCount() // header may have been re-rendered; restore the count
  if (isSnapsPath()) openGallery()
  else if (isGalleryOpen()) closeGallery()
}

document.addEventListener('astro:page-load', handleRoute)
