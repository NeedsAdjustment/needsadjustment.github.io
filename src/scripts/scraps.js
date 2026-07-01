/**
 * Scraps — client-side view switching for the scraps/blog system.
 * Uses window.__activeView ('home' | 'scraps' | 'snaps') for
 * cross-module coordination with scrolling.js and snaps.js.
 */
import { getScrapSlug, isScrapsPath, pushUrl } from './navigation.js'
import { showScrapDetail, showScrapList } from './scraps-rendering.js'

// ─── DOM refs ───────────────────────────────────────────────────────
const scrapsBtn = document.querySelector('h2 a.category[data-scraps]')
const viewScraps = document.querySelector('#view-scraps')

// Gracefully degrade if elements are missing (e.g., on /snaps/ page)
const hasScrapsView = !!viewScraps

// ─── State ──────────────────────────────────────────────────────────
// window.__activeView tracks the current view: 'home' | 'scraps' | 'snaps'

// ─── Helpers ────────────────────────────────────────────────────────
// Uses window.__headerState from scrolling.js for consistent styling

// ─── Mode switching ─────────────────────────────────────────────────
function setScrapsMode(active) {
  if (!viewScraps || !scrapsBtn) return
  window.__activeView = active ? 'scraps' : 'home'
  scrapsBtn.classList.toggle('active', active)
  viewScraps.style.display = active ? 'block' : 'none'
  window.__headerState?.(!active)
}

function openScrapsList(push = true) {
  if (!viewScraps) return
  setScrapsMode(true)
  showScrapList(viewScraps, pushUrl, push)
}

function openScrapsDetail(slug, push = true) {
  if (!viewScraps) return
  setScrapsMode(true)
  requestAnimationFrame(() => showScrapDetail(viewScraps, pushUrl, slug, push))
}

function enterScrapsMode(push = true) {
  if (window.__activeView === 'scraps') return
  if (!viewScraps) return

  // Close snaps gallery if open
  closeSnapsGallery()

  openScrapsList(false)

  if (push) pushUrl('/scraps/')
}

// Global helpers for other modules
window.exitScrapsMode = function () {
  if (window.__activeView === 'scraps') {
    enterHomeMode(false)
  }
}

window.__resetScrapsView = function () {
  if (!viewScraps) return
  setScrapsMode(false)
  showScrapList(viewScraps, pushUrl, false)
}

/** Navigate to a scrap by slug (called by scrolling.js on homepage scroll) */
window.__showScrapBySlug = function (slug) {
  if (!viewScraps) return
  enterScrapsMode(false)
  if (slug) {
    openScrapsDetail(slug, false)
  } else {
    showScrapList(viewScraps, pushUrl, false)
  }
}

function enterHomeMode(push = true) {
  if (window.__activeView === 'home') return
  if (!viewScraps) return
  setScrapsMode(false)
  showScrapList(viewScraps, pushUrl, false)

  if (push) pushUrl('/')
}

// ─── Restore state from path ────────────────────────────────────────
function restoreFromPath() {
  if (!viewScraps) return
  const slug = getScrapSlug()
  if (location.pathname === '/scraps/') {
    openScrapsList(false)
  } else if (slug) {
    openScrapsDetail(slug, false)
  } else {
    // Go home
    if (window.__activeView === 'scraps') enterHomeMode(false)
  }
}

// ─── Wire up scraps UI ──────────────────────────────────────────────
if (scrapsBtn) {
  if (hasScrapsView) {
    // Full scraps functionality — in-page view switching
    scrapsBtn.addEventListener('click', (e) => {
      e.preventDefault()
      if (window.__activeView === 'scraps') {
        if (getScrapSlug()) {
          openScrapsList()
        } else {
          enterHomeMode()
        }
      } else {
        enterScrapsMode()
      }
    })

    viewScraps.addEventListener('click', (e) => {
      const item = e.target.closest('.scrap-item')
      if (!item) return
      const slug = item.dataset.slug
      if (!slug) return
      const body = item.querySelector('.scrap-body')
      if (body && body.style.display === 'block') {
        openScrapsList()
      } else {
        openScrapsDetail(slug)
      }
    })

    window.addEventListener('popstate', restoreFromPath)

    document.addEventListener('DOMContentLoaded', () => {
      if (isScrapsPath()) {
        restoreFromPath()
      }
    })
  } else {
    // No #view-scraps on this page (e.g. /snaps/) — navigate to scraps listing
    scrapsBtn.addEventListener('click', (e) => {
      e.preventDefault()
      location.href = '/scraps/'
    })
  }
}

// Home on other nav clicks — works as long as the button exists
document.querySelectorAll('h2 a.category:not([data-scraps])').forEach((link) => {
  link.addEventListener('click', () => {
    if (window.__activeView === 'scraps') enterHomeMode()
  })
})
