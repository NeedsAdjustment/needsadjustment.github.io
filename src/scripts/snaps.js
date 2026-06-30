/**
 * Immich Snaps — loads photos from an Immich album via the val.town proxy
 * and displays them in a full-screen gallery overlay using <masonry-grid-lanes>.
 * HTML structure and CSS live in the SnapsGallery.astro component.
 */
import { adoptMasonryGridLanesStyles, defineMasonryGridLanes } from '@schalkneethling/masonry-gridlanes-wc'

const SNAPS_PROXY_URL = 'https://spren-immichgrabber.val.run/'

// ─── State ──────────────────────────────────────────────────────────
let assets = []
let currentIndex = -1

// ─── DOM refs (elements provided by SnapsGallery.astro) ─────────────
const overlay = document.querySelector('.snaps-overlay')
const grid = overlay?.querySelector('masonry-grid-lanes')
const closeBtn = document.querySelector('.snaps-close')
const lightbox = document.querySelector('.snaps-lightbox')
const lightboxImg = lightbox?.querySelector('.snaps-lightbox-img')
const lightboxSpinner = lightbox?.querySelector('.snaps-spinner')
const prevBtn = lightbox?.querySelector('.snaps-prev')
const nextBtn = lightbox?.querySelector('.snaps-next')

if (!overlay || !grid || !closeBtn || !lightbox || !lightboxImg || !lightboxSpinner || !prevBtn || !nextBtn) {
  throw new Error('SnapsGallery: required DOM elements not found — is SnapsGallery.astro included in the page?')
}

// ─── Init web component ─────────────────────────────────────────────
defineMasonryGridLanes()

// ─── Event listeners ───────────────────────────────────────────────
closeBtn.addEventListener('click', () => {
  if (lightbox.style.display !== 'none') closeLightbox()
  else closeGallery()
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

// ─── Initial state ─────────────────────────────────────────────────
closeBtn.style.display = 'none'

// ─── Gallery open / close ───────────────────────────────────────────
function openGallery() {
  overlay.style.display = 'flex'
  closeBtn.style.display = ''
  requestAnimationFrame(() => {
    overlay.style.opacity = '1'
  })
  document.body.style.overflow = 'hidden'
}

function closeGallery() {
  overlay.style.opacity = '0'
  closeLightbox()
  setTimeout(() => {
    overlay.style.display = 'none'
    closeBtn.style.display = 'none'
    document.body.style.overflow = ''
  }, 300)
}

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

  // Load count on page load
  fetchAlbum().then((data) => {
    if (data && typeof data.assetCount === 'number') {
      const num = snapsBtn.querySelector('num')
      if (num) num.textContent = String(data.assetCount)
      if (data.assets) assets = data.assets
    }
  })

  // Open gallery on click
  snapsBtn.addEventListener('click', async (e) => {
    e.preventDefault()

    // If we don't have assets yet, fetch them now
    if (!assets.length) {
      const data = await fetchAlbum()
      if (data && data.assets) {
        assets = data.assets
        const num = snapsBtn.querySelector('num')
        if (num) num.textContent = String(data.assetCount ?? assets.length)
      }
    }

    if (!assets.length) return
    renderGrid()
    openGallery()
  })
})
