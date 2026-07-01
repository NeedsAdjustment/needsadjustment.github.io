import Lenis from 'lenis'
import { navigate } from 'astro:transitions/client'

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}
window.scrollTo(0, 0)

// The only scrap reachable by a downward gesture on the home page.
const INTRO_PATH = '/scraps/intro/'

// After a navigation we ignore gestures for a moment so the residual
// scroll/trackpad momentum that triggered it can't fire a second navigation.
const NAV_COOLDOWN = 900
const GESTURE_THRESHOLD = 0 // any wheel movement counts (touch uses a larger one)
const TOUCH_THRESHOLD = 10 // px of swipe before a touch gesture counts

let navigating = false
let lastNavAt = 0

// True only while we're on /scraps/intro/ having arrived there by scrolling
// down from home. Scroll-up "back to home" is allowed ONLY in this state —
// never on other scraps pages, and never when intro was opened via a link.
let arrivedByScroll = false

function isHomePath(p = location.pathname) {
  return p === '/'
}
function isIntroPath(p = location.pathname) {
  return p === INTRO_PATH
}

function canNavigate() {
  return !navigating && performance.now() - lastNavAt > NAV_COOLDOWN
}

function go(path, fromScroll = false) {
  if (navigating) return
  navigating = true
  lastNavAt = performance.now()
  arrivedByScroll = fromScroll && path === INTRO_PATH
  navigate(path)
}

// The intro content scrolls internally (data-lenis-prevent). Only treat an
// upward gesture as "go home" when that inner content is already at the top.
function scrapsAtTop() {
  const view = document.querySelector('#view-scraps')
  return !view || view.scrollTop <= 1
}

/**
 * Decide whether a vertical gesture should navigate.
 * @param {number} dir  +1 = downward intent, -1 = upward intent
 */
function handleGesture(dir) {
  if (!canNavigate()) return
  const path = location.pathname
  if (isHomePath(path)) {
    if (dir > 0) go(INTRO_PATH, true)
  } else if (isIntroPath(path)) {
    if (dir < 0 && arrivedByScroll && scrapsAtTop()) go('/')
  }
  // Any other page (other scraps, snaps, lists): scrolling never navigates.
}

const lenis = new Lenis({ autoRaf: true })

// ── Wheel / trackpad ────────────────────────────────────────────────
window.addEventListener(
  'wheel',
  (e) => {
    if (Math.abs(e.deltaY) < GESTURE_THRESHOLD) return
    handleGesture(e.deltaY > 0 ? 1 : -1)
  },
  { passive: true },
)

// ── Touch (swipe) ───────────────────────────────────────────────────
let touchStartY = null
window.addEventListener(
  'touchstart',
  (e) => {
    touchStartY = e.touches.length === 1 ? e.touches[0].clientY : null
  },
  { passive: true },
)
window.addEventListener(
  'touchmove',
  (e) => {
    if (touchStartY == null) return
    const delta = touchStartY - e.touches[0].clientY // + = swiped up (scroll down)
    if (Math.abs(delta) < TOUCH_THRESHOLD) return
    handleGesture(delta > 0 ? 1 : -1)
    touchStartY = null
  },
  { passive: true },
)

// ── Scroll indicator (home only) — same intent as scrolling down ─────
function wireScrollIndicator() {
  const indicator = document.querySelector('.scroll-indicator')
  if (!indicator || indicator.dataset.wired) return
  indicator.dataset.wired = '1'
  indicator.style.cursor = 'pointer'
  indicator.addEventListener('click', () => go(INTRO_PATH, true))
}

wireScrollIndicator()

document.addEventListener('astro:page-load', () => {
  navigating = false
  lastNavAt = performance.now()
  touchStartY = null
  // Leaving intro (or landing anywhere that isn't intro-via-scroll) revokes the
  // scroll-up privilege, so it can't be triggered on unrelated pages.
  if (!isIntroPath()) arrivedByScroll = false
  window.scrollTo(0, 0)
  wireScrollIndicator()
  lenis.resize()
})
