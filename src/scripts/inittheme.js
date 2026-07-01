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

function applyTheme(theme) {
  const html = document.documentElement
  html.classList.toggle('dark', theme === 'dark')
  html.style.setProperty('--darkmode', theme === 'dark' ? '1' : '0')
  localStorage.setItem('theme', theme)
}

// After a ClientRouter swap the <html> attributes are replaced with the newly
// loaded document's (which has no theme class), so re-apply before paint to
// prevent a flash back to light.
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
