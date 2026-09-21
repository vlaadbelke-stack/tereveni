import { neon } from '@neondatabase/serverless';
import { createHash, timingSafeEqual } from 'node:crypto';

// GET /api/leads — список · PATCH — статус · DELETE — видалення · POST {action:'change_password'} — зміна пароля
// Доступ з заголовком x-admin-key. Пароль живе в tereveni_settings (міняється з адмінки);
// поки там порожньо — діє початковий ADMIN_PASSWORD з env.
// Порівнюємо SHA-256 фіксованої довжини: інакше timingSafeEqual кидає RangeError
// на не-ASCII (довжина рядка ≠ довжина в байтах) і функція падає в 500 замість 401.
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

export default async function handler(req: any, res: any) {
  const sql = neon(process.env.DATABASE_URL!);
  const got = String(req.headers['x-admin-key'] || '');
  const want = await currentPassword(sql);
  if (!want || !safeEq(got, want)) return res.status(401).json({ error: 'unauthorized' });

  const STATUSES = new Set(['new', 'in_progress', 'done']);
  try {
    if (req.method === 'GET') {
      const rows = await sql`select * from tereveni_leads order by created_at desc limit 300`;
      return res.status(200).json({ rows });
    }
    if (req.method === 'PATCH') {
      const { id, status } = req.body || {};
      if (!id || !STATUSES.has(String(status))) return res.status(400).json({ error: 'bad input' });
      await sql`update tereveni_leads set status = ${String(status)} where id = ${String(id)}`;
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'bad input' });
      await sql`delete from tereveni_leads where id = ${String(id)}`;
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'POST') {
      const { action, next } = req.body || {};
      if (action !== 'change_password') return res.status(400).json({ error: 'bad input' });
      const np = String(next || '').trim();
      if (np.length < 8 || np.length > 100) return res.status(400).json({ error: 'Пароль має бути від 8 символів' });
      // Тільки ASCII: пароль летить у HTTP-заголовку x-admin-key, а кирилицю туди покласти
      // неможливо — інакше власник назавжди втратить доступ до адмінки.
      if (!/^[\x21-\x7E]+$/.test(np)) return res.status(400).json({ error: 'Лише латинські літери, цифри та символи — без кирилиці й пробілів' });
      await sql`create table if not exists tereveni_settings (k text primary key, v text not null)`;
      await sql`insert into tereveni_settings (k, v) values ('admin_password', ${np})
        on conflict (k) do update set v = ${np}`;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    // Таблиці лідів ще нема (жодної заявки) — для GET віддаємо порожній список
    if (req.method === 'GET' && /does not exist/i.test(e?.message || '')) {
      return res.status(200).json({ rows: [] });
    }
    console.error('leads error', e?.message);
    return res.status(500).json({ error: 'db error' });
  }
}
