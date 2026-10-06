/** Intro playback preferences (once per browser session). */

export const INTRO_SEEN_KEY = 'eka.intro.seen'

export function shouldPlayIntro(): boolean {
  try {
    if (new URLSearchParams(window.location.search).has('intro')) return true
    return sessionStorage.getItem(INTRO_SEEN_KEY) !== '1'
  } catch {
    return true
  }
}

export function markIntroSeen(): void {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, '1')
    // Drop the ?intro flag so a refresh doesn't replay it.
    const url = new URL(window.location.href)
    if (url.searchParams.has('intro')) {
      url.searchParams.delete('intro')
      window.history.replaceState(null, '', url.toString())
    }
  } catch {
    /* storage unavailable — intro simply replays next visit */
  }
}

export function replayIntro(): void {
  try {
    sessionStorage.removeItem(INTRO_SEEN_KEY)
  } catch {
    /* ignore */
  }
  window.location.reload()
}
