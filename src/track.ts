/* Конверсії для GA4 і Meta Pixel. Самі лічильники підключені в index.html;
   поки їх немає (або їх блокує браузер), виклики просто нічого не роблять. */
type W = { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void }

// подія GA4 → стандартна подія Meta
const META: Record<string, string> = {
  generate_lead: 'Lead',
  click_booking: 'Schedule',
  click_phone: 'Contact',
  click_telegram: 'Contact',
  click_instagram: 'Contact',
  click_whatsapp: 'Contact',
}

export function track(event: string, params: Record<string, string> = {}) {
  const w = window as unknown as W
  w.gtag?.('event', event, params)
  const m = META[event]
  if (m) w.fbq?.('track', m, m === 'Contact' ? { channel: event.replace('click_', '') } : undefined)
}

// Телефон, Telegram, Instagram і календар бронювання: один слухач на весь сайт замість правок у кожній кнопці
export function trackClicks() {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest?.('a')
    if (!a) return
    const h = a.getAttribute('href') || ''
    if (h.startsWith('tel:')) track('click_phone')
    else if (h.includes('t.me/')) track('click_telegram')
    else if (h.includes('wa.me/')) track('click_whatsapp')
    else if (h.includes('instagram.com/')) track('click_instagram')
    else if (h.includes('cal.com/')) track('click_booking')
  })
}

/* UTM-мітки з реклами. Запам'ятовуємо з першої сторінки візиту: людина могла прийти
   на головну з ?utm_..., а заявку залишити вже на сторінці послуги. */
const UTM_KEY = 'tereveni-utm'
const UTM = ['utm_source', 'utm_campaign', 'utm_content']
try {
  const q = new URLSearchParams(location.search)
  const u = Object.fromEntries(UTM.filter((k) => q.get(k)).map((k) => [k, q.get(k)!.slice(0, 80)]))
  if (Object.keys(u).length) sessionStorage.setItem(UTM_KEY, JSON.stringify(u))
} catch { /* приватний режим: без міток */ }

export function utm(): Record<string, string> | undefined {
  try { return JSON.parse(sessionStorage.getItem(UTM_KEY) || 'null') || undefined } catch { return undefined }
}
