import Lenis from 'lenis'

window.scrollTo(0, 0)
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}

document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('header')
  const intro = document.querySelector('.intro')
  const scrollIndicator = document.querySelector('.scroll-indicator')

  const lenis = new Lenis({
    autoRaf: true,
  })
  lenis.on('scroll', ({ direction }) => {
    if (!header || !intro) return
    if (direction > 0) {
      header.style.transform = 'translateY(-50vh)'
      intro.style.opacity = 1
      scrollIndicator.style.opacity = 0
    } else {
      header.style.transform = 'translateY(-50%)'
      intro.style.opacity = 0
      scrollIndicator.style.opacity = 1
    }
  })
})
