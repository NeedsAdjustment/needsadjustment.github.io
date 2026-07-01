export function pushUrl(path) {
  history.pushState(null, '', path)
}

export function getScrapSlug(pathname = location.pathname) {
  const match = pathname.match(/^\/scraps\/([^/]+)\/?$/)
  return match ? match[1] : null
}

export function isScrapsPath(pathname = location.pathname) {
  return pathname === '/scraps/' || /^\/scraps\/[^/]+\/?$/.test(pathname)
}

export function isSnapsPath(pathname = location.pathname) {
  return pathname === '/snaps/'
}
