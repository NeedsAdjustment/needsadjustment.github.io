function currentTheme() {
  try {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {}
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function setThemeState(html, theme) {
  html.classList.toggle('dark', theme === 'dark')
}

function applyTheme(theme) {
  const html = document.documentElement
  setThemeState(html, theme)
  html.style.removeProperty('background-color')
  try {
    localStorage.setItem('theme', theme)
  } catch {}
}

// Let CSS own html/body background transitions once the stylesheet resolves.
function clearInlineBackground() {
  const html = document.documentElement
  if (!getComputedStyle(html).getPropertyValue('--background-color').trim()) return
  html.style.removeProperty('background-color')
}

document.addEventListener('astro:before-swap', (event) => {
  const next = event.newDocument?.documentElement
  if (next) setThemeState(next, currentTheme())
})

document.addEventListener('astro:after-swap', () => applyTheme(currentTheme()))

const darkRadio = document.getElementById('dark')
const lightRadio = document.getElementById('light')
const theme = currentTheme()
if (darkRadio) darkRadio.checked = theme === 'dark'
if (lightRadio) lightRadio.checked = theme === 'light'

document.getElementById('colorScheme')?.addEventListener('change', () => {
  applyTheme(darkRadio?.checked ? 'dark' : 'light')
})

if (document.readyState === 'complete') clearInlineBackground()
else window.addEventListener('load', clearInlineBackground, { once: true })
