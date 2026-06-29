import Lenis from 'lenis'

window.scrollTo(0, 0)
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}

document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('header')
  const h1 = document.querySelector('h1')
  const h2 = document.querySelector('h2')
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
      if (h1) {
        h1.style.opacity = '0'
        h1.style.maxHeight = '0'
      }
      if (h2) {
        h2.style.paddingTop = '2rem'
      }
    } else {
      header.style.transform = 'translateY(-50%)'
      intro.style.opacity = 0
      scrollIndicator.style.opacity = 1
      if (h1) {
        h1.style.opacity = '1'
        h1.style.maxHeight = ''
      }
      if (h2) {
        h2.style.paddingTop = ''
      }
    }
  })
})
