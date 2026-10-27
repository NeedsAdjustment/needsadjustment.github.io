import { navigate } from 'astro:transitions/client'

function isScrapsPath(p = location.pathname) {
  return p === '/scraps/' || /^\/scraps\/[^/]+\/?$/.test(p)
}
function isScrapsList(p = location.pathname) {
  return p === '/scraps/'
}
function isSnapsPath(p = location.pathname) {
  return p === '/snaps/' || p === '/snaps'
}
function isHomePath(p = location.pathname) {
  return p === '/'
}

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')

let prevScrolled = null
let headerAnimation = null
let headerSettleTimer = null

function setHeaderSettled() {
  syncHeaderHeight()
  document.documentElement.dataset.headerSettled = ''
  document.dispatchEvent(new CustomEvent('header-settled'))
}

function clearHeaderSettleTimer() {
  clearTimeout(headerSettleTimer)
  headerSettleTimer = null
}

// The header persists, so capture its old state before the swap and animate it
// to the incoming route's state afterwards.
document.addEventListener('astro:before-swap', () => {
  clearHeaderSettleTimer()
  const header = document.querySelector('header.hero')
  prevScrolled = header ? header.classList.contains('scrolled') : null
})

document.addEventListener('astro:after-swap', () => {
  clearHeaderSettleTimer()
  const header = document.querySelector('header.hero')
  if (!header) return

  const target = !isHomePath()
  const animates = !motionPreference.matches && prevScrolled !== null && prevScrolled !== target
  headerAnimation?.cancel()
  headerAnimation = null

  if (animates) {
    const hero = { top: '50%', transform: 'translateY(-50%)' }
    const scrolled = { top: '0px', transform: 'none' }
    const from = prevScrolled ? scrolled : hero
    const to = target ? scrolled : hero

    header.classList.toggle('scrolled', prevScrolled)
    void header.offsetWidth

    if (typeof header.animate === 'function') {
      headerAnimation = header.animate([from, to], { duration: 400, easing: 'ease' })
    }

    header.classList.toggle('scrolled', target)
  } else {
    header.classList.toggle('scrolled', target)
  }

  prevScrolled = null
  applyActive()
  applyTeraState()

  headerSettleTimer = setTimeout(
    () => {
      headerSettleTimer = null
      setHeaderSettled()
    },
    animates ? 480 : 0,
  )
})

function setActive(link, active) {
  if (!link) return
  link.classList.toggle('active', active)
  if (active) link.setAttribute('aria-current', 'page')
  else link.removeAttribute('aria-current')
}

function applyActive() {
  const path = location.pathname
  setActive(document.querySelector('h2 a.category[data-scraps]'), isScrapsPath(path))
  setActive(document.querySelector('h2 a.category[data-snaps]'), isSnapsPath(path))
}

function applyInitialScrolled() {
  document.querySelector('header.hero')?.classList.toggle('scrolled', !isHomePath())
}

function syncHeaderHeight() {
  const header = document.querySelector('header')
  const h2 = document.querySelector('h2')
  if (!header || !h2) return
  header.setAttribute('data-measuring', 'true')
  const bottom = Math.ceil(h2.getBoundingClientRect().bottom)
  header.removeAttribute('data-measuring')
  document.documentElement.style.setProperty('--header-height', `${bottom}px`)
}

function wireButtons() {
  const scrapsBtn = document.querySelector('h2 a.category[data-scraps]')
  const snapsBtn = document.querySelector('h2 a.category[data-snaps]')

  scrapsBtn?.addEventListener('click', (e) => {
    e.preventDefault()
    if (isScrapsList()) navigate('/')
    else navigate('/scraps/')
  })

  snapsBtn?.addEventListener('click', (e) => {
    if (snapsBtn.classList.contains('unavailable')) return
    e.preventDefault()
    if (isSnapsPath()) navigate('/')
    else navigate('/snaps/')
  })

  for (const id of ['leftCreatureButton', 'rightCreatureButton']) {
    document.getElementById(id)?.addEventListener('click', () => {
      if (!isHomePath()) navigate('/')
    })
  }
}

function applyTeraState() {
  const home = isHomePath()
  for (const id of ['leftCreatureButton', 'rightCreatureButton']) {
    const button = document.getElementById(id)
    if (!button) continue
    button.style.cursor = home ? 'default' : 'pointer'
    button.tabIndex = home ? -1 : 0
    if (home) button.setAttribute('aria-hidden', 'true')
    else button.removeAttribute('aria-hidden')
  }
}

function applyCount(key, value) {
  const link = document.querySelector(`h2 a.category[data-count-key="${key}"]`)
  if (!link) return
  const count = Number(value)
  if (value == null || !Number.isFinite(count) || count <= 0) {
    link.dataset.status = 'error'
    return
  }
  link.dataset.status = 'ready'
  const num = link.querySelector('num')
  if (num) num.textContent = String(count)
}

function fetchCounts() {
  fetch('https://api.github.com/users/NeedsAdjustment')
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => applyCount('coding', d?.public_repos))
    .catch(() => applyCount('coding', null))

  fetch('https://spren-dribbleshotsgrabber.val.run/')
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => applyCount('design', d?.shots_count))
    .catch(() => applyCount('design', null))
}

wireButtons()
applyActive()
applyTeraState()
applyInitialScrolled()
setHeaderSettled()
fetchCounts()
window.addEventListener('resize', syncHeaderHeight)
