/**
 * Theme wiring. The initial theme is applied by the blocking inline script in
 * <head> (see Layout.astro) so there is never a flash. This module keeps the
 * toggle wired, syncs the radios, and carries the theme across route swaps.
 */
function currentTheme() {
  return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
}

function setThemeState(html, theme) {
  html.classList.toggle('dark', theme === 'dark')
}

function applyTheme(theme) {
  const html = document.documentElement
  setThemeState(html, theme)
  // The blocking script sets an inline background for the first paint. Drop it
  // once the theme changes so <html> and <body> both follow --background-color
  // via CSS and animate in sync.
  html.style.removeProperty('background-color')
  localStorage.setItem('theme', theme)
}

// Keep the inline first-paint colour until the stylesheet has loaded (the
// custom property resolves), then hand the background over to CSS.
function clearInlineBackground() {
  const html = document.documentElement
  const background = getComputedStyle(html).getPropertyValue('--background-color').trim()
  if (!background) {
    requestAnimationFrame(clearInlineBackground)
    return
  }
  html.style.removeProperty('background-color')
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
  clearInlineBackground()
}

if (document.readyState !== 'loading') init()
else document.addEventListener('DOMContentLoaded', init)
document.addEventListener('astro:page-load', init)
