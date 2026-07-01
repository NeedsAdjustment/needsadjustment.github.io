/**
 * Font-weight ripple + mouse-proximity animation for the hero <h1>.
 *
 * Designed to be persist-friendly: if the header was preserved across a
 * ClientRouter navigation the split letters are already present and we do
 * nothing (the animation keeps running uninterrupted). If the header was
 * re-rendered we rebuild the letters and keep the single animation loop /
 * global listeners pointing at the fresh nodes. Either way there is no
 * re-triggered intro animation.
 */

// Module-level mutable state so the (single) animation loop and global
// listeners always operate on the current letters/h1.
let h1 = null
let letters = []
let loopStarted = false
let listenersBound = false

const waveSpeed = 0.0004
const rippleAmplitude = 400
const defaultWeight = 300
const maxWeight = 900
const minWeight = 300
const lockMaxWeight = Math.min(defaultWeight + rippleAmplitude, maxWeight)

let wavePos = 0
const transitioningLetters = new Set()

function lockWidth(span) {
  const savedTransition = span.style.transition
  span.style.transition = 'none'
  span.style.display = 'inline-block'
  span.style.textAlign = 'center'
  span.style.overflow = 'visible'
  span.style.fontWeight = String(lockMaxWeight)
  void span.offsetWidth
  const maxW = span.offsetWidth - 3
  span.style.width = maxW + 'px'
  span.style.fontWeight = String(defaultWeight)
  span.style.transition = savedTransition
}

function buildLetters() {
  const originalText = h1.dataset.text || h1.textContent
  h1.dataset.text = originalText // remember for future rebuilds

  let html = ''
  for (const ch of originalText) {
    html += ch === ' ' ? '<span class="letter space">&nbsp;</span>' : `<span class="letter">${ch}</span>`
  }
  h1.innerHTML = html
  h1.style.display = 'flex'
  h1.style.justifyContent = 'center'

  document.querySelectorAll('.letter.space').forEach(lockWidth)
  letters = Array.from(document.querySelectorAll('.letter:not(.space)'))
  letters.forEach((letter) => {
    lockWidth(letter)
    letter.dataset.mouseAffected = 'false'
    letter.dataset.transitionStart = '0'
    letter.dataset.transitionStartWeight = '300'
    letter.dataset.rippleWeight = '300'
  })
  transitioningLetters.clear()
}

function getRippleWeight(index, total) {
  const letterPos = index / total
  let dist = letterPos - wavePos
  if (dist < 0) dist += 1
  const phase = dist * 2 * Math.PI
  const weight = Math.round(defaultWeight + Math.sin(phase) * rippleAmplitude)
  return Math.max(minWeight, Math.min(maxWeight, weight))
}

function animateRipple() {
  letters.forEach((letter, i) => {
    const rippleWeight = getRippleWeight(i, letters.length)
    letter.dataset.rippleWeight = rippleWeight.toString()

    if (transitioningLetters.has(letter)) {
      const now = performance.now()
      const progress = Math.min(1, (now - parseFloat(letter.dataset.transitionStart)) / 300)
      const startWeight = parseFloat(letter.dataset.transitionStartWeight)
      const eased = 1 - Math.pow(1 - progress, 3)
      letter.style.fontWeight = Math.round(startWeight + (rippleWeight - startWeight) * eased)
      if (progress >= 1) {
        transitioningLetters.delete(letter)
        letter.dataset.mouseAffected = 'false'
      }
    } else if (letter.dataset.mouseAffected === 'false') {
      letter.style.fontWeight = rippleWeight
    }
  })

  wavePos += waveSpeed
  if (wavePos >= 1) wavePos -= 1
  requestAnimationFrame(animateRipple)
}

function startTransition(letter, currentWeight) {
  letter.dataset.transitionStart = performance.now().toString()
  letter.dataset.transitionStartWeight = currentWeight.toString()
  transitioningLetters.add(letter)
}

function resetMouseAffected() {
  letters.forEach((letter) => {
    if (letter.dataset.mouseAffected === 'true') {
      const currentWeight = parseInt(letter.style.fontWeight) || defaultWeight
      startTransition(letter, currentWeight)
    }
  })
}

function bindGlobalListeners() {
  if (listenersBound) return
  listenersBound = true

  window.addEventListener('resize', () => {
    letters.forEach((letter) => {
      const savedTransition = letter.style.transition
      letter.style.transition = 'none'
      letter.style.width = ''
      void letter.offsetWidth
      const currentWeight = letter.style.fontWeight
      letter.style.fontWeight = String(lockMaxWeight)
      void letter.offsetWidth
      letter.style.width = letter.offsetWidth + 'px'
      letter.style.fontWeight = currentWeight
      letter.style.transition = savedTransition
    })
  })

  document.addEventListener('mousemove', (e) => {
    if (!h1 || !letters.length) return
    const mousePosX = e.clientX
    const mousePosY = e.clientY
    const r = h1.getBoundingClientRect()
    const isNear =
      mousePosX >= r.left - 100 && mousePosX <= r.right + 100 && mousePosY >= r.top - 100 && mousePosY <= r.bottom + 100
    if (!isNear) {
      resetMouseAffected()
      return
    }

    const previouslyAffected = new Set()
    letters.forEach((letter) => {
      if (letter.dataset.mouseAffected === 'true') previouslyAffected.add(letter)
    })

    letters.forEach((letter) => {
      const rect = letter.getBoundingClientRect()
      const lx = rect.left + rect.width / 2
      const ly = rect.top + rect.height / 2
      const distance = Math.sqrt((mousePosX - lx) ** 2 + (mousePosY - ly) ** 2)
      const maxDistance = 200
      if (distance < maxDistance) {
        previouslyAffected.delete(letter)
        const mouseWeight = defaultWeight + Math.round((maxWeight - defaultWeight) * (1 - distance / maxDistance))
        const rippleWeight = parseInt(letter.dataset.rippleWeight) || defaultWeight
        if (mouseWeight > rippleWeight) {
          letter.dataset.mouseAffected = 'true'
          transitioningLetters.delete(letter)
          letter.style.fontWeight = mouseWeight
        } else if (letter.dataset.mouseAffected === 'true') {
          letter.dataset.mouseAffected = 'false'
        }
      }
    })

    previouslyAffected.forEach((letter) => {
      const currentWeight = parseInt(letter.style.fontWeight) || defaultWeight
      startTransition(letter, currentWeight)
    })
  })

  document.addEventListener('mouseleave', resetMouseAffected)
}

// ── Category font-stretch (responsive) ───────────────────────────────
function updateFontStretch() {
  const spans = document.querySelectorAll('h2 a.category')
  const vw = window.innerWidth
  const [minW, maxW, minS, maxS] = [700, 1200, 75, 125]
  let stretch
  if (vw <= minW) stretch = minS
  else if (vw >= maxW) stretch = maxS
  else stretch = minS + ((vw - minW) / (maxW - minW)) * (maxS - minS)
  spans.forEach((span) => (span.style.fontStretch = stretch + '%'))
}

let stretchBound = false
function bindStretch() {
  updateFontStretch()
  if (stretchBound) return
  stretchBound = true
  window.addEventListener('resize', updateFontStretch)
}

// ── Init (idempotent) ────────────────────────────────────────────────
function ensure() {
  const current = document.querySelector('header.hero h1')
  bindStretch()
  if (!current) return

  // If this h1 already has split letters (persisted header), just keep going.
  if (current === h1 && current.querySelector('.letter')) return

  h1 = current
  const run = () => {
    buildLetters()
    bindGlobalListeners()
    if (!loopStarted) {
      loopStarted = true
      animateRipple()
    }
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => document.fonts.load('1em Unbounded')).catch(() => {}).then(run)
  } else {
    run()
  }
}

if (document.readyState !== 'loading') ensure()
else document.addEventListener('DOMContentLoaded', ensure)
document.addEventListener('astro:page-load', ensure)
