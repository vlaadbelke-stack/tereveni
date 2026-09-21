// Поле «Telegram або телефон» приймає два різні типи значень, тому перевіряємо
// їх окремо. Раніше перевірки не було зовсім — у заявку падало «38050505050505»
// (14 цифр), і менеджер не міг додзвонитись.

export type ContactCheck = { ok: boolean; value: string; error?: string };

export function checkContact(raw: string): ContactCheck {
  const v = (raw || '').trim();
  if (!v) return { ok: false, value: v, error: 'Вкажіть Telegram або телефон' };

  // Telegram-нік: @ + мінімум 4 символи (обмеження самого Telegram)
  if (v.startsWith('@')) {
    return /^@[A-Za-z0-9_]{4,32}$/.test(v)
      ? { ok: true, value: v }
      : { ok: false, value: v, error: 'Нік має виглядати так: @username' };
  }

  const digits = v.replace(/\D/g, '');
  if (!digits) return { ok: false, value: v, error: 'Вкажіть номер телефону або @нік у Telegram' };

  // 0XX XXX XX XX — український без коду країни
  if (digits.length === 10 && digits.startsWith('0')) return { ok: true, value: '+38' + digits };
  // 380XX XXX XX XX — з кодом країни
  if (digits.length === 12 && digits.startsWith('380')) return { ok: true, value: '+' + digits };

  return {
    ok: false,
    value: v,
    error: digits.length < 10
      ? 'Замало цифр — номер має бути у форматі 0XX XXX XX XX'
      : 'Забагато цифр — номер має бути у форматі 0XX XXX XX XX',
  };
}
