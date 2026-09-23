/* SEO на кожну сторінку.
 *
 * Сайт — SPA: у білді один index.html, і без цього хука всі сім сторінок
 * віддавали ОДИН title, один опис і один canonical на vercel.app. У видачі
 * вони виглядали як сім копій головної, а при шері в телеграм превʼю
 * внутрішньої сторінки тягнулось із каркаса.
 *
 * Хук виставляє теги в <head> під час рендеру сторінки. Пререндер потім
 * зберігає цей стан у статичний HTML, тому боти бачать правильні теги
 * ще до виконання JS; а без пререндеру їх принаймні бачить Google, який
 * JS виконує. Теги, яких у index.html нема, створюються на льоту.
 */
import { useEffect } from 'react';

export const SITE_URL = 'https://tereveni.studio';
export const SITE_NAME = 'ТЕРЕВЕНІ · студія';
const DEFAULT_IMAGE = `${SITE_URL}/og.jpg`;
const TITLE_SUFFIX = ' | Tereveni Studio';

export type SeoInput = {
  title: string;         // без суфікса — він додається сам
  description: string;
  path: string;          // від кореня, напр. '/pro-nas'
  image?: string;        // абсолютний URL; за замовчуванням og.jpg
  noindex?: boolean;     // для адмінки
};

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function applySeo(s: SeoInput) {
  const fullTitle = s.title.includes('Tereveni') ? s.title : s.title + TITLE_SUFFIX;
  const url = SITE_URL + (s.path === '/' ? '/' : s.path.replace(/\/$/, ''));
  const image = s.image ?? DEFAULT_IMAGE;

  document.title = fullTitle;
  setMeta('name', 'description', s.description);
  setMeta('property', 'og:title', fullTitle);
  setMeta('property', 'og:description', s.description);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:image', image);
  // усі картки в public/og і og.jpg зроблені 1200×630
  setMeta('property', 'og:image:width', '1200');
  setMeta('property', 'og:image:height', '630');
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:locale', 'uk_UA');
  setMeta('property', 'og:site_name', SITE_NAME);
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', fullTitle);
  setMeta('name', 'twitter:description', s.description);
  setMeta('name', 'twitter:image', image);
  setLink('canonical', url);
  setMeta('name', 'robots', s.noindex ? 'noindex, nofollow' : 'index, follow');
}

export function useSeo(s: SeoInput) {
  // Залежності — примітиви, щоб хук не смикався на кожен рендер батька
  useEffect(() => { applySeo(s); }, [s.title, s.description, s.path, s.image, s.noindex]);
}

/* Тексти для сторінок без власних даних. Послуги беруть title/intro
   зі services.ts, тому їх тут нема. */
export const PAGE_SEO = {
  home: {
    title: 'Подкаст-студія в Києві: подкасти і YouTube | Tereveni',
    description: 'Подкаст-студія в центрі Києва. Знімаємо подкасти й YouTube-шоу під ключ: 4K-камери, 20+ приладів світла, звук і монтаж. Команда в ціні.',
    path: '/',
  },
  about: {
    title: 'Про подкаст-студію Теревені в Києві',
    description: 'Подкаст-студія на Бульварно-Кудрявській, 22 у центрі Києва. Пʼять локацій, 4K-камери, 20+ приладів світла і команда, з якою знімають канали на сотні тисяч.',
    path: '/pro-nas',
  },
  portfolio: {
    title: 'Портфоліо: подкасти та YouTube-шоу',
    description: 'Подкасти, інтервʼю та YouTube-шоу, зняті й змонтовані в студії Теревені в Києві. Реальні випуски реальних каналів у готовому вигляді.',
    path: '/portfolio',
  },
  admin: {
    title: 'Адмінка',
    description: 'Службова сторінка.',
    path: '/admin',
    noindex: true,
  },
} as const;
