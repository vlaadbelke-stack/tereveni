import { useEffect, useState } from 'react';
import { FALLBACK_WORKS } from './works';

// Екран «Портфоліо» в адмінці: Олег сам міняє роботи, які показує сайт.
// Свідомо просте: жодних drag-and-drop і модалок — картка з підписаними полями,
// стрілки вгору/вниз і одна кнопка «Зберегти».

type Stat = { v: string; l: string };
type Item = {
  id: string; visible: boolean; cat: string; title: string;
  yt: string; channel: string; loc: string; img: string; stats: Stat[];
};

const ytId = (raw: string) => {
  const s = String(raw || '').trim();
  const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{11}$/.test(s) ? s : '';
};

const blank = (): Item => ({
  id: 'w' + Date.now(), visible: true, cat: 'Шоу', title: '',
  yt: '', channel: '', loc: '', img: '', stats: [],
});

export default function AdminPortfolio({ adminKey }: { adminKey: string }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/portfolio')
      .then((r) => r.json())
      .then((j) => {
        const rows = (j.rows || []).map((r: any) => ({
          id: r.id, visible: r.visible !== false, cat: r.cat || '', title: r.title || '',
          yt: r.yt || '', channel: r.channel || '', loc: r.loc || '', img: r.img || '',
          stats: Array.isArray(r.stats) ? r.stats : [],
        }));
        // База порожня — показуємо ті самі роботи, що зараз на сайті (вони зашиті в код).
        // Інакше власник бачить «0 робіт» при живому портфоліо і не розуміє, де його відео.
        // Перше «Зберегти» просто перенесе цей список у базу.
        setItems(rows.length ? rows : FALLBACK_WORKS.map((w) => ({
          id: w.id, visible: true, cat: w.cat, title: w.t,
          yt: 'https://youtu.be/' + w.yt, channel: w.ch, loc: w.loc, img: w.img, stats: w.stats,
        })));
      })
      .catch(() => setErr('Не вдалося завантажити список робіт.'));
  }, []);

  const patch = (i: number, p: Partial<Item>) =>
    setItems((s) => s && s.map((it, k) => (k === i ? { ...it, ...p } : it)));

  // Вставив посилання — назву й канал беремо з YouTube. Власник не має нічого друкувати вручну;
  // якщо він уже щось вписав, не перетираємо — тільки заповнюємо порожнє.
  const [loading, setLoading] = useState<number | null>(null);
  const pullMeta = async (i: number, url: string) => {
    if (!ytId(url)) return;
    setLoading(i);
    try {
      const r = await fetch('/api/ytmeta?url=' + encodeURIComponent(url), { headers: { 'x-admin-key': adminKey } });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(j.error || 'Не вдалося прочитати відео'); return; }
      setErr('');
      setItems((s) => s && s.map((it, k) => (k === i
        ? { ...it, title: it.title.trim() || j.title || '', channel: it.channel.trim() || j.channel || '' }
        : it)));
    } catch {
      setErr('Не вдалося звʼязатися з YouTube');
    } finally {
      setLoading(null);
    }
  };

  const move = (i: number, dir: -1 | 1) =>
    setItems((s) => {
      if (!s) return s;
      const j = i + dir;
      if (j < 0 || j >= s.length) return s;
      const c = s.slice();
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const remove = (i: number) => {
    if (!window.confirm('Прибрати цю роботу зі списку?')) return;
    setItems((s) => s && s.filter((_, k) => k !== i));
  };

  const save = async () => {
    if (!items) return;
    setErr(''); setMsg(''); setSaving(true);
    try {
      const r = await fetch('/api/portfolio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ items }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(j.error || 'Не вдалося зберегти.'); return; }
      setMsg(`Збережено · ${j.count} робіт. Сайт уже оновився.`);
      setTimeout(() => setMsg(''), 6000);
    } catch {
      setErr('Немає звʼязку з сервером. Спробуйте ще раз.');
    } finally {
      setSaving(false);
    }
  };

  if (!items) return <div className="adm-empty">Завантаження…</div>;

  const visible = items.filter((i) => i.visible).length;

  return (
    <div className="pfa">
      <div className="pfa-bar">
        <div className="pfa-count">{items.length} робіт · показується {visible}</div>
        <div className="pfa-bar-r">
          <button className="adm-exit" onClick={() => setItems((s) => [...(s || []), blank()])}>+ Додати роботу</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Зберігаю…' : 'Зберегти'}</button>
        </div>
      </div>

      {err && <div className="adm-err" style={{ marginBottom: 14 }}>{err}</div>}
      {msg && <div className="pfa-ok">{msg}</div>}

      {items.length === 0 && (
        <div className="adm-empty">Список порожній. Натисніть «Додати роботу».</div>
      )}

      {items.map((it, i) => {
        const id = ytId(it.yt);
        return (
          <div className={`pfa-card ${it.visible ? '' : 'off'}`} key={it.id}>
            <div className="pfa-shot">
              {id
                ? <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="" />
                : <div className="pfa-noshot">нема відео</div>}
            </div>

            <div className="pfa-fields">
              <label>Посилання на YouTube
                <input value={it.yt} autoFocus={!it.yt && !it.title}
                  onChange={(e) => { patch(i, { yt: e.target.value }); }}
                  onBlur={(e) => pullMeta(i, e.target.value)}
                  onPaste={(e) => { const v = e.clipboardData.getData('text'); setTimeout(() => pullMeta(i, v), 0); }}
                  placeholder="Вставте посилання — решта заповниться сама" />
                {it.yt && !id && <span className="pfa-warn">Не бачу відео в цьому посиланні</span>}
                {loading === i && <span className="pfa-hint">Читаю відео…</span>}
              </label>

              <label>Назва роботи
                <input value={it.title} onChange={(e) => patch(i, { title: e.target.value })}
                  placeholder="підтягнеться з YouTube" />
              </label>

              <div className="pfa-row2">
                <label>Формат
                  <input value={it.cat} onChange={(e) => patch(i, { cat: e.target.value })} placeholder="Шоу" />
                </label>
                <label>Канал
                  <input value={it.channel} onChange={(e) => patch(i, { channel: e.target.value })} placeholder="підтягнеться з YouTube" />
                </label>
              </div>
            </div>

            <div className="pfa-actions">
              <button onClick={() => patch(i, { visible: !it.visible })} title={it.visible ? 'Сховати з сайту' : 'Показати на сайті'}>
                {it.visible ? 'Показується' : 'Схована'}
              </button>
              <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Вище">↑</button>
              <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Нижче">↓</button>
              <button className="pfa-del" onClick={() => remove(i)}>Видалити</button>
            </div>
          </div>
        );
      })}

      {items.length > 0 && (
        <div className="pfa-foot">
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Зберігаю…' : 'Зберегти'}</button>
        </div>
      )}
    </div>
  );
}
