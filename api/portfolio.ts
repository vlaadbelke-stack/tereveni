import { neon } from '@neondatabase/serverless';
import { createHash, timingSafeEqual } from 'node:crypto';

// GET  /api/portfolio — публічний список робіт для сайту (без ключа)
// PUT  /api/portfolio — повний перезапис списку з адмінки (потрібен x-admin-key)
//
// Головна і сторінка портфоліо мають вбудований список у коді як запасний варіант:
// якщо база недоступна, сайт показує роботи, а не порожній блок. База лише перекриває їх.

function safeEq(a: string, b: string): boolean {
  if (!a || !b) return false;
  const h = (s: string) => createHash('sha256').update(s, 'utf8').digest();
  return timingSafeEqual(h(a), h(b));
}

async function currentPassword(sql: any): Promise<string> {
  try {
    const r = await sql`select v from tereveni_settings where k = 'admin_password'`;
    if (r[0]?.v) return String(r[0].v);
  } catch { /* таблиці ще нема — падаємо на env */ }
  return String(process.env.ADMIN_PASSWORD || '');
}

const ensure = (sql: any) => sql`
  create table if not exists tereveni_portfolio (
    id         text primary key,
    sort       int  not null default 0,
    visible    bool not null default true,
    cat        text not null default '',
    title      text not null default '',
    yt         text not null default '',
    channel    text not null default '',
    loc        text not null default '',
    img        text not null default '',
    stats      jsonb not null default '[]'::jsonb,
    updated_at timestamptz not null default now()
  )`;

// YouTube ID — 11 символів. Приймаємо і повне посилання: Олег копіюватиме саме його,
// а не голий ідентифікатор, і вимагати від нього ручного вирізання було б знущанням.
function ytId(raw: string): string {
  const s = String(raw || '').trim();
  const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{11}$/.test(s) ? s : '';
}

export default async function handler(req: any, res: any) {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    if (req.method === 'GET') {
      await ensure(sql);
      const rows = await sql`select * from tereveni_portfolio order by sort asc, updated_at asc`;
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ rows });
    }

    const got = String(req.headers['x-admin-key'] || '');
    const want = await currentPassword(sql);
    if (!want || !safeEq(got, want)) return res.status(401).json({ error: 'unauthorized' });

    if (req.method === 'PUT') {
      const items = Array.isArray(req.body?.items) ? req.body.items : null;
      if (!items) return res.status(400).json({ error: 'bad input' });
      if (items.length > 60) return res.status(400).json({ error: 'Забагато робіт' });

      const clean = items.map((it: any, i: number) => ({
        id: String(it.id || '').slice(0, 60) || 'w' + Date.now() + i,
        sort: i,
        visible: it.visible !== false,
        cat: String(it.cat || '').slice(0, 40),
        title: String(it.title || '').slice(0, 200),
        yt: ytId(it.yt),
        channel: String(it.channel || '').slice(0, 80),
        loc: String(it.loc || '').slice(0, 40),
        img: String(it.img || '').slice(0, 200),
        stats: Array.isArray(it.stats) ? it.stats.slice(0, 4).map((s: any) => ({
          v: String(s?.v || '').slice(0, 30), l: String(s?.l || '').slice(0, 40),
        })) : [],
      }));
      // Роботу без відео показувати нікуди — плитка веде на ролик
      const bad = clean.find((c: any) => !c.yt);
      if (bad) return res.status(400).json({ error: `Немає посилання на відео: «${bad.title || 'без назви'}»` });

      await ensure(sql);
      // Повний перезапис у транзакції: адмінка завжди надсилає весь список,
      // тому порядок і видалення застосовуються одним рухом і не лишають сиріт.
      await sql.transaction([
        sql`delete from tereveni_portfolio`,
        ...clean.map((c: any) => sql`
          insert into tereveni_portfolio (id, sort, visible, cat, title, yt, channel, loc, img, stats)
          values (${c.id}, ${c.sort}, ${c.visible}, ${c.cat}, ${c.title}, ${c.yt}, ${c.channel}, ${c.loc}, ${c.img}, ${JSON.stringify(c.stats)})
        `),
      ]);
      return res.status(200).json({ ok: true, count: clean.length });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    if (req.method === 'GET') {
      // Сайт не має падати через базу — віддаємо порожньо, фронт покаже вбудований список
      return res.status(200).json({ rows: [] });
    }
    console.error('portfolio error', e?.message);
    return res.status(500).json({ error: 'db error' });
  }
}
