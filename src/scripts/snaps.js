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
const closeBtn = lightbox?.querySelector('.snaps-close')
const prevBtn = lightbox?.querySelector('.snaps-prev')
const nextBtn = lightbox?.querySelector('.snaps-next')

if (!overlay || !grid || !lightbox || !lightboxImg || !lightboxSpinner || !closeBtn || !prevBtn || !nextBtn) {
  throw new Error('Gallery: required DOM elements not found — is Gallery.astro included in the page?')
}

let galleryReturnFocus = null
let lightboxReturnFocus = null

function setPageInert(value) {
  for (const el of document.querySelectorAll('header, main, footer, .snaps-overlay')) {
    el.inert = value
  }
}

function lightboxFocusable() {
  return [closeBtn, prevBtn, nextBtn].filter((el) => getComputedStyle(el).display !== 'none')
}

function trapLightboxFocus(e) {
  const items = lightboxFocusable()
  if (!items.length) {
    e.preventDefault()
    lightbox.focus()
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  if (active === lightbox || !lightbox.contains(active)) {
    e.preventDefault()
    ;(e.shiftKey ? last : first).focus()
  } else if (e.shiftKey && active === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
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
const snapsStatus = snapsBtn?.querySelector('.pill-status')

function setSnapsUnavailable(value) {
  if (!snapsBtn) return
  snapsBtn.classList.toggle('unavailable', value)
  snapsBtn.dataset.status = value ? 'error' : 'ready'
  snapsBtn.href = value ? TAILSCALE_ISSUE_URL : '/snaps/'
  if (snapsStatus) snapsStatus.textContent = value ? ' unavailable' : ''
}

function setSnapsCount(value) {
  const count = Number(value)
  if (!snapsBtn || !Number.isFinite(count) || count <= 0) return
  snapsBtn.dataset.status = 'ready'
  const num = snapsBtn.querySelector('num')
  if (num) num.textContent = String(count)
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
  if (Array.isArray(data.assets)) assets = data.assets
  const available = assets.length > 0
  const count = typeof data.assetCount === 'number' && data.assetCount > 0 ? data.assetCount : assets.length
  setSnapsCount(count)
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
  const wasOpen = lightbox.style.display === 'flex'

  if (!wasOpen) {
    lightboxReturnFocus = document.activeElement
    setPageInert(true)
  }

  const asset = assets[currentIndex]
  lightboxImg.alt = asset.originalFileName ?? ''
  lightboxImg.style.opacity = '0'
  lightboxImg.src = `${SNAPS_PROXY_URL}preview/${asset.id}`
  lightboxSpinner.textContent = ['*', ',', '-'][Math.floor(Math.random() * 3)]
  lightboxSpinner.style.display = 'block'
  lightbox.style.display = 'flex'
  prevBtn.style.display = total > 1 ? 'block' : 'none'
  nextBtn.style.display = total > 1 ? 'block' : 'none'
  if (!wasOpen) closeBtn.focus()
}

function closeLightbox(restoreFocus = true) {
  const wasOpen = lightbox.style.display === 'flex'
  lightbox.style.display = 'none'
  lightboxImg.src = ''
  lightboxSpinner.textContent = ''
  lightboxSpinner.style.display = 'none'
  if (!wasOpen) return

  setPageInert(false)
  if (restoreFocus && lightboxReturnFocus instanceof HTMLElement && lightboxReturnFocus.isConnected) {
    lightboxReturnFocus.focus()
  }
  lightboxReturnFocus = null
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
closeBtn.addEventListener('click', () => closeLightbox())
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
  const lightboxOpen = lightbox.style.display === 'flex'
  if (e.key === 'Escape') {
    if (lightboxOpen) closeLightbox()
    else navigate('/')
    return
  }
  if (lightboxOpen) {
    if (e.key === 'Tab') trapLightboxFocus(e)
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
  // grid placeholders with correct sizes
  for (const [i, asset] of assets.entries()) {
    const fig = document.createElement('button')
    fig.type = 'button'
    fig.className = 'snaps-figure'
    fig.setAttribute('aria-label', asset.originalFileName ? `View ${asset.originalFileName}` : `View photo ${i + 1}`)
    fig.style.setProperty('--glow-angle', `${Math.random() * 360}deg`)
    fig.addEventListener('click', () => showLightbox(i))
    if (asset.width && asset.height) {
      fig.style.aspectRatio = `${asset.width} / ${asset.height}`
    }
    grid.appendChild(fig)
  }
  loadImages()
}

function loadImages() {
  for (const [i, asset] of assets.entries()) {
    const fig = grid.children[i]
    const img = document.createElement('img')
    img.alt = ''
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
  galleryReturnFocus = document.activeElement === document.body ? snapsBtn : document.activeElement
  overlay.style.display = 'block'
  overlay.inert = false
  setBodyScrollLocked(true)
  overlay.focus({ preventScroll: true })

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

function closeGallery(restoreFocus = true) {
  const token = ++_closeToken
  const returnFocus = galleryReturnFocus
  galleryReturnFocus = null
  overlay.style.opacity = '0'
  closeLightbox(false)
  setBodyScrollLocked(false)
  setTimeout(() => {
    if (_closeToken !== token) return // re-opened since
    overlay.style.display = 'none'
    overlay.inert = false
    if (restoreFocus && returnFocus instanceof HTMLElement && returnFocus.isConnected) {
      returnFocus.focus()
    }
  }, 300)
}

function handleRoute() {
  if (isSnapsPath()) openGallery()
  else if (isGalleryOpen()) closeGallery()
}

document.addEventListener('astro:page-load', handleRoute)

document.addEventListener('astro:before-swap', () => {
  if (!isGalleryOpen()) return
  _closeToken++
  closeLightbox(false)
  setBodyScrollLocked(false)
  overlay.style.opacity = '0'
  overlay.style.display = 'none'
  overlay.inert = false
})
