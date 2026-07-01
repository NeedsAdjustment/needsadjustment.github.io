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
// The header persists across navigations, but the destination is rendered in
// its final scrolled state — so toggling to that state produces no motion.
// We capture the scrolled state before the swap and, after the swap (before
// paint), pin the header to that "from" state, then flip to the target on the
// next frame so the CSS transform transition actually plays. This works whether
// the header was persisted (same node) or freshly rendered.
let hasNavigated = false
let prevScrolled = null

document.addEventListener('astro:before-swap', () => {
  const header = document.querySelector('header.hero')
  prevScrolled = header ? header.classList.contains('scrolled') : null
})

document.addEventListener('astro:after-swap', () => {
  hasNavigated = true
  const header = document.querySelector('header.hero')
  if (!header) return
  const target = scrolledTarget()
  if (prevScrolled !== null && prevScrolled !== target) {
    header.classList.toggle('scrolled', prevScrolled) // start in the "from" state (pre-paint)
    void header.offsetWidth // force reflow so the next change is a transition
    requestAnimationFrame(() =>
      requestAnimationFrame(() => header.classList.toggle('scrolled', target))
    )
  } else {
    header.classList.toggle('scrolled', target)
  }
  prevScrolled = null
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
      e.preventDefault()
      if (isSnapsPath()) navigate('/')
      else navigate('/snaps/')
    })
  }
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
  if (!hasNavigated) applyInitialScrolled() // don't clobber the swap animation
  fetchCounts()
  applyCachedCounts()
}

init()
document.addEventListener('astro:page-load', init)

export { isScrapsPath, isScrapsList, isSnapsPath }
