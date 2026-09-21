import { useEffect, useState } from 'react';

/* Роботи студії. Живуть у базі (керує Олег з /admin), але список нижче зашитий у код
   як запасний варіант: якщо база недоступна, сайт показує роботи, а не порожній блок.
   Це навмисно — портфоліо на головній не має падати разом із базою. */

export type WorkStat = { v: string; l: string };
export type Work = {
  id: string;
  cat: string;        // Шоу · Подкаст · Інтервʼю
  t: string;          // назва
  cls: string;        // big | small | half — розмір плитки в сітці на головній
  img: string;        // запасна обкладинка, якщо ютуб не віддав прев'ю
  yt: string;         // ID ролика
  ch: string;         // канал
  loc: string;        // локація зйомки
  stats: WorkStat[];
  visible?: boolean;
};

// Розміри плиток циклічно, щоб сітка на головній лишалась живою при будь-якій кількості робіт
const CLS = ['big', 'small', 'half', 'half'];

export const FALLBACK_WORKS: Work[] = [
  { id: 'ktulhu', cat: 'Шоу', t: '«Поклик Ктулху» · D&D-шоу, 2 сезони', cls: 'big', img: '/work-podcast.webp', yt: '3rB89C1YjTg', ch: 'Точка Збору', loc: 'GRAPHITE', stats: [{ v: '168 тис.', l: 'підписників' }, { v: '253 тис.', l: 'переглядів випуску' }, { v: '2', l: 'сезони' }] },
  { id: 'poradnytsia', cat: 'Подкаст', t: '«Порадниця» з Анастасією Короткою', cls: 'small', img: '/work-youtube.webp', yt: 'oYcOHKvcICM', ch: 'Тріо Різні', loc: 'MODERN', stats: [{ v: '83 тис.', l: 'підписників' }, { v: '27 тис.', l: 'переглядів випуску' }] },
  { id: 'variant-bedniakov', cat: 'Шоу', t: '«Варіанти» з Андрієм Бєдняковим', cls: 'half', img: '/work-interview.webp', yt: 'WPDPJjA6m20', ch: 'Точка Збору', loc: 'GRAPHITE', stats: [{ v: '168 тис.', l: 'підписників' }, { v: '211 тис.', l: 'переглядів випуску' }] },
  { id: 'variant-dantes', cat: 'Шоу', t: '«Варіанти» · випуск із Вовою Дантесом', cls: 'half', img: '/work-reels.webp', yt: 'XC3mhC0pvlM', ch: 'Точка Збору', loc: 'GRAPHITE', stats: [{ v: '168 тис.', l: 'переглядів' }, { v: '264 тис.', l: 'переглядів випуску' }] },
];

export const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;

type Row = {
  id: string; cat: string; title: string; yt: string; channel: string;
  loc: string; img: string; stats: WorkStat[]; visible: boolean;
};

const fromRow = (r: Row, i: number): Work => ({
  id: r.id,
  cat: r.cat,
  t: r.title,
  cls: CLS[i % CLS.length],
  img: r.img || '/work-podcast.webp',
  yt: r.yt,
  ch: r.channel,
  loc: r.loc,
  stats: Array.isArray(r.stats) ? r.stats : [],
  visible: r.visible,
});

/** Роботи для публічної частини: база, а якщо вона мовчить — вбудований список. */
export function useWorks(): Work[] {
  const [works, setWorks] = useState<Work[]>(FALLBACK_WORKS);
  useEffect(() => {
    let alive = true;
    fetch('/api/portfolio')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive || !j?.rows?.length) return;   // порожня база = лишаємо вбудований список
        const list = (j.rows as Row[]).filter((r) => r.visible !== false).map(fromRow);
        if (list.length) setWorks(list);
      })
      .catch(() => { /* мовчки лишаємо вбудований список */ });
    return () => { alive = false; };
  }, []);
  return works;
}
