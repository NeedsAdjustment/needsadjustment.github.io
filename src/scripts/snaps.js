/**
 * Immich Snaps — loads photos from an Immich album via the val.town proxy
 * and displays them in a full-screen gallery overlay using <masonry-grid-lanes>.
 * HTML structure and CSS live in the SnapsGallery.astro component.
 */
import { adoptMasonryGridLanesStyles, defineMasonryGridLanes } from '@schalkneethling/masonry-gridlanes-wc'
import { isSnapsPath, pushUrl } from './navigation.js'

const SNAPS_PROXY_URL = 'https://spren-immichgrabber.val.run/'

// ─── State ──────────────────────────────────────────────────────────
let assets = []
let currentIndex = -1
let _closeToken = 0

// ─── DOM refs (elements provided by SnapsGallery.astro) ─────────────
const overlay = document.querySelector('.snaps-overlay')
const grid = overlay?.querySelector('masonry-grid-lanes')
const lightbox = document.querySelector('.snaps-lightbox')
const lightboxImg = lightbox?.querySelector('.snaps-lightbox-img')
const lightboxSpinner = lightbox?.querySelector('.snaps-spinner')
const prevBtn = lightbox?.querySelector('.snaps-prev')
const nextBtn = lightbox?.querySelector('.snaps-next')

if (!overlay || !grid || !lightbox || !lightboxImg || !lightboxSpinner || !prevBtn || !nextBtn) {
  throw new Error('SnapsGallery: required DOM elements not found — is SnapsGallery.astro included in the page?')
}

function getSnapsButton() {
  return document.querySelector('h2 a.category[data-snaps]')
}

function setSnapsButtonActive(active) {
  getSnapsButton()?.classList.toggle('active', active)
}

function isGalleryOpen() {
  return overlay.style.display === 'flex' || getComputedStyle(overlay).display === 'flex'
}

function setBodyScrollLocked(locked) {
  document.body.style.overflow = locked ? 'hidden' : ''
}

function setSnapsCount(value) {
  const num = getSnapsButton()?.querySelector('num')
  if (num) num.textContent = String(value)
}

async function loadAlbum() {
  const data = await fetchAlbum()
  if (!data) return false

  if (typeof data.assetCount === 'number') {
    setSnapsCount(data.assetCount)
  }
  if (data.assets) {
    assets = data.assets
  }

  return assets.length > 0
}

// ─── Init web component ─────────────────────────────────────────────
defineMasonryGridLanes()

// ─── Event listeners ───────────────────────────────────────────────
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
  if (overlay.style.display === 'none') return
  if (e.key === 'Escape') {
    if (lightbox.style.display !== 'none') closeLightbox()
    else closeGallery()
  }
  if (lightbox.style.display !== 'none') {
    if (e.key === 'ArrowLeft') showLightbox(currentIndex - 1)
    if (e.key === 'ArrowRight') showLightbox(currentIndex + 1)
  }
})

// ─── Gallery open / close ───────────────────────────────────────────
// (URL-synced openGallery/closeGallery are defined below)

function showLightbox(index) {
  if (!assets.length) return
  const total = assets.length
  // Wrap around
  index = ((index % total) + total) % total
  currentIndex = index

  const asset = assets[currentIndex]
  const imgUrl = `${SNAPS_PROXY_URL}preview/${asset.id}`

  lightboxImg.alt = asset.originalFileName ?? ''
  lightboxImg.style.opacity = '0'
  lightboxImg.src = imgUrl
  lightboxSpinner.textContent = ['*', ',', '-'][Math.floor(Math.random() * 3)]
  lightboxSpinner.style.display = 'block'
  lightbox.style.display = 'flex'
  prevBtn.style.display = total > 1 ? 'block' : 'none'
  nextBtn.style.display = total > 1 ? 'block' : 'none'
}

lightboxImg.addEventListener('load', () => {
  lightboxImg.style.opacity = '1'
  lightboxSpinner.style.display = 'none'
})
lightboxImg.addEventListener('error', () => {
  lightboxImg.style.opacity = '1'
  lightboxSpinner.style.display = 'none'
})

function closeLightbox() {
  lightbox.style.display = 'none'
  lightboxImg.src = ''
  lightboxSpinner.textContent = ''
  lightboxSpinner.style.display = 'none'
}

// ─── Render masonry ────────────────────────────────────────────────
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

// ─── Fetch album data from val proxy ────────────────────────────────
async function fetchAlbum() {
  try {
    const res = await fetch(SNAPS_PROXY_URL)
    if (!res.ok) throw new Error(`Proxy error: ${res.status}`)
    return await res.json()
  } catch {
    return null
  }
}

// ─── URL helpers ────────────────────────────────────────────────────
// ─── Global helper for other modules ────────────────────────────────
window.closeSnapsGallery = function () {
  if (isGalleryOpen()) {
    closeGallery(false)
  }
}

// ─── Hero visibility helpers ─────────────────────────────────────────
function moveHeaderUp() {
  window.__headerState?.(false)
}

function restoreHeader() {
  if (window.__activeView === 'scraps') return
  window.__headerState?.(true)
}

function syncSnapsTop() {
  const hero = document.querySelector('header.hero')
  const h2 = document.querySelector('h2')
  if (!hero || !h2) return

  hero.setAttribute('data-snaps-measuring', 'true')
  const top = Math.ceil(h2.getBoundingClientRect().bottom)
  hero.removeAttribute('data-snaps-measuring')
  overlay.style.setProperty('--snaps-top', `${top}px`)
}

// ─── Gallery open / close with URL sync ─────────────────────────────
function openGallery(push = true) {
  _closeToken++ // invalidate any pending close timeout
  overlay.style.display = 'flex'
  window.__activeView = 'snaps'
  setSnapsButtonActive(true)

  moveHeaderUp()
  syncSnapsTop()
  requestAnimationFrame(() => {
    overlay.style.opacity = '1'
  })
  setBodyScrollLocked(true)
  if (push) pushUrl('/snaps/')
}

function closeGallery(push = true) {
  const token = ++_closeToken
  overlay.style.opacity = '0'
  closeLightbox()
  window.__activeView = 'home'
  window.__resetScrollAtTop?.()
  setSnapsButtonActive(false)
  if (push) {
    window.__resetScrapsView?.()
  }
  restoreHeader()
  setTimeout(() => {
    if (_closeToken !== token) return // gallery was re-opened since close
    overlay.style.display = 'none'
    setBodyScrollLocked(false)
  }, 300)
  if (push) pushUrl('/')
}

// ─── Restore from path ──────────────────────────────────────────────
function restoreFromPath() {
  if (isSnapsPath()) {
    // If assets aren't loaded yet, fetch and open
    if (!assets.length) {
      fetchAlbum().then((data) => {
        if (data && data.assets) {
          assets = data.assets
          renderGrid()
          openGallery(false)
        }
      })
    } else {
      renderGrid()
      openGallery(false)
    }
  } else {
    if (overlay.style.display !== 'none') closeGallery(false)
  }
}

// ─── Init ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Find the snaps button
  const snapsBtn = document.querySelector('h2 a.category[data-snaps]')
  if (!snapsBtn) return

  // Adopt masonry styles and wait for fonts before showing gallery
  await adoptMasonryGridLanesStyles(document)
  if (document.fonts?.ready != null) {
    await document.fonts.ready
  }

  // Fetch album data
  await loadAlbum()

  // Auto-open if on /snaps/
  if (isSnapsPath()) {
    window.__headerState?.(false)
    if (assets.length) {
      renderGrid()
      openGallery(false)
    }
  }

  // Open/close gallery on click
  snapsBtn.addEventListener('click', async (e) => {
    e.preventDefault()

    const galleryOpen = isGalleryOpen()

    if (galleryOpen) {
      closeGallery()
      return
    }

    // Exit scraps mode if active
    if (typeof window.exitScrapsMode === 'function') {
      window.exitScrapsMode()
    }

    if (!assets.length) await loadAlbum()

    if (!assets.length) return
    renderGrid()
    openGallery()
  })

  window.addEventListener('resize', () => {
    if (isGalleryOpen()) syncSnapsTop()
  })

  // Back/forward navigation
  window.addEventListener('popstate', restoreFromPath)
})
