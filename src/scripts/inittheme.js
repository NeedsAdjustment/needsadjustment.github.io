function initTheme() {
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

  function setDarkTheme() {
    htmlElement.classList.add('dark')
    htmlElement.style.setProperty('--darkmode', '1')
    if (darkRadio) darkRadio.checked = true
  }

  function setLightTheme() {
    htmlElement.classList.remove('dark')
    htmlElement.style.setProperty('--darkmode', '0')
    if (lightRadio) lightRadio.checked = true
  }

  window.localStorage.setItem('theme', theme)
  if (theme === 'light') {
    setLightTheme()
  } else {
    setDarkTheme()
  }

  if (toggle) {
    toggle.addEventListener('change', function () {
      if (lightRadio?.checked) {
        setLightTheme()
        window.localStorage.setItem('theme', 'light')
      } else if (darkRadio?.checked) {
        setDarkTheme()
        window.localStorage.setItem('theme', 'dark')
      }
    })
  }
}

if (document.readyState !== 'loading') initTheme()
else document.addEventListener('DOMContentLoaded', initTheme)
document.addEventListener('astro:page-load', initTheme)
