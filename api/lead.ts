import { neon } from '@neondatabase/serverless';

// Сповіщення в Telegram (не блокує збереження заявки — якщо TG впав, лід усе одно в базі)
async function notifyTelegram(name: string, contact: string, types: string | null, service: string | null, answers: Record<string, string> | null) {
  const token = process.env.TG_BOT_TOKEN;
  const chats = (process.env.TG_CHAT_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!token || !chats.length) return;
  const lines = [
    service ? `💰 Запит розрахунку · ${service}` : '🎬 Нова заявка з tereveni-studio',
    '',
    `👤 ${name}`,
    `📱 ${contact}`,
    types ? `🎯 ${types}` : null,
    ...(answers ? Object.entries(answers).map(([q, a]) => `— ${q} ${a}`) : []),
  ].filter(Boolean);
  const results = await Promise.allSettled(chats.map((chat_id) =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text: lines.join('\n') }),
    }).then(async (r) => ({ chat_id, status: r.status, body: (await r.text()).slice(0, 120) }))
  ));
  results.forEach((r) => console.log('tg notify:', JSON.stringify(r.status === 'fulfilled' ? r.value : String(r.reason))));
}

// POST /api/lead — публічний прийом заявки (форма сайту або квіз «Розрахувати вартість»)
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const b = req.body || {};
  // honeypot: приховане поле заповнюють лише боти — вдаємо успіх, але нічого не пишемо
  if (String(b.hp || '').trim()) return res.status(200).json({ ok: true });

  const name = String(b.name || '').trim().slice(0, 120);
  const contact = String(b.contact || '').trim().slice(0, 200);
  if (!name || !contact) return res.status(400).json({ error: 'name and contact required' });
  const types = Array.isArray(b.types) && b.types.length
    ? b.types.map((t: unknown) => String(t).slice(0, 40)).slice(0, 10).join(', ')
    : null;
  const service = b.service ? String(b.service).trim().slice(0, 80) : null;
  let answers: Record<string, string> | null = null;
  if (b.answers && typeof b.answers === 'object' && !Array.isArray(b.answers)) {
    answers = {};
    for (const [q, a] of Object.entries(b.answers).slice(0, 12)) {
      answers[String(q).slice(0, 120)] = String(a).slice(0, 120);
    }
    if (!Object.keys(answers).length) answers = null;
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`create table if not exists tereveni_leads (
      id uuid primary key default gen_random_uuid(),
      created_at timestamptz not null default now(),
      name text not null,
      contact text not null,
      types text,
      status text not null default 'new'
    )`;
    await sql`alter table tereveni_leads add column if not exists service text`;
    await sql`alter table tereveni_leads add column if not exists data jsonb`;
    await sql`insert into tereveni_leads (name, contact, types, service, data)
      values (${name}, ${contact}, ${types}, ${service}, ${answers ? JSON.stringify(answers) : null})`;
  } catch (e: any) {
    console.error('lead insert error', e?.message);
    return res.status(500).json({ error: 'db error' });
  }

  try { await notifyTelegram(name, contact, types, service, answers); } catch (e: any) { console.error('tg error', e?.message); }
  return res.status(200).json({ ok: true });
}
