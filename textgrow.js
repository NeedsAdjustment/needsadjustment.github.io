/**
 * Font weight animation based on mouse position and continuous ripple effect
 * With smooth transitions between mouse and ripple control
 * Mouse proximity can only increase weight, never decrease it
 */
document.addEventListener('DOMContentLoaded', () => {
  // Get the H1 element
  const h1 = document.querySelector('h1')
  if (!h1) return // Exit if h1 doesn't exist

  const originalText = h1.textContent

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

  // Get all letter spans
  const letters = document.querySelectorAll('.letter:not(.space)')

  // Set initial weight for all letters
  letters.forEach((letter) => {
    letter.style.fontWeight = '300'
    // Add data attributes to track state
    letter.dataset.mouseAffected = 'false'
    // Add transition data attributes
    letter.dataset.transitionStart = '0'
    letter.dataset.transitionStartWeight = '300'
    letter.dataset.rippleWeight = '300' // Track ripple weight separately
  })

  // Variables for ripple animation
  let rippleFrame = 50
  const rippleSpeed = -0.0015
  const rippleAmplitude = 700
  const waveFrequency = 0.45 // Controls how spread out the wave appears (lower = more spread out)
  const defaultWeight = 300
  const maxWeight = 900
  const minWeight = 300

  // Track which letters are transitioning
  const transitioningLetters = new Set()

  // Calculate ripple weight for a letter
  function getRippleWeight(index) {
    // Create a left-to-right wave effect
    // The index * waveFrequency controls spacing between letters in the wave
    const phase = rippleFrame + index * waveFrequency

    // Use a simple sine wave
    const sine = Math.sin(phase)

    // Calculate weight based on sine wave
    const weight = Math.round(defaultWeight + sine * rippleAmplitude)

    // Ensure weight stays within valid range
    return Math.max(minWeight, Math.min(maxWeight, weight))
  }

  // Auto ripple animation function - runs continuously
  function animateRipple() {
    letters.forEach((letter, i) => {
      // Calculate current ripple weight and store it
      const rippleWeight = getRippleWeight(i)
      letter.dataset.rippleWeight = rippleWeight.toString()

      // If letter is transitioning from mouse-affected to ripple
      if (transitioningLetters.has(letter)) {
        const now = performance.now()
        const progress = Math.min(1, (now - parseFloat(letter.dataset.transitionStart)) / 300) // 300ms transition

        const startWeight = parseFloat(letter.dataset.transitionStartWeight)
        const targetWeight = rippleWeight

        // Only transition if target is higher than start (prevent decreasing)
        if (targetWeight >= startWeight) {
          // Calculate intermediate weight based on transition progress
          const currentWeight = Math.round(startWeight + (targetWeight - startWeight) * progress)
          letter.style.fontWeight = currentWeight
        } else {
          // Keep the higher weight if ripple would decrease it
          letter.style.fontWeight = startWeight
        }

        // If transition is complete, remove from transitioning set
        if (progress >= 1) {
          transitioningLetters.delete(letter)
          letter.dataset.mouseAffected = 'false'
        }
      }
      // Only apply ripple to letters not currently affected by mouse or transitioning
      else if (letter.dataset.mouseAffected === 'false') {
        letter.style.fontWeight = rippleWeight
      }
    })

    rippleFrame += rippleSpeed
    requestAnimationFrame(animateRipple)
  }

  // Start the ripple animation
  animateRipple()

  // Start a smooth transition for a letter
  function startTransition(letter, currentWeight) {
    letter.dataset.transitionStart = performance.now().toString()
    letter.dataset.transitionStartWeight = currentWeight.toString()
    transitioningLetters.add(letter)
  }

  // Reset all letters to not being mouse-affected with smooth transition
  function resetMouseAffected() {
    letters.forEach((letter) => {
      if (letter.dataset.mouseAffected === 'true') {
        // Get current weight before starting transition
        const currentWeight = parseInt(letter.style.fontWeight) || defaultWeight
        startTransition(letter, currentWeight)
      }
    })
  }

  // Add mouse move listener
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

    // Keep track of which letters were previously affected
    const previouslyAffected = new Set()
    letters.forEach((letter) => {
      if (letter.dataset.mouseAffected === 'true') {
        previouslyAffected.add(letter)
      }
    })

    // For each letter, calculate distance to mouse and potentially set font weight
    letters.forEach((letter, index) => {
      const rect = letter.getBoundingClientRect()
      const letterPosX = rect.left + rect.width / 2
      const letterPosY = rect.top + rect.height / 2

      // Calculate distance
      const distance = Math.sqrt(Math.pow(mousePosX - letterPosX, 2) + Math.pow(mousePosY - letterPosY, 2))

      // Set max distance for effect (in pixels)
      const maxDistance = 200

      // Only affect letters within the max distance
      if (distance < maxDistance) {
        previouslyAffected.delete(letter) // No longer needs transition

        // Calculate mouse-based weight
        const mouseWeight = defaultWeight + Math.round((maxWeight - defaultWeight) * (1 - distance / maxDistance))

        // Get the current ripple weight
        const rippleWeight = parseInt(letter.dataset.rippleWeight) || defaultWeight

        // Only apply mouse weight if it's HIGHER than the ripple weight
        if (mouseWeight > rippleWeight) {
          // Mark this letter as affected by mouse
          letter.dataset.mouseAffected = 'true'

          // Only update if not already transitioning or newly affected
          if (transitioningLetters.has(letter)) {
            transitioningLetters.delete(letter)
          }

          // Apply the weight
          letter.style.fontWeight = mouseWeight
        } else {
          // Let ripple control this letter
          if (letter.dataset.mouseAffected === 'true') {
            letter.dataset.mouseAffected = 'false'
          }
        }
      }
    })

    // Start transitions for letters that were previously affected but are now out of range
    previouslyAffected.forEach((letter) => {
      const currentWeight = parseInt(letter.style.fontWeight) || defaultWeight
      startTransition(letter, currentWeight)
    })
  })

  // When mouse leaves the window, reset all letters
  document.addEventListener('mouseleave', resetMouseAffected)
})

document.addEventListener('DOMContentLoaded', function () {
  const categorySpans = document.querySelectorAll('h2 a.category')

  // Initial update
  updateFontStretch()

  // Update on resize
  window.addEventListener('resize', updateFontStretch)

  function updateFontStretch() {
    const viewportWidth = window.innerWidth

    // Calculate stretch from 75% at 320px to 125% at 1200px
    const minWidth = 700
    const maxWidth = 1200
    const minStretch = 75
    const maxStretch = 125

    // Clamped percentage value
    let stretchPercentage

    if (viewportWidth <= minWidth) {
      stretchPercentage = minStretch
    } else if (viewportWidth >= maxWidth) {
      stretchPercentage = maxStretch
    } else {
      // Linear interpolation
      const ratio = (viewportWidth - minWidth) / (maxWidth - minWidth)
      stretchPercentage = minStretch + ratio * (maxStretch - minStretch)
    }

    // Apply to each category span
    categorySpans.forEach((span) => {
      span.style.fontStretch = stretchPercentage + '%'
    })
  }
})
