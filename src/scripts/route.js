/**
 * Route state — keeps the header in sync with the current URL, animates the
 * hero slide between home and scraps/snaps, wires the category buttons, and
 * fetches/re-applies dynamic nav counts so they survive navigations.
 */
import { navigate } from 'astro:transitions/client'

// ── Path helpers ─────────────────────────────────────────────────────
function isScrapsPath(p = location.pathname) {
  return p === '/scraps/' || /^\/scraps\/[^/]+\/?$/.test(p)
}
function isScrapsList(p = location.pathname) {
  return p === '/scraps/'
}
function isSnapsPath(p = location.pathname) {
  return p === '/snaps/' || p === '/snaps'
}
function scrolledTarget(p = location.pathname) {
  return p !== '/'
}

// ── Hero slide animation ─────────────────────────────────────────────
// The header persists across navigations, but the swapped page is rendered in
// its final scrolled state. Capture the old state before the swap, then animate
// the header from it to the target after the swap.
let hasNavigated = false
let prevScrolled = null
let headerAnimation = null

document.addEventListener('astro:before-swap', () => {
  const header = document.querySelector('header.hero')
  prevScrolled = header ? header.classList.contains('scrolled') : null
})

document.addEventListener('astro:after-swap', () => {
  hasNavigated = true
  const header = document.querySelector('header.hero')
  if (!header) return
  const target = scrolledTarget()
  const animates = prevScrolled !== null && prevScrolled !== target
  headerAnimation?.cancel()
  headerAnimation = null
  if (animates) {
    const hero = { top: '50%', transform: 'translateY(-50%)' }
    const scrolled = { top: '0px', transform: 'none' }
    const from = prevScrolled ? scrolled : hero
    const to = target ? scrolled : hero

    header.classList.toggle('scrolled', prevScrolled) // start in the "from" state (pre-paint)
    void header.offsetWidth // force reflow so the children's transitions start

    // Animate explicitly; Helium doesn't reliably commit the CSS transition's
    // start state after the swap.
    if (typeof header.animate === 'function') {
      headerAnimation = header.animate([from, to], { duration: 400, easing: 'ease' })
    }

    // Flip to the target so the h1/h2 transitions play too.
    header.classList.toggle('scrolled', target)
  } else {
    header.classList.toggle('scrolled', target)
  }
  prevScrolled = null
  // Re-measure and signal once the header settles in its new position. If the
  // header didn't move (e.g. scraps list ↔ detail) there's nothing to wait for,
  // so reveal the destination immediately instead of blanking it for the slide.
  setTimeout(
    () => {
      syncHeaderHeight()
      document.documentElement.dataset.headerSettled = ''
      document.dispatchEvent(new CustomEvent('header-settled'))
    },
    animates ? 480 : 0,
  )
})

// ── Header active-button + initial scrolled state ────────────────────
function applyActive() {
  const path = location.pathname
  const scrapsBtn = document.querySelector('h2 a.category[data-scraps]')
  const snapsBtn = document.querySelector('h2 a.category[data-snaps]')
  scrapsBtn?.classList.toggle('active', isScrapsPath(path))
  snapsBtn?.classList.toggle('active', isSnapsPath(path))
}

function applyInitialScrolled() {
  const header = document.querySelector('header.hero')
  if (header) header.classList.toggle('scrolled', scrolledTarget())
}

// ── Global --header-height ───────────────────────────────────────────
// Measures the header (through its h2) and exposes the distance from the top
// of the viewport to the bottom of the nav as a global CSS variable on <html>,
// so any full-screen overlay (snaps gallery, scraps view, …) can align to it.
// The measurement is taken with transitions suppressed so the value reflects
// the header's resting position, not a mid-animation frame.
function syncHeaderHeight() {
  const hero = document.querySelector('header')
  const h2 = document.querySelector('h2')
  if (!hero || !h2) return
  hero.setAttribute('data-measuring', 'true')
  const bottom = Math.ceil(h2.getBoundingClientRect().bottom)
  hero.removeAttribute('data-measuring')
  document.documentElement.style.setProperty('--header-height', `${bottom}px`)
}

let headerHeightBound = false
function bindHeaderHeight() {
  if (headerHeightBound) return
  headerHeightBound = true
  window.addEventListener('resize', syncHeaderHeight)
}

// ── Nav button wiring ────────────────────────────────────────────────
function wireButtons() {
  const scrapsBtn = document.querySelector('h2 a.category[data-scraps]')
  const snapsBtn = document.querySelector('h2 a.category[data-snaps]')

  if (scrapsBtn && !scrapsBtn.dataset.wired) {
    scrapsBtn.dataset.wired = '1'
    scrapsBtn.addEventListener('click', (e) => {
      e.preventDefault()
      if (isScrapsList()) navigate('/')
      else navigate('/scraps/')
    })
  }

  if (snapsBtn && !snapsBtn.dataset.wired) {
    snapsBtn.dataset.wired = '1'
    snapsBtn.addEventListener('click', (e) => {
      // When Immich is unreachable the href points at the Tailscale issue;
      // let the browser follow it instead of routing to the gallery.
      if (snapsBtn.classList.contains('unavailable')) return
      e.preventDefault()
      if (isSnapsPath()) navigate('/')
      else navigate('/snaps/')
    })
  }

  // Tera creatures: click to go home, no-op on home itself
  ;['leftCreature', 'rightCreature'].forEach((id) => {
    const tera = document.getElementById(id)
    if (tera && !tera.dataset.wired) {
      tera.dataset.wired = '1'
      tera.addEventListener('click', () => {
        if (!isHomePath()) navigate('/')
      })
    }
  })
}

function isHomePath(p = location.pathname) {
  return p === '/'
}

function applyTeraCursor() {
  ;['leftCreature', 'rightCreature'].forEach((id) => {
    const tera = document.getElementById(id)
    if (tera) tera.style.cursor = isHomePath() ? 'default' : 'pointer'
  })
}

// ── Dynamic counts ───────────────────────────────────────────────────
// Fetched once per session and re-applied on every page-load so counts survive
// regardless of whether the header was persisted or re-rendered.
const cachedCounts = { coding: null, design: null }

function applyCount(key, value) {
  if (value == null) return
  cachedCounts[key] = value
  const num = document.querySelector(`h2 a.category[data-count-key="${key}"] num`)
  if (num) num.textContent = String(value)
}

function applyCachedCounts() {
  for (const [key, val] of Object.entries(cachedCounts)) {
    if (val != null) applyCount(key, val)
  }
}

let fetchStarted = false
function fetchCounts() {
  if (fetchStarted) return
  fetchStarted = true

  fetch('https://api.github.com/users/NeedsAdjustment')
    .then((r) => r.json())
    .then((d) => applyCount('coding', d.public_repos))
    .catch(() => {})

  fetch('https://spren-dribbleshotsgrabber.val.run/')
    .then((r) => r.json())
    .then((d) => applyCount('design', d.shots_count))
    .catch(() => {})
}

// ── Per-page-load init ───────────────────────────────────────────────
function init() {
  wireButtons()
  applyActive()
  applyTeraCursor()
  if (!hasNavigated) {
    applyInitialScrolled() // don't clobber the swap animation
    syncHeaderHeight() // measure once on the initial page load
    // On initial load the header is already in its final position.
    document.documentElement.dataset.headerSettled = ''
    document.dispatchEvent(new CustomEvent('header-settled'))
  }
  // On navigations, syncHeaderHeight + header-settled are handled by the
  // astro:after-swap handler after the flip animation completes.
  fetchCounts()
  applyCachedCounts()
  bindHeaderHeight()
}

init()
document.addEventListener('astro:page-load', init)
