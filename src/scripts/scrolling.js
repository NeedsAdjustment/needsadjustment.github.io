import Lenis from 'lenis'
import { navigate } from 'astro:transitions/client'

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}
window.scrollTo(0, 0)

const INTRO_PATH = '/scraps/intro/'
const TOUCH_THRESHOLD = 10

let navigating = false
// Scroll-up may leave intro only when it was entered by the home gesture.
let arrivedByScroll = false

function isHomePath(p = location.pathname) {
  return p === '/'
}
function isIntroPath(p = location.pathname) {
  return p === INTRO_PATH
}

function go(path, fromScroll = false) {
  if (navigating) return
  navigating = true
  arrivedByScroll = fromScroll && path === INTRO_PATH
  navigate(path)
}

// Intro scrolls internally; only leave it once that content is at the top.
function scrapsAtTop() {
  const view = document.querySelector('#view-scraps')
  return !view || view.scrollTop <= 1
}

function handleGesture(dir) {
  const path = location.pathname
  if (isHomePath(path)) {
    if (dir > 0) go(INTRO_PATH, true)
  } else if (isIntroPath(path)) {
    if (dir < 0 && arrivedByScroll && scrapsAtTop()) go('/')
  }
}

const lenis = new Lenis({ autoRaf: true })

window.addEventListener(
  'wheel',
  (e) => {
    if (e.deltaY === 0) return
    handleGesture(e.deltaY > 0 ? 1 : -1)
  },
  { passive: true },
)

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
  touchStartY = null
  if (!isIntroPath()) arrivedByScroll = false
  window.scrollTo(0, 0)
  wireScrollIndicator()
  lenis.resize()
})
