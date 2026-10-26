import { adoptMasonryGridLanesStyles, defineMasonryGridLanes } from '@schalkneethling/masonry-gridlanes-wc'
import { navigate } from 'astro:transitions/client'

const SNAPS_PROXY_URL = 'https://spren-immichgrabber.val.run/'
const TAILSCALE_ISSUE_URL = 'https://github.com/tailscale/tailscale/issues/11849'

let assets = []
let currentIndex = -1
let _closeToken = 0
let rendered = false

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
  return overlay.style.display === 'block'
}

function setBodyScrollLocked(locked) {
  document.body.style.overflow = locked ? 'hidden' : ''
}

const snapsBtn = document.querySelector('h2 a.category[data-snaps]')

function setSnapsUnavailable(value) {
  if (!snapsBtn) return
  snapsBtn.classList.toggle('unavailable', value)
  snapsBtn.href = value ? TAILSCALE_ISSUE_URL : '/snaps/'
}

function setSnapsCount(value) {
  if (value == null) return
  const num = snapsBtn?.querySelector('num')
  if (num) num.textContent = String(value)
}

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
  if (!data) {
    setSnapsUnavailable(true)
    return false
  }
  if (typeof data.assetCount === 'number') setSnapsCount(data.assetCount)
  if (Array.isArray(data.assets)) assets = data.assets
  const available = assets.length > 0
  setSnapsUnavailable(!available)
  return available
}

defineMasonryGridLanes()

const ready = (async () => {
  try {
    await adoptMasonryGridLanesStyles(document)
    if (document.fonts?.ready != null) await document.fonts.ready
    await loadAlbum()
  } catch {
    setSnapsUnavailable(true)
  }
})()

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

function renderGrid() {
  grid.innerHTML = ''
  for (let i = assets.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[assets[i], assets[j]] = [assets[j], assets[i]]
  }
  // Placeholder figures establish the masonry layout before images load.
  for (const [i, asset] of assets.entries()) {
    const fig = document.createElement('figure')
    fig.className = 'snaps-figure'
    fig.style.setProperty('--glow-angle', `${Math.random() * 360}deg`)
    fig.addEventListener('click', () => showLightbox(i))
    if (asset.width && asset.height) {
      fig.style.aspectRatio = `${asset.width} / ${asset.height}`
    }
    grid.appendChild(fig)
  }
  // Images load separately so the grid can reflow as each one arrives.
  loadImages()
}

function loadImages() {
  for (const [i, asset] of assets.entries()) {
    const fig = grid.children[i]
    const img = document.createElement('img')
    img.alt = asset.originalFileName ?? ''
    img.addEventListener(
      'load',
      () => {
        fig.classList.add('loaded')
      },
      { once: true },
    )
    img.addEventListener(
      'error',
      () => {
        fig.classList.add('loaded')
      },
      { once: true },
    )
    fig.appendChild(img)
    img.src = `${SNAPS_PROXY_URL}thumb/${asset.id}`
  }
}

async function openGallery() {
  const token = ++_closeToken
  await ready
  if (token !== _closeToken || !isSnapsPath() || !assets.length) return

  if (!rendered) {
    renderGrid()
    rendered = true
  }
  overlay.style.display = 'block'
  setBodyScrollLocked(true)

  const reveal = () => {
    if (token !== _closeToken) return
    overlay.style.opacity = '1'
  }

  if (document.documentElement.dataset.headerSettled !== undefined) {
    reveal()
  } else {
    document.addEventListener('header-settled', function onSettled() {
      document.removeEventListener('header-settled', onSettled)
      reveal()
    })
  }
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

function handleRoute() {
  if (isSnapsPath()) openGallery()
  else if (isGalleryOpen()) closeGallery()
}

document.addEventListener('astro:page-load', handleRoute)

// Close before the swap so the fade cannot overlap the header animation.
document.addEventListener('astro:before-swap', () => {
  if (!isGalleryOpen()) return
  _closeToken++
  closeLightbox()
  setBodyScrollLocked(false)
  overlay.style.opacity = '0'
  overlay.style.display = 'none'
})
