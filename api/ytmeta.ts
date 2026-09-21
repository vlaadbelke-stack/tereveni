import { createHash, timingSafeEqual } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

// GET /api/ytmeta?url=<посилання> — назва ролика й канал із YouTube oEmbed.
// Потрібно, щоб в адмінці власник просто вставляв посилання, а решта підтягувалась сама.
// Ходимо з сервера, а не з браузера: у youtube.com/oembed немає CORS-заголовків.

function safeEq(a: string, b: string): boolean {
  if (!a || !b) return false;
  const h = (s: string) => createHash('sha256').update(s, 'utf8').digest();
  return timingSafeEqual(h(a), h(b));
}

async function currentPassword(sql: any): Promise<string> {
  try {
    const r = await sql`select v from tereveni_settings where k = 'admin_password'`;
    if (r[0]?.v) return String(r[0].v);
  } catch { /* таблиці ще нема */ }
  return String(process.env.ADMIN_PASSWORD || '');
}

const ytId = (raw: string) => {
  const s = String(raw || '').trim();
  const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{11}$/.test(s) ? s : '';
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const sql = neon(process.env.DATABASE_URL!);
  const got = String(req.headers['x-admin-key'] || '');
  const want = await currentPassword(sql);
  if (!want || !safeEq(got, want)) return res.status(401).json({ error: 'unauthorized' });

  const id = ytId(String(req.query?.url || ''));
  if (!id) return res.status(400).json({ error: 'У посиланні немає відео' });

  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
    if (!r.ok) return res.status(404).json({ error: 'YouTube не знайшов це відео' });
    const j: any = await r.json();
    return res.status(200).json({ id, title: String(j.title || ''), channel: String(j.author_name || '') });
  } catch {
    return res.status(502).json({ error: 'YouTube не відповів' });
  }
}
