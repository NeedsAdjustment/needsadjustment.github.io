/**
 * Theme wiring. The initial theme class is applied by a blocking inline script
 * in <head> (see Layout.astro) so there is never a flash. Because <html>
 * persists across ClientRouter navigations, the theme also carries over with no
 * flash. This module only wires the toggle (once — the footer is persisted) and
 * keeps the radio inputs in sync on each page.
 */
function currentTheme() {
  return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
}

function themeStyles(theme) {
  // Mirrors --background-color in variables.css; also applied inline so the
  // canvas is never left white while the new page's styles settle.
  return {
    background: theme === 'dark' ? '#24273a' : '#fffcf0',
    scheme: theme === 'dark' ? 'dark' : 'light',
    darkmode: theme === 'dark' ? '1' : '0',
  }
}

function applyTheme(theme) {
  const html = document.documentElement
  const { background, scheme, darkmode } = themeStyles(theme)
  html.classList.toggle('dark', theme === 'dark')
  html.style.setProperty('--darkmode', darkmode)
  html.style.backgroundColor = background
  html.style.colorScheme = scheme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background)
  localStorage.setItem('theme', theme)
}

// Astro replaces <html>'s attributes with the incoming document's, which is
// SSR'd without the theme class. Copy the current theme state onto the incoming
// <html> before the swap so it is applied in the same step, rather than letting
// the new body lay out in the light theme for a frame and then fade to dark via
// its background-color transition (the body-shaped white flash).
document.addEventListener('astro:before-swap', (event) => {
  const next = event.newDocument?.documentElement
  if (!next) return
  const theme = currentTheme()
  const { background, scheme, darkmode } = themeStyles(theme)
  next.classList.toggle('dark', theme === 'dark')
  next.style.backgroundColor = background
  next.style.colorScheme = scheme
  next.style.setProperty('--darkmode', darkmode)
  next.querySelector('meta[name="theme-color"]')?.setAttribute('content', background)
})

// Re-apply after the swap as a safety net (e.g. if a transition is interrupted).
document.addEventListener('astro:after-swap', () => applyTheme(currentTheme()))

function syncRadios() {
  const darkRadio = document.getElementById('dark')
  const lightRadio = document.getElementById('light')
  const theme = currentTheme()
  if (darkRadio) darkRadio.checked = theme === 'dark'
  if (lightRadio) lightRadio.checked = theme === 'light'
}

function wireToggle() {
  const toggle = document.getElementById('colorScheme')
  if (!toggle || toggle.dataset.wired) return
  toggle.dataset.wired = '1'
  toggle.addEventListener('change', () => {
    const darkRadio = document.getElementById('dark')
    applyTheme(darkRadio?.checked ? 'dark' : 'light')
  })
}

function init() {
  wireToggle()
  syncRadios()
}

if (document.readyState !== 'loading') init()
else document.addEventListener('DOMContentLoaded', init)
document.addEventListener('astro:page-load', init)
