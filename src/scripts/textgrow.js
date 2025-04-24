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
    letter.dataset.mouseAffected = 'false'
    letter.dataset.transitionStart = '0'
    letter.dataset.transitionStartWeight = '300'
    letter.dataset.rippleWeight = '300'
  })

  // Variables for ripple animation
  let rippleFrame = 50
  const rippleSpeed = -0.0015
  const rippleAmplitude = 700
  const waveFrequency = 0.45
  const defaultWeight = 300
  const maxWeight = 900
  const minWeight = 300

  const transitioningLetters = new Set()

  function getRippleWeight(index) {
    const phase = rippleFrame + index * waveFrequency
    const sine = Math.sin(phase)
    const weight = Math.round(defaultWeight + sine * rippleAmplitude)
    return Math.max(minWeight, Math.min(maxWeight, weight))
  }

  function animateRipple() {
    letters.forEach((letter, i) => {
      const rippleWeight = getRippleWeight(i)
      letter.dataset.rippleWeight = rippleWeight.toString()

      if (transitioningLetters.has(letter)) {
        const now = performance.now()
        const progress = Math.min(1, (now - parseFloat(letter.dataset.transitionStart)) / 300) // 300ms transition

        const startWeight = parseFloat(letter.dataset.transitionStartWeight)
        const targetWeight = rippleWeight

        if (targetWeight >= startWeight) {
          const currentWeight = Math.round(startWeight + (targetWeight - startWeight) * progress)
          letter.style.fontWeight = currentWeight
        } else {
          letter.style.fontWeight = startWeight
        }

        if (progress >= 1) {
          transitioningLetters.delete(letter)
          letter.dataset.mouseAffected = 'false'
        }
      } else if (letter.dataset.mouseAffected === 'false') {
        letter.style.fontWeight = rippleWeight
      }
    })

    rippleFrame += rippleSpeed
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
})

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
