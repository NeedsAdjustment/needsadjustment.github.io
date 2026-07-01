/**
 * Custom window properties used by the site's client-side scripts
 * for cross-module coordination (scrolling.js, scraps.js, snaps.js).
 */
interface Window {
  /** Tracks the current view mode for cross-module coordination */
  __activeView: 'home' | 'scraps' | 'snaps'

  /**
   * Toggles the `.scrolled` class on `header.hero`.
   * Called by scraps.js and snaps.js to move the header up/down.
   */
  __headerState: (top: boolean) => void

  /**
   * Navigate to a scrap by slug (called by scrolling.js on homepage scroll).
   * Exposed by scraps.js.
   */
  __showScrapBySlug: ((slug: string) => void) | undefined

  /**
   * Exit scraps mode and return to home (called by snaps.js).
   * Exposed by scraps.js.
   */
  exitScrapsMode: (() => void) | undefined

  /**
   * Close the snaps gallery without URL push (called by scraps.js).
   * Exposed by snaps.js.
   */
  closeSnapsGallery: (() => void) | undefined

  /**
   * Reset the scroll-at-top flag (called by snaps.js on gallery close).
   * Exposed by scrolling.js.
   */
  __resetScrollAtTop: (() => void) | undefined

  /**
   * Clear scraps UI back to its hidden/home state.
   * Exposed by scraps.js.
   */
  __resetScrapsView: (() => void) | undefined
}
