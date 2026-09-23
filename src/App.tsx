import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import LocGallery from './LocGallery';
import QuizModal from './QuizModal';
import { MaskTitle, ParallaxBg } from './Motion';
import { checkContact } from './validate';
import { useWorks, ytThumb, type Work } from './works';
import { STUDIO_ADDRESS, STUDIO_MAPS_URL } from './studio';
import { useSeo, PAGE_SEO } from './seo';

/* ---------- helpers ---------- */
export function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inv, setInv] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInv(true); o.disconnect(); } }, { threshold: 0.15 });
    o.observe(el); return () => o.disconnect();
  }, []);
  return <div ref={ref} className={`rv ${inv ? 'in' : ''} ${className}`} style={{ transitionDelay: `${delay}s` }}>{children}</div>;
}

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now(), dur = 1700;
        const tick = (t: number) => { const p = Math.min(1, (t - t0) / dur); setV(Math.round((1 - Math.pow(1 - p, 3)) * to)); if (p < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    o.observe(el); return () => o.disconnect();
  }, [to]);
  return <span ref={ref}>{v}{suffix}</span>;
}

const Play = ({ s = 20 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);

const ICONS: Record<string, React.ReactNode> = {
  cycle: <><path d="M17 2l4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></>,
  trend: <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>,
  aperture: <><circle cx="12" cy="12" r="10" /><line x1="14.31" y1="8" x2="20.05" y2="17.94" /><line x1="9.69" y1="8" x2="21.17" y2="8" /><line x1="7.38" y1="12" x2="13.12" y2="2.06" /><line x1="9.69" y1="16" x2="3.95" y2="6.06" /><line x1="14.31" y1="16" x2="2.83" y2="16" /><line x1="16.62" y1="12" x2="10.88" y2="21.94" /></>,
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  sparkles: <><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" /></>,
  pin: <><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  ytplay: <><rect x="2" y="5" width="20" height="14" rx="4.5" /><path d="M10.5 8.7v6.6l5.2-3.3z" /></>,
  cam: <><path d="M22 8l-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" /></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />,
  clap: <><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" /><path d="m6.2 5.3 3.1 3.9" /><path d="m12.4 3.4 3.1 4" /><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /></>,
  mic: <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></>,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />,
};
export const Ico = ({ k, s = 20 }: { k: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">{ICONS[k]}</svg>
);


// Єдине меню для всіх сторінок (Олег, 4 серп): Про нас · Ціни · Ютюб під ключ · Локації · Роботи.
// Один список на весь сайт — інакше після кожного перенесення блоку десь лишаються биті якорі
// (так уже сталось із /#audience і /#why, коли ці секції поїхали на «Про нас»).
// href абсолютні, тому працюють і з підсторінок.
export const NAV_LINKS = [
  { t: 'Про нас', h: '/pro-nas' },
  { t: 'Ціни', h: '/#services' },
  { t: 'Ютюб під ключ', h: '/service/production' },
  { t: 'Локації', h: '/#locations' },
  { t: 'Роботи', h: '/portfolio' },
];
export const NavLinks = () => (
  <div className="nav-links">
    {NAV_LINKS.map((l) => <a key={l.h} href={l.h}>{l.t}</a>)}
  </div>
);

// Горизонтальний лок-ап (зібраний з оригінальних літерформ бренд-SVG) + підпис «студія»
export const Brand = ({ h = 26 }: { h?: number }) => (
  <span className="brand">
    <img className="brand-logo" src="/logo-horizontal.svg" alt="ТЕРЕВЕНІ" style={{ height: h }} />
    <i className="brand-sub">студія</i>
  </span>
);

// Календар бронювання Олега (cal.com) — «Забронювати» веде сюди, нова вкладка
const BOOKING_URL = 'https://cal.com/tereveni-studio-ydalq2/%D0%B1%D1%80%D0%BE%D0%BD%D1%8E%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F-%D1%81%D1%82%D1%83%D0%B4%D1%96%D1%96-%D1%82%D0%B5%D1%80%D0%B5%D0%B2%D0%B5%D0%BD%D1%96';
const bookProps = { href: BOOKING_URL, target: '_blank' as const, rel: 'noreferrer' };

// Контакти для дропдауна «Зв'язатися» (референс Олега, 29.07); 3D-іконки з бібліотеки
const CONTACTS = [
  { k: 'TG', t: 'Telegram', v: 't.me/tereveni_studio', href: 'https://t.me/tereveni_studio', ico: '/3d/telegram.webp' },
  { k: 'IG', t: 'Instagram', v: '@tereveni_studio', href: 'https://instagram.com/tereveni_studio', ico: '/3d/instagram.webp' },
  { k: 'PH', t: 'Зателефонувати', v: '+38 093 882 46 49', href: 'tel:+380938824649', ico: '/3d/phone-call.webp' },
];

/* ---------- data ---------- */
// Продуктова лінійка (узгоджено з Олегом 29.07): студія → виїзд → трансляції.
// Під «Зйомкою на студії» формати йдуть чіпсами, а не описом.
const SERVICES = [
  { n: '02', slug: 'studio', t: 'Зйомка на студії', d: 'Приходите з ідеєю — виходите з готовим матеріалом. Світло, звук, мультикамера й монтаж уже на місці.', tags: ['подкаст', 'інтервʼю', 'YouTube-шоу', 'експертний контент'], ico: '/icon-mic.webp', calc: null },
  { n: '03', slug: 'outdoor', t: 'Зйомка на виїзді', d: 'Знімаємо там, де ваш бізнес: офіс, виробництво, захід. Привозимо світло, звук і команду.', tags: ['репортаж', 'івент', 'промо', 'на локації'], ico: '/icon-play.webp', calc: 'Виїзна зйомка' },
  { n: '04', slug: 'live', t: 'Онлайн-трансляції', d: 'Прямі ефіри без збоїв: мультикамера, режисура, вивід на YouTube і соцмережі одночасно.', tags: ['мультикам', 'режисура', 'стрім'], ico: '/icon-clap.webp', calc: 'Онлайн-трансляція' },
];

// Роботи тепер у works.ts: список у базі (Олег керує з /admin) + вбудований запасний.

const PROCESS = [
  { n: '01', t: 'Ідея та сценарій', d: 'Розбираємо ціль, аудиторію й формат. Пакуємо ідею в сценарій, який працює на перегляди.' },
  { n: '02', t: 'Зйомка в студії', d: 'Мультикамера, кіно-світло, чистий звук. Комфортна атмосфера, у якій ви — у своїй тарілці.' },
  { n: '03', t: 'Монтаж і публікація', d: 'Динамічний монтаж, графіка, обкладинки. Пакуємо під кожну платформу й публікуємо в строк.' },
  { n: '04', t: 'Просування і ріст', d: 'Читаємо аналітику й підсилюємо те, що працює. Канал росте, а не просто виходить черговий випуск.' },
];

export const WHY = [
  { t: 'Від вас — лише ідея', d: 'Команда, обладнання й локація в центрі Києва вже готові — вам не треба нічого організовувати.', ic: 'zap' },
  { t: 'Один день — готовий випуск', d: 'Приходите, знімаєте — і забираєте контент, нарізаний під усі платформи.', ic: 'clock' },
  { t: 'Повний цикл в одних руках', d: 'Стратегія, зйомка, монтаж і аналітика росту — все в одній команді.', ic: 'cycle' },
  { t: 'Статус експерта ринку', d: 'Канал будує вашу впізнаваність і приводить вхідні заявки від тих, хто вже вам довіряє.', ic: 'trend' },
];

export const AUDIENCE = [
  { tag: 'Головний напрям', t: 'Бізнес та експерти', d: 'Канал під ключ як інвестиція, що окупається. Контент, який працює на впізнаваність, довіру і продажі — а ми ведемо його на результат.', items: ['Канал працює на впізнаваність і продажі', 'Регулярний контент без вашого часу', 'Прозора аналітика і ріст'], feat: true, blue: false },
  { tag: 'Шоу', t: 'Розважальні проєкти', d: 'Коміки, спорт, ток-шоу, великі формати. Знімаємо контент, що збирає перегляди і заробляє на рекламі.', items: ['Масштаб і живий драйв у кадрі', 'Формат, що збирає перегляди', 'Заробіток на рекламі й охопленнях'], feat: false, blue: true },
];

/* ---------- image / video lightbox ---------- */
function Lightbox({ img, onClose }: { img: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <motion.div className="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}>
      <button className="lb-x" onClick={onClose} aria-label="Закрити">×</button>
      <motion.div className="lb-inner" initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} onClick={(e) => e.stopPropagation()}>
        <img src={img} alt="" />
        <div className="lb-note"><span className="rec" /> Кадр зі знімального дня</div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- contact request form ---------- */
// Формати — чіпсами замість текстового поля (простіше клієнту, зрозуміліше нам). Не обовʼязково.
const FORM_TYPES = ['Подкаст', 'YouTube-шоу', 'Канал під ключ', 'Інтервʼю', 'Онлайн-трансляція', 'Виїзна зйомка', 'Ще не визначився'];


export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const toggleType = (t: string) => setTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  // предвибір формату з кнопки «Розрахувати» на картці послуги
  useEffect(() => {
    const on = (e: Event) => {
      const t = (e as CustomEvent).detail as string;
      if (t) setTypes((p) => (p.includes(t) ? p : [...p, t]));
    };
    window.addEventListener('tereveni-preselect', on);
    return () => window.removeEventListener('tereveni-preselect', on);
  }, []);
  const [err, setErr] = useState('');
  // honeypot: боти заповнюють приховане поле, люди — ні
  const [hp, setHp] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    // 12.08: без перевірки в заявку падало «38050505050505» — менеджер не міг додзвонитись
    const chk = checkContact(contact);
    if (!chk.ok) { setErr(chk.error || 'Перевірте контакт'); return; }
    setBusy(true);
    setErr('');
    try {
      // QA 01.08: НЕ показуємо «Дякуємо», якщо лід не зберігся — інакше тихо втрачаємо клієнтів
      const r = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact: chk.value, types, hp }),
      });
      if (!r.ok) throw new Error(String(r.status));
      setSent(true);
    } catch {
      setErr('Не вдалося надіслати. Спробуйте ще раз або напишіть у Telegram — відповімо там.');
      setBusy(false);
    }
  };
  if (sent) return (
    <div className="cform cform-done">
      <div className="cform-check">✓</div>
      <h3>Дякуємо!</h3>
      <p>Отримали ваш запит — звʼяжемось найближчим часом і безкоштовно розберемо формат.</p>
    </div>
  );
  return (
    <form id="cform" className="cform" onSubmit={submit}>
      <div className="cform-t">Обговорити проєкт</div>
      <label>Імʼя<input required type="text" placeholder="Як до вас звертатись" value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label>Telegram або телефон<input required type="text" placeholder="@нік або +380…" value={contact} onChange={(e) => setContact(e.target.value)} /></label>
      <div className="cform-types">
        <span className="cform-types-lbl">Що плануєте зняти? <em>за бажанням</em></span>
        <div className="cform-chips">
          {FORM_TYPES.map((t) => (
            <button type="button" key={t} onClick={() => toggleType(t)}
              className={`cform-chip ${types.includes(t) ? 'on' : ''}`}>{t}</button>
          ))}
        </div>
      </div>
      <input className="hp-field" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} />
      <button type="submit" disabled={busy} className="btn btn-primary cform-btn"><span className="dot" /> {busy ? 'Надсилаємо…' : 'Надіслати'}</button>
      {err && <div className="cform-err">{err} <a href="https://t.me/tereveni_studio" target="_blank" rel="noreferrer">Написати в Telegram →</a></div>}
      <div className="cform-note">Передзвонимо або напишемо у зручний вам месенджер. Без спаму.</div>
    </form>
  );
}

/* ---------- sticky bottom CTA bar ---------- */
export function StickyCTA() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  // QA 01.08: смуга ховається, коли секція контактів у вьюпорті — інакше вона накривала
  // кнопку «Надіслати заявку» і зʼїдала кліки по полях форми (магічні 280px не рятували
  // через високий футер). Тепер орієнтир — сама секція, а не низ документа.
  // 5 серп: те саме правило поширено на #locations — смуга накривала нижній ряд кнопок
  // локацій. Орієнтир один: ховаємось над секціями, які мають власні керуючі елементи
  // внизу, бо там наша кнопка не додає шляху, а лише заважає.
  const [contactVisible, setContactVisible] = useState(false);
  useEffect(() => {
    const els = ['contact', 'locations']
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const seen = new Map<Element, boolean>();
    const o = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target, e.isIntersecting));
      setContactVisible([...seen.values()].some(Boolean));
    }, { rootMargin: '0px 0px -10% 0px' });
    els.forEach((el) => o.observe(el));
    return () => o.disconnect();
  }, []);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY, vh = window.innerHeight;
      const nearBottom = document.body.scrollHeight - (y + vh) < 280;
      setShow(y > vh * 0.9 && !nearBottom);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const visible = show && !contactVisible;
  if (dismissed) return null;
  return (
    <div className={`sticky-cta ${visible ? 'in' : ''}`} aria-hidden={!visible}>
      <div className="sc-in">
        <div className="sc-msg"><span className="sc-dot" /> <span className="sc-msg-long">Отримайте безкоштовну консультацію — <b>без зобовʼязань</b></span></div>
        <div className="sc-actions">
          <a href="#contact" className="btn btn-primary sc-btn"><span className="dot" /> Обговорити проєкт</a>
          <button className="sc-x" onClick={() => setDismissed(true)} aria-label="Закрити">×</button>
        </div>
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-top">
          <div className="foot-brand">
            <a href="/" aria-label="ТЕРЕВЕНІ"><Brand /></a>
            <p>Подкаст-студія та продакшн у Києві. Робимо контент, який дивляться — від ідеї до просування.</p>
            <div className="foot-addr">
              <a className="addr-link" href={STUDIO_MAPS_URL} target="_blank" rel="noreferrer">{STUDIO_ADDRESS}</a>
            </div>
          </div>
          <div className="foot-cols">
            {/* QA 01.08: футер вів на видалені сторінки послуг — тепер актуальна лінійка */}
            <div className="foot-col">
              <h5>Послуги</h5>
              <a href="/#services">YouTube під ключ</a>
              <a href="/#services">Зйомка на студії</a>
              <a href="/#services">Зйомка на виїзді</a>
              <a href="/#services">Онлайн-трансляції</a>
            </div>
            <div className="foot-col">
              <h5>Локації</h5>
              {/* 12.08: були <span> — підсвічувались на ховер, але не клікались.
                  Ведуть на секцію локацій; докрутку барабана до конкретного сектора
                  свідомо не робимо перед запуском — зайвий ризик. Додано RETRO (бракувало). */}
              {['Graphite', 'Brooklyn', 'Modern', 'Retro'].map((loc) => (
                <a key={loc} className="foot-loc" href="/#locations">{loc.toUpperCase()}</a>
              ))}
            </div>
            <div className="foot-col">
              <h5>Контакти</h5>
              {/* 12.08: у видимих CTA — жива людина, у футері — бот студії (рішення Влада) */}
              <a href="https://t.me/tereveni_studio_bot" target="_blank" rel="noreferrer">Telegram</a>
              <a href="https://instagram.com/tereveni_studio" target="_blank" rel="noreferrer">Instagram</a>
              {/* 12.08: було /#contact — з внутрішніх сторінок кидало на головну.
                  Форма тепер на кожній сторінці й скрізь має id="cform". */}
              <a href="#cform">Обговорити проєкт</a>
            </div>
          </div>
        </div>
        <div className="foot-bot">
          <span>© 2026 ТЕРЕВЕНІ · Київ</span>
          <button className="foot-up" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Нагору ↑</button>
        </div>
      </div>
    </footer>
  );
}


export default function App() {
  // Лоадер-хлопушку прибрано на прохання клієнта (29.07) — сайт відкривається одразу
  useSeo(PAGE_SEO.home);

  const works = useWorks();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [videoCase, setVideoCase] = useState<Work | null>(null);
  // Квіз «Розрахувати вартість»; діплінк для реклами: /?calc=studio|production|outdoor|live
  const [quiz, setQuiz] = useState<string | null>(() => {
    const c = new URLSearchParams(window.location.search).get('calc');
    return c && ['production', 'studio', 'outdoor', 'live'].includes(c) ? c : null;
  });

  useEffect(() => {
    if (!videoCase) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setVideoCase(null); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [videoCase]);

  // Відео-герой. Який файл вантажити — вирішує сам браузер через media на <source>,
  // тому JS для вибору не потрібен, а <video> існує вже в першому рендері.
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = heroVideoRef.current;
    if (!v) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { v.pause(); return; }
    // muted має бути саме АТРИБУТОМ: React ставить лише властивість, а iOS без атрибута
    // блокує автозапуск і чекає тапу. Плюс повторні спроби, коли даних ще бракує.
    v.muted = true;
    v.setAttribute('muted', '');
    const go = () => { v.play().catch(() => {}); };
    go();
    v.addEventListener('canplay', go, { once: true });
    v.addEventListener('loadeddata', go, { once: true });
    return () => { v.removeEventListener('canplay', go); v.removeEventListener('loadeddata', go); };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll); return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!menu) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [menu]);
  // 3D pointer tilt + cursor glow on cards (desktop only)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) return;
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.svc, .aud, .why, .utp, .folio'));
    const cleanups: Array<() => void> = [];
    cards.forEach((el) => {
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', `${(px - 0.5) * 10}deg`);
        el.style.setProperty('--rx', `${-(py - 0.5) * 10}deg`);
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
      };
      const leave = () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', leave);
      cleanups.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); });
    });
    return () => cleanups.forEach((c) => c());
  }, []);

  // Реальні клієнти студії (список від Олега, 29.07; лого — 4-5 серп).
  // Лого ставимо там, де є чистий файл із прозорим фоном; решта лишається текстом —
  // у стрічці мікс читається нормально, а криве лого псує весь ряд.
  // h — висота під кожне лого окремо: у логотипів різні пропорції, спільна висота
  // робить одні велетнями, інші крихтами. Підібрано на око по вазі в ряду.
  // keep: Азов не можна заливати фільтром (літери вирізані в шевроні), він уже підготовлений.
  const marqItems: { t: string; img?: string; h?: number; keep?: boolean }[] = [
    { t: 'ПРИВАТБАНК', img: '/clients/privatbank.png', h: 28 },
    { t: 'METRO', img: '/clients/metro.png', h: 24 },
    { t: 'TAVR MEDIA', img: '/clients/tavr.png', h: 22 },
    { t: 'АГРОМАТ', img: '/clients/agromat.svg', h: 21 },
    { t: 'Poster', img: '/clients/poster.png', h: 22 },
    { t: 'MAUDAU', img: '/clients/maudau.png', h: 23 },
    { t: 'ДІЯ СІТІ ЮНАЙТЕД', img: '/clients/diiacity.svg', h: 26 },
    { t: 'АЗОВ', img: '/clients/azov.svg', h: 50, keep: true },
    { t: 'ТРЕТІЙ АРМІЙСЬКИЙ КОРПУС', img: '/clients/ab3.svg', h: 38 },
    { t: 'Carat', img: '/clients/carat.png', h: 20 },
    { t: 'ВЕТЕРАН ХАБ', img: '/clients/veteranhub.svg', h: 42 },
  ];

  return (
    <>
      {lightbox && <Lightbox img={lightbox} onClose={() => setLightbox(null)} />}

      {quiz && <QuizModal slug={quiz} onClose={() => setQuiz(null)} />}

      {/* Модалка-кейс: відео грає одразу + чіпси каналу + цифри (узгоджено 30.07) */}
      {videoCase && (
        <div className="vmodal-backdrop" onClick={() => setVideoCase(null)}>
          <div className="vmodal" role="dialog" aria-label={videoCase.ch} onClick={(e) => e.stopPropagation()}>
            <button className="vmodal-x" onClick={() => setVideoCase(null)} aria-label="Закрити">×</button>
            <div className="vmodal-video">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoCase.yt}?autoplay=1&playsinline=1&rel=0`}
                title={videoCase.ch}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="vmodal-body">
              <div className="vmodal-head">
                <div className="vmodal-title">{videoCase.ch}</div>
                <div className="vmodal-chips">
                  <span>{videoCase.cat}</span>
                  <span className="loc">{videoCase.loc}</span>
                </div>
              </div>
              <div className="vmodal-stats">
                {videoCase.stats.map((s) => (
                  <div key={s.l} className="vstat"><b>{s.v}</b><i>{s.l}</i></div>
                ))}
              </div>
              <div className="vmodal-cta">
                <span>Хочете такі самі цифри?</span>
                <a href="#contact" className="btn btn-primary" onClick={() => setVideoCase(null)}>Обговорити проєкт</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="wrap nav-in">
          <a href="#top" aria-label="ТЕРЕВЕНІ"><Brand /></a>
          <NavLinks />
          <div className="nav-actions">
            <div className="cdrop-wrap">
              <button className={`btn btn-ghost nav-cta ${contactOpen ? 'on' : ''}`} onClick={() => setContactOpen((o) => !o)}>Зв'язатися</button>
              {contactOpen && (
                <>
                  <div className="cdrop-overlay" onClick={() => setContactOpen(false)} />
                  <div className="cdrop">
                    {CONTACTS.map((c) => (
                      <a key={c.k} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" onClick={() => setContactOpen(false)}>
                        <img className="cdrop-ico3d" src={c.ico} alt="" width={38} height={38} />
                        <span><span className="cdrop-t">{c.t}</span><span className="cdrop-v">{c.v}</span></span>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* «Забронювати» з шапки прибрано (Влад 5.08): дублювало кнопку в героєві,
                два однакові оранжеві CTA на першому екрані розмивали фокус. */}
            <button className="burger" onClick={() => setMenu(true)} aria-label="Меню" aria-expanded={menu} aria-controls="mobile-menu"><span /><span /><span /></button>
          </div>
        </div>
      </nav>

      {/* Мобільне меню: рядки на всю ширину з розділювальними рисками, усе по лівому краю.
          Нумерація 01…05 перегукується з нумерацією послуг на сайті. Рядки заїжджають
          по черзі — затримка лише на відкритті, щоб закриття лишалось миттєвим. */}
      <div id="mobile-menu" className={`mobile-menu ${menu ? 'open' : ''}`}>
        <div className="mm-head">
          <a href="#top" onClick={() => setMenu(false)} aria-label="ТЕРЕВЕНІ"><Brand h={24} /></a>
          <button className="mm-close" aria-label="Закрити меню" onClick={() => setMenu(false)}>×</button>
        </div>

        <nav className="mm-nav">
          {NAV_LINKS.map((l, i) => (
            <a key={l.h} href={l.h} onClick={() => setMenu(false)}
              style={{ transitionDelay: menu ? `${0.08 + i * 0.05}s` : '0s' }}>
              <span className="mm-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="mm-t">{l.t}</span>
              <span className="mm-ar" aria-hidden="true">→</span>
            </a>
          ))}
        </nav>

        <div className="mm-foot">
          <a {...bookProps} onClick={() => setMenu(false)} className="btn btn-primary mm-book">Забронювати студію</a>
          <div className="mm-contacts">
            {CONTACTS.map((c) => (
              <a key={c.k} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" onClick={() => setMenu(false)}>
                <img className="cdrop-ico3d" src={c.ico} alt="" width={22} height={22} />
                <span className="mm-ct">{c.t}</span>
              </a>
            ))}
          </div>
          <div className="mm-addr">
            <a className="addr-link" href={STUDIO_MAPS_URL} target="_blank" rel="noreferrer" onClick={() => setMenu(false)}>Бульварно-Кудрявська 22 · Київ</a>
          </div>
        </div>
      </div>

      {/* HERO — відео-бумеранг: студія → сцена → студія. Петля безшовна, бо зворотний
          прохід дзеркалить прямий, тому стик не видно і зациклювати можна нескінченно. */}
      <header className="hero vhero" id="top">
        {/* Відео стоїть у розмітці ЗАВЖДИ, а не зʼявляється після монтування:
            Safari вирішує щодо автоплею за станом елемента в момент створення, і динамічно
            вставлений <video> у нього просив тап. Який файл вантажити — обирає сам браузер
            через media на <source>, тому JS тут не потрібен узагалі. */}
        <video ref={heroVideoRef} className="hero-bg vhero-media" poster="/hero-loop-poster.jpg"
          autoPlay muted loop playsInline preload="auto" aria-hidden="true">
          <source src="/hero-loop-sm.mp4" media="(max-width: 860px)" type="video/mp4" />
          <source src="/hero-loop.mp4" type="video/mp4" />
        </video>
        <div className="vhero-scrim" />
        <div className="wrap hero-in vhero-in">
          <motion.div className="vhero-copy" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}>
            {/* h1 несе ключ «подкаст-студія у Києві»; візуально це той самий дрібний рядок над гаслом */}
            <h1><span className="hero-rec"><span className="rec" /> Подкаст-студія у Києві · продакшн</span>
              Робимо контент,<br />який <span className="box">дивляться</span></h1>
          </motion.div>
          <motion.div className="hero-actions" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}>
            <a {...bookProps} className="btn btn-primary btn-lg"><span className="dot" /> Забронювати студію</a>
            <a href="#contact" className="btn btn-ghost btn-lg">Обговорити проєкт</a>
          </motion.div>
        </div>
      </header>

      {/* MARQUEE */}
      <div className="marquee">
        <div className="marquee-tag"><span className="rec" /> НАШІ КЛІЄНТИ</div>
        <div className="marquee-track">
          {[0, 1].map((k) => (
            <span key={k}>
              {marqItems.map((m) => (
                <span key={m.t}>
                  {m.img
                    ? <img className={`marq-lg${m.keep ? ' keep' : ''}`}
                        style={{ '--h': `${m.h ?? 34}px` } as React.CSSProperties}
                        src={m.img} alt={m.t} loading="lazy" decoding="async" />
                    : m.t}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* SERVICES */}
      <section className="section" id="services">
        <div className="wrap">
          <Reveal className="sec-head">
            <div className="eyebrow">Що ми робимо</div>
            <MaskTitle className="sec-title">Повний продакшн<br /><em>під ваш формат</em></MaskTitle>
          </Reveal>

          {/* feature wide card. Посилання «Детальніше» повернуто (Олег, 4 серп):
              «YouTube під ключ» і є продюсування, сторінка під нього вже написана. */}
          <Reveal>
            <div className="svc wide" style={{ marginBottom: 20 }}>
              <div className="svc-body">
                <div className="svc-n">01 · Флагман</div>
                <h3>YouTube під ключ</h3>
                <p>Беремо канал під ключ і ведемо на результат: стратегія, контент-план, регулярні зйомки, монтаж і аналітика росту. Ви робите свою справу — ми робимо з неї шоу, яке дивляться.</p>
                <div className="svc-tags"><span>стратегія</span><span>контент-план</span><span>продакшн</span><span>аналітика</span><span>ріст</span></div>
                <div className="svc-foot">
                  <a href="/service/production" className="svc-calc">Детальніше про послугу →</a>
                </div>
              </div>
              {/* Фото на всю праву половину, до краю картки (Влад 5.08). Кнопку «плей»
                  прибрано: на кадрі студії вона читалась як ютуб-прев'ю, а це не відео. */}
              <div className="svc-visual">
                <img src="/svc-flagship.webp" alt="Знімальний майданчик студії" className="svc-visual-img" />
              </div>
            </div>
          </Reveal>

          {/* Прості послуги без окремих сторінок (Олег не дав фідбеку 3 рази) — вся картка веде у квіз */}
          <div className="svc-grid">
            {SERVICES.map((s, i) => (
              <Reveal key={s.n} delay={(i % 2) * 0.08}>
                {/* 3D-іконки прибрано (Влад 5.08): глянцевий пластик — третя мова поруч
                    із кадром і типографікою, на темному кіно-фоні читався як емодзі. */}
                <div className="svc">
                  <div className="svc-n">{s.n}</div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                  <div className="svc-tags">{s.tags.map((t) => <span key={t}>{t}</span>)}</div>
                  <div className="svc-foot">
                    <button className="svc-calc" onClick={() => setQuiz(s.slug)}>Розрахувати вартість</button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* LOCATIONS — одразу після послуг (фідбек Олега 30.07) */}
      {/* заголовок секції прибрано на прохання Олега (4 серп) — порожній .wrap теж, він давав зайвий відступ */}
      <section className="section locs" id="locations">
        <div className="wrap">
          <Reveal className="sec-head">
            <MaskTitle className="sec-title">Локації</MaskTitle>
            <p className="lead" style={{ marginTop: 18 }}>Підберіть локацію, яка пасує під ваш проєкт.</p>
          </Reveal>
        </div>
        <Reveal delay={0.08}><LocGallery bookUrl={BOOKING_URL} /></Reveal>
      </section>

      {/* PROCESS */}
      <section className="section process-sec" id="process">
        <ParallaxBg className="proc-bg" src="/process-bg.webp" strength={14} />
        <div className="proc-scrim" />
        <div className="wrap">
          <Reveal className="sec-head">
            <div className="eyebrow">Як ми працюємо</div>
            <MaskTitle className="sec-title">Від ідеї<br /><em>до перегляду</em></MaskTitle>
          </Reveal>
          <div className="steps">
            {PROCESS.map((s, i) => (
              <Reveal key={s.n} className="step" delay={i * 0.1}>
                <div className="step-n">{s.n}</div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* VENUE — УТП майданчик (останній блок перед контактами) */}
      <section className="section venue" id="venue">
        <div className="wrap">
          <Reveal className="sec-head center">
            <div className="eyebrow center">Наш майданчик</div>
            <MaskTitle className="sec-title">Простір під <span className="box blue">великі формати</span></MaskTitle>
          </Reveal>
          <div className="utp-grid">
            <Reveal>
              <div className="utp cine">
                <img className="utp-bg" src="/venue-hall.webp" alt="Знімальний зал на 120 місць" loading="lazy" />
                <div className="utp-body">
                  <div className="utp-num"><CountUp to={120} /> <span>місць</span></div>
                  <div className="utp-t">Майданчик під великі формати</div>
                  <p>Зал, що вміщає велику аудиторію — для ток-шоу, стендапу, живих подій, масштабних лекцій і запусків продуктів наживо.</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="utp cine">
                <img className="utp-bg" src="/venue-set.webp" alt="Унікальна локація під шоу" loading="lazy" />
                <div className="utp-body">
                  <div className="utp-t">Унікальна локація під ваш бренд</div>
                  <p>У центрі Києва, з гостьовими парко-місцями. Будуємо простір і декорації під концепцію вашого проєкту — щоб ваш канал мав власне обличчя, а не безликий фон.</p>
                </div>
              </div>
            </Reveal>
          </div>
          <Reveal className="venue-incl">
            <span className="vi-label">Включено у вартість оренди</span>
            <div className="vi-list">
              {['Оператор і звукорежисер', '20+ приладів світла', 'Камери 4K', 'Мікрофони й петлички', 'Телесуфлер', 'Гримерна · чай/кава'].map((x) => <span key={x}>{x}</span>)}
            </div>
          </Reveal>
        </div>
      </section>

      {/* PORTFOLIO — кейси */}
      <section className="section portfolio" id="work">
        <div className="wrap">
          <Reveal className="sec-head">
            {/* Олег: «текст і допоміжний підпис прибрати» — лишається тільки назва */}
            <div className="eyebrow">Портфоліо</div>
            <MaskTitle className="sec-title">Наші <em>роботи</em></MaskTitle>
          </Reveal>
          <div className="folio-grid">
            {works.slice(0, 4).map((f, i) => (
              <Reveal key={i} className={`folio ${f.cls}`} delay={(i % 3) * 0.06}>
                <div className="folio-hit" role="button" tabIndex={0} aria-label={`Дивитись кейс: ${f.ch}`}
                  onClick={() => setVideoCase(f)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setVideoCase(f); } }}>
                  <img className="fo-img" src={ytThumb(f.yt)}
                    onError={(e) => { (e.target as HTMLImageElement).src = f.img; }}
                    alt={f.t} loading="lazy" />
                  <span className="fo-play"><Play s={15} /></span>
                  <div className="fo-cap">
                    <div className="fo-cat">{f.cat}</div>
                    <div className="fo-title">{f.t}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="folio-more">
            <a href="/portfolio" className="btn btn-ghost btn-lg">Усі роботи →</a>
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA / CONTACT */}
      <section className="section final" id="contact">
        <div className="hero-glow" />
        <div className="wrap contact-wrap">
          <Reveal className="contact-info">
            <div className="eyebrow" style={{ marginBottom: 20 }}>Готові почати?</div>
            <h2>Отримайте безкоштовну<br /><span className="box">консультацію</span></h2>
            {/* «Консультація безкоштовна» прибрано з абзацу — тепер це заголовок */}
            <p>Розкажіть про ідею — покажемо, як перетворити її на контент, який дивляться. Без зобовʼязань.</p>
            <ul className="contact-reass">
              <li><span className="cr-dot" /> Відповідаємо протягом дня</li>
              <li><span className="cr-dot" /> 20 хв розбір формату + приклади схожих каналів</li>
              <li><span className="cr-dot" /> Без тиску і продажу в лоб</li>
            </ul>
            <div className="contact-channels">
              <a href="#cform" className="btn btn-primary"><span className="dot" /> Звʼязатись</a>
              <a href="https://t.me/tereveni_studio" target="_blank" rel="noreferrer" className="btn btn-ghost">Написати в Telegram</a>
            </div>
            <div className="contact-meet">
              Або завітайте в студію — <a className="addr-link" href={STUDIO_MAPS_URL} target="_blank" rel="noreferrer">{STUDIO_ADDRESS}</a>
            </div>
          </Reveal>
          <Reveal className="contact-form-wrap" delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      <StickyCTA />

      <SiteFooter />
    </>
  );
}
