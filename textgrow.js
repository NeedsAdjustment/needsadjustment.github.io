/**
 * Font weight animation based on mouse position and auto-ripple effect
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
    letter.style.fontWeight = '450'
  })

  // Track if mouse is over the heading area
  let isMouseOver = false
  let mouseTimer

  // Variables for ripple animation
  let rippleFrame = 50
  const rippleSpeed = -0.003
  const rippleAmplitude = 400
  const defaultWeight = 300
  const maxWeight = 700
  const minWeight = 300

  // Mouse events
  h1.addEventListener('mouseenter', () => {
    isMouseOver = true
  })

  h1.addEventListener('mouseleave', () => {
    isMouseOver = false
    // Reset letters to default weight gradually
    letters.forEach((letter, i) => {
      setTimeout(() => {
        letter.style.fontWeight = defaultWeight
      }, i * 20)
    })
  })

  // Auto ripple animation function
  function animateRipple() {
    // Only animate ripple if mouse is not over heading
    if (!isMouseOver) {
      letters.forEach((letter, i) => {
        // Create a wave effect with different phases for each letter
        const phase = rippleFrame + i * 0.3
        const sine = Math.sin(phase)
        const weight = Math.round(defaultWeight + sine * rippleAmplitude)

        const clampedWeight = Math.max(minWeight, Math.min(maxWeight, weight))
        letter.style.fontWeight = clampedWeight
      })

      rippleFrame += rippleSpeed
    }

    requestAnimationFrame(animateRipple)
  }

  // Start the ripple animation
  animateRipple()

  // Add mouse move listener
  document.addEventListener('mousemove', (e) => {
    clearTimeout(mouseTimer)

    if (!isMouseOver) return // Only process when mouse is over heading

    const mousePosX = e.clientX
    const mousePosY = e.clientY

    // For each letter, calculate distance to mouse and set font weight
    letters.forEach((letter) => {
      const rect = letter.getBoundingClientRect()
      const letterPosX = rect.left + rect.width / 2
      const letterPosY = rect.top + rect.height / 2

      // Calculate distance
      const distance = Math.sqrt(Math.pow(mousePosX - letterPosX, 2) + Math.pow(mousePosY - letterPosY, 2))

      // Set max distance for effect (in pixels)
      const maxDistance = 200

      // Calculate weight
      let weight
      if (distance < maxDistance) {
        weight = defaultWeight + Math.round((maxWeight - defaultWeight) * (1 - distance / maxDistance))
      } else {
        weight = defaultWeight
      }

      // Apply the weight
      letter.style.fontWeight = weight
    })
  })
})
