// Адреса студії живе в одному місці — вона зустрічається на п'яти екранах
// (футер, мобільне меню, контакти, «Про нас», сторінка послуги), і при переїзді
// студії міняти доведеться тільки цей рядок.
export const STUDIO_ADDRESS = 'Бульварно-Кудрявська 22, Київ';

// Офіційний формат Google Maps URLs: на телефоні відкриває застосунок карт,
// на десктопі — вебверсію з поставленою міткою.
export const STUDIO_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(STUDIO_ADDRESS);

// Контакти Олега (3.10.2026): Telegram і WhatsApp — на той самий номер, що й дзвінок.
// Telegram — за імʼям користувача акаунта з цим номером: посилання t.me/+380… відкривається
// лише якщо в налаштуваннях приватності дозволено знаходити за номером, а імʼя працює завжди.
export const PHONE_TEL = 'tel:+380938824649';
export const PHONE_TEXT = '093 882 46 49';
export const PHONE_FULL = '+38 093 882 46 49';
export const TG_URL = 'https://t.me/ShkarupaOleh';
export const WA_URL = 'https://wa.me/380938824649';
