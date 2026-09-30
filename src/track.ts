/* Конверсії для GA4 (і Lead для Meta Pixel). Самі лічильники підключені в index.html;
   поки їх немає, виклики просто нічого не роблять. */
type W = { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void }

export function track(event: string, params: Record<string, string> = {}) {
  const w = window as unknown as W
  w.gtag?.('event', event, params)
  if (event === 'generate_lead') w.fbq?.('track', 'Lead')
}

// Телефон, Telegram і календар бронювання: один слухач на весь сайт замість правок у кожній кнопці
export function trackClicks() {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest?.('a')
    if (!a) return
    const h = a.getAttribute('href') || ''
    if (h.startsWith('tel:')) track('click_phone')
    else if (h.includes('t.me/')) track('click_telegram')
    else if (h.includes('cal.com/')) track('click_booking')
  })
}
