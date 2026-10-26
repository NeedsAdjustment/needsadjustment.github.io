/**
 * Theme wiring. The initial theme is applied by the blocking inline script in
 * <head> (see Layout.astro) so there is never a flash. This module keeps the
 * toggle wired, syncs the radios, and carries the theme across route swaps.
 */
function currentTheme() {
  return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
}

function setThemeState(html, theme) {
  const dark = theme === 'dark'
  html.classList.toggle('dark', dark)
  // Mirrors --background-color in variables.css; inline so the canvas is never
  // left white while the new page's styles settle.
  html.style.backgroundColor = dark ? '#1f1f28' : '#fffcf0'
}

function applyTheme(theme) {
  setThemeState(document.documentElement, theme)
  localStorage.setItem('theme', theme)
}

// Astro replaces <html>'s attributes with the incoming document's, which is
// SSR'd without the theme class. Apply the theme to the incoming <html> before
// the swap so the new body never lays out in the light theme for a frame.
document.addEventListener('astro:before-swap', (event) => {
  const next = event.newDocument?.documentElement
  if (next) setThemeState(next, currentTheme())
})

// Safety net if a transition is interrupted.
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
