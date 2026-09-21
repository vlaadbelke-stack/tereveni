# Tereveni Studio

Сайт подкаст-студії «Теревені» — React + Vite, деплой на Vercel, домен tereveni.studio.

## Як влаштовано

- `src/` — сторінки й компоненти, маршрути в `App.tsx`
- `src/seo.ts` — title/description/canonical/og для кожної сторінки
- `api/` — серверні функції Vercel: заявки з форми (Neon + Telegram), портфоліо, адмінка
- `public/robots.txt`, `public/sitemap.xml` — на домені tereveni.studio

## Пререндер

Сайт — SPA, але сторінки віддаються готовим HTML: після збірки `_prerender.cjs`
відкриває кожен маршрут у headless-браузері й зберігає розмітку в `dist/<маршрут>/index.html`.
Це потрібно ботам, які не виконують JS (ШІ-пошуки, частина краулерів).

Пререндер вбудований у `npm run build`, тому працює і локально, і на Vercel.
Нічого окремо запускати не треба.

## Розробка

```bash
npm install
npm run dev      # локальний сервер
npm run build    # збірка + пререндер
```

Push у `main` → Vercel сам збирає й публікує на tereveni.studio.
