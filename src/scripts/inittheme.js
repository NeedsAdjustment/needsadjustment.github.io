/**
 * Theme initialization and persistence
 * Remembers user preferences across sessions
 */

document.addEventListener('DOMContentLoaded', function () {
  const darkRadio = document.getElementById('color-scheme-dark')
  const lightRadio = document.getElementById('color-scheme-light')

  // Theme setting functions
  function setDarkTheme() {
    darkRadio.checked = true
    localStorage.setItem('theme-preference', 'dark')
    updateGradients()
    revealPage() // Show page after theme is applied
  }

  function setLightTheme() {
    lightRadio.checked = true
    localStorage.setItem('theme-preference', 'light')
    updateGradients()
    revealPage() // Show page after theme is applied
  }

  // Function to update gradient appearance when theme changes
  function updateGradients() {
    // Force animation restart to update colors
    const wrapper = document.querySelector('.h1-gradient-wrapper')
    if (wrapper) {
      const animation = wrapper.style.animation
      wrapper.style.animation = 'none'
      void wrapper.offsetWidth // Trigger reflow
      wrapper.style.animation = animation
    }
  }

  // Function to reveal the page once theme is ready
  function revealPage() {
    // Short timeout to ensure CSS has been applied
    setTimeout(() => {
      document.documentElement.classList.remove('theme-initializing')
    }, 50)
  }

  // Check for saved preference first
  const savedTheme = localStorage.getItem('theme-preference')

  if (savedTheme === 'dark') {
    // User previously selected dark theme
    setDarkTheme()
  } else if (savedTheme === 'light') {
    // User previously selected light theme
    setLightTheme()
  } else {
    // No saved preference, use system preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (systemPrefersDark) {
      setDarkTheme()
    } else {
      setLightTheme()
    }
  }

  // Listen for theme change by user
  lightRadio.addEventListener('change', function () {
    if (this.checked) {
      setLightTheme()
    }
  })

  darkRadio.addEventListener('change', function () {
    if (this.checked) {
      setDarkTheme()
    }
  })

  // System preference changes only apply if user hasn't set a preference
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only follow system if no user preference is saved
    if (!localStorage.getItem('theme-preference')) {
      if (e.matches) {
        setDarkTheme()
      } else {
        setLightTheme()
      }
    }
  })
})
