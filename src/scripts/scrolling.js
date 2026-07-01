import Lenis from 'lenis'

window.scrollTo(0, 0)
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}

document.addEventListener('DOMContentLoaded', function () {
  const scrollIndicator = document.querySelector('.scroll-indicator')

  const lenis = new Lenis({
    autoRaf: true,
  })

  // Click scroll indicator to scroll down one viewport
  if (scrollIndicator) {
    scrollIndicator.style.cursor = 'pointer'
    scrollIndicator.addEventListener('click', () => {
      lenis.scrollTo(lenis.scroll + window.innerHeight, { duration: 1 })
    })
  }

  // Binary scroll state — tracks whether view is at the hero position
  let isAtTop = true

  // Exposed for scraps.js and snaps.js: toggles .scrolled on header.hero
  // CSS handles all the visual transitions
  window.__headerState = function (top) {
    const hero = document.querySelector('header.hero')
    if (!hero) return
    hero.classList.toggle('scrolled', !top)
  }

  // Exposed for snaps.js: resets scroll state when gallery closes programmatically
  window.__resetScrollAtTop = function () {
    isAtTop = true
  }

  function setTopState(top, path) {
    isAtTop = top
    window.__headerState(top)
    history.replaceState(null, '', path)
  }

  // Scroll-triggered navigation helpers
  function navigateToIntro() {
    if (!isAtTop) return
    setTopState(false, '/scraps/intro/')
    window.__showScrapBySlug?.('intro')
  }

  function navigateHome() {
    if (isAtTop) return
    setTopState(true, '/')
    window.exitScrapsMode?.()
    window.closeSnapsGallery?.()
  }

  lenis.on('scroll', ({ velocity }) => {
    const hero = document.querySelector('header.hero')
    if (!hero) return
    // Only do scroll-triggered navigation on the home view
    const view = window.__activeView
    if (view === 'snaps') return
    if (view === 'scraps') {
      // Allow scroll-up to return home, but only if we arrived via scroll-down
      // (isAtTop is false only when navigateToIntro() was called)
      if (velocity < 0 && !isAtTop) navigateHome()
      return
    }
    if (velocity > 0 && isAtTop) navigateToIntro()
    else if (velocity < 0 && !isAtTop) navigateHome()
  })
})
