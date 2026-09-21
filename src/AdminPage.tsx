import { useEffect, useState } from 'react';
import { Brand } from './App';
import AdminPortfolio from './AdminPortfolio';
import { useSeo, PAGE_SEO } from './seo';

// /admin — заявки з сайту для Олега. Ключ зберігається в localStorage після першого входу.
type Lead = {
  id: string;
  created_at: string;
  name: string;
  contact: string;
  types: string | null;
  service: string | null;
  data: Record<string, string> | null;
  status: 'new' | 'in_progress' | 'done';
};

const STATUS_LABEL: Record<Lead['status'], string> = {
  new: 'Нова',
  in_progress: 'В роботі',
  done: 'Закрита',
};
const NEXT_STATUS: Record<Lead['status'], Lead['status']> = {
  new: 'in_progress',
  in_progress: 'done',
  done: 'new',
};

export default function AdminPage() {
  useSeo(PAGE_SEO.admin);
  const [key, setKey] = useState(() => localStorage.getItem('tereveni-admin-key') || '');
  const [input, setInput] = useState('');
  const [rows, setRows] = useState<Lead[] | null>(null);
  const [err, setErr] = useState('');

  // Пароль їде в HTTP-заголовку — кирилиця/пробіли туди не влазять і кидають виняток
  const ASCII = /^[\x21-\x7E]+$/;

  const load = async (k: string) => {
    setErr('');
    if (!ASCII.test(k)) {
      localStorage.removeItem('tereveni-admin-key');
      setKey(''); setRows(null); setErr('Пароль має бути з латинських літер, цифр і символів');
      return;
    }
    try {
      const r = await fetch('/api/leads', { headers: { 'x-admin-key': k } });
      if (r.status === 401) {
        localStorage.removeItem('tereveni-admin-key');
        setKey(''); setRows(null); setErr('Невірний пароль');
        return;
      }
      // QA 01.08: помилку бази не можна показувати як «заявок немає» —
      // власник вирішить, що сайт не працює
      if (!r.ok) { setErr('Не вдалося завантажити заявки. Оновіть сторінку.'); setRows(null); return; }
      const j = await r.json();
      setRows(j.rows || []);
    } catch {
      setErr('Не вдалося звʼязатися з сервером. Спробуйте ще раз.');
    }
  };

  useEffect(() => { if (key) load(key); }, [key]);

  // QA 01.08: оптимістичні зміни відкочуємо, якщо сервер не підтвердив
  const setStatus = async (id: string, status: Lead['status']) => {
    const prev = rows;
    setErr('');
    setRows((p) => p && p.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      const r = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ id, status }),
      });
      if (!r.ok) throw new Error();
    } catch {
      setRows(prev); setErr('Не вдалося зберегти статус. Спробуйте ще раз.');
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Видалити заявку назавжди?')) return;
    const prev = rows;
    setErr('');
    setRows((p) => p && p.filter((l) => l.id !== id));
    try {
      const r = await fetch('/api/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ id }),
      });
      if (!r.ok) throw new Error();
    } catch {
      setRows(prev); setErr('Не вдалося видалити. Спробуйте ще раз.');
    }
  };

  const [tab, setTab] = useState<'leads' | 'portfolio'>('leads');
  const [copied, setCopied] = useState<string | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg('');
    if (!ASCII.test(newPw.trim())) { setPwMsg('Лише латинські літери, цифри та символи — без кирилиці й пробілів'); return; }
    // 12.08: тут не було try/catch — при обриві мережі fetch падав реджектом,
    // повідомлення не показувалось, і форма просто мовчала на натискання.
    let r: Response;
    try {
      r = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ action: 'change_password', next: newPw }),
      });
    } catch {
      setPwMsg('Не вдалося звʼязатися з сервером. Спробуйте ще раз.');
      return;
    }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setPwMsg(j.error || 'Помилка'); return; }
    localStorage.setItem('tereveni-admin-key', newPw.trim());
    setKey(newPw.trim());
    setNewPw(''); setPwOpen(false);
    window.alert('Пароль змінено. Новий пароль діє одразу — збережіть його.');
  };

  if (!key) {
    return (
      <div className="adm adm-login">
        <form className="adm-login-card" onSubmit={(e) => { e.preventDefault(); localStorage.setItem('tereveni-admin-key', input.trim()); setKey(input.trim()); }}>
          <Brand h={22} />
          <h1>Заявки з сайту</h1>
          <input type="password" placeholder="Пароль" value={input} onChange={(e) => setInput(e.target.value)} autoFocus />
          {err && <div className="adm-err">{err}</div>}
          <button className="btn btn-primary" type="submit">Увійти</button>
        </form>
      </div>
    );
  }

  const fresh = rows ? rows.filter((r) => r.status === 'new').length : 0;

  return (
    <div className="adm">
      <header className="adm-head">
        <Brand h={22} />
        <div className="adm-tabs">
          <button className={tab === 'leads' ? 'on' : ''} onClick={() => setTab('leads')}>Заявки</button>
          <button className={tab === 'portfolio' ? 'on' : ''} onClick={() => setTab('portfolio')}>Портфоліо</button>
        </div>
        <div className="adm-head-r">
          <span className="adm-count">{tab === 'leads' ? (rows ? `${rows.length} заявок · ${fresh} нових` : 'Завантаження…') : 'Роботи на сайті'}</span>
          <button className="adm-exit" onClick={() => { setPwOpen((o) => !o); setPwMsg(''); }}>Пароль</button>
          <button className="adm-exit" onClick={() => { localStorage.removeItem('tereveni-admin-key'); setKey(''); }}>Вийти</button>
        </div>
      </header>

      {pwOpen && (
        <form className="adm-pw" onSubmit={changePw}>
          <input type="password" placeholder="Новий пароль — латиниця, від 8 символів" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoFocus />
          <button className="btn btn-primary" type="submit">Змінити</button>
          {pwMsg && <div className="adm-err">{pwMsg}</div>}
        </form>
      )}

      {tab === 'portfolio' && <AdminPortfolio adminKey={key} />}

      {tab === 'leads' && <>
      {err && <div className="adm-err" style={{ marginBottom: 14 }}>{err}</div>}
      {rows && rows.length === 0 && (
        <div className="adm-empty">Заявок поки немає. Коли хтось заповнить форму на сайті — вона зʼявиться тут, а в Telegram прилетить сповіщення.</div>
      )}

      <div className="adm-list">
        {rows && rows.map((l) => (
          <div key={l.id} className={`adm-card st-${l.status}`}>
            <div className="adm-card-top">
              <div>
                <div className="adm-name">{l.name}</div>
                {/* 12.08: копіювання контакту — щоб не виділяти номер вручну перед дзвінком */}
                <div className="adm-contact">
                  <span>{l.contact}</span>
                  <button
                    type="button"
                    className={`adm-copy ${copied === l.id ? 'ok' : ''}`}
                    title="Скопіювати"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(l.contact);
                      } catch {
                        // Safari/старі браузери без Clipboard API
                        const ta = document.createElement('textarea');
                        ta.value = l.contact; document.body.appendChild(ta); ta.select();
                        document.execCommand('copy'); ta.remove();
                      }
                      setCopied(l.id);
                      window.setTimeout(() => setCopied((c) => (c === l.id ? null : c)), 1600);
                    }}
                  >{copied === l.id ? 'скопійовано' : 'копіювати'}</button>
                </div>
              </div>
              <button className={`adm-status st-${l.status}`} title="Клік — змінити статус"
                onClick={() => setStatus(l.id, NEXT_STATUS[l.status])}>{STATUS_LABEL[l.status]}</button>
            </div>
            {l.service && <div className="adm-service">💰 Запит розрахунку · {l.service}</div>}
            {l.data && (
              <div className="adm-answers">
                {Object.entries(l.data).map(([q, a]) => (
                  <div key={q}><span>{q}</span><b>{a}</b></div>
                ))}
              </div>
            )}
            {l.types && <div className="adm-types">{l.types.split(', ').map((t) => <span key={t}>{t}</span>)}</div>}
            <div className="adm-card-bot">
              {/* 12.08: рік показуємо лише для торішніх заявок — інакше «12 серпня»
                  з різних років виглядає однаково і плутає в архіві */}
              <span className="adm-date">{new Date(l.created_at).toLocaleString('uk-UA', {
                day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                ...(new Date(l.created_at).getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}),
              })}</span>
              <button className="adm-del" onClick={() => remove(l.id)}>Видалити</button>
            </div>
          </div>
        ))}
      </div>
      </>}
    </div>
  );
}
