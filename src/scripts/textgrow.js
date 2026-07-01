/**
 * Font weight animation based on mouse position and continuous ripple effect
 * With smooth transitions between mouse and ripple control
 * Mouse proximity can only increase weight, never decrease it
 */
document.addEventListener('DOMContentLoaded', () => {
  // Get the H1 element
  const h1 = document.querySelector('h1')
  if (!h1) return // Exit if h1 doesn't exist
  const header = h1.closest('header')
  if (header && !header.classList.contains('hero')) return // Only needed on homepage hero

  const originalText = h1.textContent

  // --- Wait for the variable font to be loaded before measuring ---
  // If lockWidth() runs before 'Unbounded' is available, the browser measures
  // the fallback font where all weights have the same width, resulting in
  // permanently cramped letter widths. Refreshing hides the issue because
  // the font is then cached.
  const fontReady =
    document.fonts && document.fonts.ready
      ? document.fonts.ready.then(() => {
          // Ensure the specific font family is actually loaded
          return document.fonts.load('1em Unbounded')
        })
      : Promise.resolve()

  fontReady
    .catch(() => {
      // Font failed to load — proceed anyway so the page isn't broken
    })
    .then(() => {
      // Clear the h1 and add individual spans for each letter
      let newContent = ''
      for (let i = 0; i < originalText.length; i++) {
        if (originalText[i] === ' ') {
          // Add a special space span with width
          newContent += `<span class="letter space">&nbsp;</span>`
        } else {
          newContent += `<span class="letter">${originalText[i]}</span>`
        }
      }
      h1.innerHTML = newContent
      h1.style.display = 'flex'
      h1.style.justifyContent = 'center'

      // Variables for ripple animation — traveling wave
      let wavePos = 0
      const waveSpeed = 0.0004
      const rippleAmplitude = 400
      const defaultWeight = 300
      const maxWeight = 900
      const minWeight = 300

      // Get all letter spans
      const letters = document.querySelectorAll('.letter:not(.space)')
      const lockMaxWeight = Math.min(defaultWeight + rippleAmplitude, maxWeight)

      // Measure each span's width at its heaviest weight, then fix the
      // width so letters never push neighbors around (eliminates reflow jitter).
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

      document.querySelectorAll('.letter.space').forEach(lockWidth)

      // Set initial weight for all letters
      letters.forEach((letter) => {
        lockWidth(letter)
        letter.dataset.mouseAffected = 'false'
        letter.dataset.transitionStart = '0'
        letter.dataset.transitionStartWeight = '300'
        letter.dataset.rippleWeight = '300'
      })

      // Re-lock widths on resize so letters scale live with the viewport
      let rafId = null
      window.addEventListener('resize', () => {
        if (rafId) return
        rafId = requestAnimationFrame(() => {
          rafId = null
          document.querySelectorAll('.letter').forEach((letter) => {
            const savedTransition = letter.style.transition
            letter.style.transition = 'none'
            letter.style.width = ''
            void letter.offsetWidth
            const currentWeight = letter.style.fontWeight
            letter.style.fontWeight = String(lockMaxWeight)
            void letter.offsetWidth
            const maxW = letter.offsetWidth
            letter.style.width = maxW + 'px'
            letter.style.fontWeight = currentWeight
            letter.style.transition = savedTransition
          })
        })
      })

      const transitioningLetters = new Set()

      function getRippleWeight(index, total) {
        // Position of this letter in 0-1 range
        const letterPos = index / total
        // Wrapping distance from the wave peak
        let dist = letterPos - wavePos
        if (dist < 0) dist += 1
        // Sine wave — smooth transitions, natural ease at the ends
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
            const targetWeight = rippleWeight

            const eased = 1 - Math.pow(1 - progress, 3)
            const currentWeight = Math.round(startWeight + (targetWeight - startWeight) * eased)
            letter.style.fontWeight = currentWeight

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

      animateRipple()

      function startTransition(letter, currentWeight) {
        letter.dataset.transitionStart = performance.now().toString()
        letter.dataset.transitionStartWeight = currentWeight.toString()
        transitioningLetters.add(letter)
      }

      function resetMouseAffected() {
        letters.forEach((letter) => {
          if (letter.dataset.mouseAffected === 'true') {
            // Get current weight before starting transition
            const currentWeight = parseInt(letter.style.fontWeight) || defaultWeight
            startTransition(letter, currentWeight)
          }
        })
      }

      document.addEventListener('mousemove', (e) => {
        const mousePosX = e.clientX
        const mousePosY = e.clientY

        // Check if mouse is over or near the heading
        const h1Rect = h1.getBoundingClientRect()
        const isNearHeading =
          mousePosX >= h1Rect.left - 100 && mousePosX <= h1Rect.right + 100 && mousePosY >= h1Rect.top - 100 && mousePosY <= h1Rect.bottom + 100

        if (!isNearHeading) {
          resetMouseAffected()
          return
        }

        const previouslyAffected = new Set()
        letters.forEach((letter) => {
          if (letter.dataset.mouseAffected === 'true') {
            previouslyAffected.add(letter)
          }
        })

        letters.forEach((letter, index) => {
          const rect = letter.getBoundingClientRect()
          const letterPosX = rect.left + rect.width / 2
          const letterPosY = rect.top + rect.height / 2

          const distance = Math.sqrt(Math.pow(mousePosX - letterPosX, 2) + Math.pow(mousePosY - letterPosY, 2))

          const maxDistance = 200

          if (distance < maxDistance) {
            previouslyAffected.delete(letter)
            const mouseWeight = defaultWeight + Math.round((maxWeight - defaultWeight) * (1 - distance / maxDistance))
            const rippleWeight = parseInt(letter.dataset.rippleWeight) || defaultWeight
            if (mouseWeight > rippleWeight) {
              letter.dataset.mouseAffected = 'true'
              if (transitioningLetters.has(letter)) {
                transitioningLetters.delete(letter)
              }
              letter.style.fontWeight = mouseWeight
            } else {
              if (letter.dataset.mouseAffected === 'true') {
                letter.dataset.mouseAffected = 'false'
              }
            }
          }
        })

        previouslyAffected.forEach((letter) => {
          const currentWeight = parseInt(letter.style.fontWeight) || defaultWeight
          startTransition(letter, currentWeight)
        })
      })
      document.addEventListener('mouseleave', resetMouseAffected)
    }) // end .then()
}) // end DOMContentLoaded

document.addEventListener('DOMContentLoaded', function () {
  const categorySpans = document.querySelectorAll('h2 a.category')
  updateFontStretch()
  window.addEventListener('resize', updateFontStretch)

  function updateFontStretch() {
    const viewportWidth = window.innerWidth

    const minWidth = 700
    const maxWidth = 1200
    const minStretch = 75
    const maxStretch = 125

    let stretchPercentage

    if (viewportWidth <= minWidth) {
      stretchPercentage = minStretch
    } else if (viewportWidth >= maxWidth) {
      stretchPercentage = maxStretch
    } else {
      const ratio = (viewportWidth - minWidth) / (maxWidth - minWidth)
      stretchPercentage = minStretch + ratio * (maxStretch - minStretch)
    }
    categorySpans.forEach((span) => {
      span.style.fontStretch = stretchPercentage + '%'
    })
  }
})
