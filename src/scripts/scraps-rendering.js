function setScrapItemState(item, detail) {
  const body = item.querySelector('.scrap-body')
  const excerpt = item.querySelector('.scrap-excerpt')

  if (detail) {
    if (body) body.style.display = 'block'
    if (excerpt) excerpt.style.display = 'none'
    item.classList.add('detail')
    item.style.display = 'flex'
    return
  }

  if (body) body.style.display = 'none'
  if (excerpt) excerpt.style.display = ''
  item.classList.remove('detail')
  item.style.display = ''
}

export function showScrapList(viewScraps, pushUrl, push = true) {
  if (!viewScraps) return
  document.querySelectorAll('.scrap-item').forEach((item) => {
    setScrapItemState(item, false)
  })
  viewScraps.scrollTop = 0
  if (push) pushUrl('/scraps/')
}

export function showScrapDetail(viewScraps, pushUrl, slug, push = true) {
  if (!viewScraps) return
  document.querySelectorAll('.scrap-item').forEach((item) => {
    setScrapItemState(item, item.dataset.slug === slug)
  })
  viewScraps.scrollTop = 0
  if (push) pushUrl(`/scraps/${slug}/`)
}
