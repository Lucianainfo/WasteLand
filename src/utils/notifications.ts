export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

/** One alert per offer per session, so a re-search doesn't repeat the same notification. */
const alreadyNotified = new Set<string>()

export function notifyLastCall(offerId: string, title: string, body: string) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  if (alreadyNotified.has(offerId)) return
  alreadyNotified.add(offerId)
  new Notification(title, { body, icon: '/favicon.svg' })
}
