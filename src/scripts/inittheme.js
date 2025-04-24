document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('colorScheme')
  const darkRadio = document.getElementById('dark')
  const lightRadio = document.getElementById('light')
  const htmlElement = document.documentElement

  const theme = (() => {
    const localStorageTheme = localStorage?.getItem('theme') ?? ''
    if (['light', 'dark'].includes(localStorageTheme)) {
      return localStorageTheme
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  })()

  function updateGradients() {
    const wrapper = document.querySelector('.h1-gradient-wrapper')
    if (wrapper) {
      const animation = wrapper.style.animation
      wrapper.style.animation = 'none'
      void wrapper.offsetWidth
      wrapper.style.animation = animation
    }
  }

  function setDarkTheme() {
    htmlElement.classList.add('dark')
    htmlElement.classList.add('dark-theme')
    htmlElement.classList.remove('light-theme')
    htmlElement.style.setProperty('--darkmode', '1')
    darkRadio.checked = true
  }

  function setLightTheme() {
    htmlElement.classList.remove('dark')
    htmlElement.classList.remove('dark-theme')
    htmlElement.classList.add('light-theme')
    htmlElement.style.setProperty('--darkmode', '0')
    lightRadio.checked = true
  }

  window.localStorage.setItem('theme', theme)
  if (theme === 'light') {
    setLightTheme()
  } else {
    setDarkTheme()
  }

  toggle.addEventListener('change', function () {
    if (lightRadio.checked) {
      setLightTheme()
      window.localStorage.setItem('theme', 'light')
    } else if (darkRadio.checked) {
      setDarkTheme()
      window.localStorage.setItem('theme', 'dark')
    }
    updateGradients()
  })
})
