import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Reveal, Brand, SiteFooter, NavLinks, ContactForm } from './App';
import { useWorks, ytThumb, type Work } from './works';
import { useSeo, PAGE_SEO } from './seo';

const PlayIco = ({ s = 20 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);

// Сторінка портфоліо — «кінозал»: один великий екран і список робіт збоку.
// Причина такого макета не естетика, а те, що плеєр тут фізично один: скільки б робіт
// Олег не додав, сторінка не перетворюється на двадцять важких ютуб-плеєрів.
// І це інструмент показу — Олег відкриває сторінку клієнту й перемикає роботи в розмові.
export default function PortfolioPage() {
  useSeo(PAGE_SEO.portfolio);
  const works = useWorks();
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => { window.scrollTo(0, 0); }, []);
  // Перемкнули роботу — повертаємось до обкладинки: автозапуск зі звуком під час розмови зайвий
  useEffect(() => { setPlaying(false); }, [active]);

  const cur: Work | undefined = works[active];

  // Пошук по назві, каналу й формату. Індекси лишаються від повного списку —
  // інакше після фільтрації клік відкривав би не ту роботу.
  const needle = q.trim().toLowerCase();
  const list = works
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => !needle || (w.t + ' ' + w.ch + ' ' + w.cat).toLowerCase().includes(needle));

  return (
    <>
      <nav className="nav scrolled">
        <div className="wrap nav-in">
          <Link to="/" aria-label="На головну"><Brand /></Link>
          <NavLinks />
          <div className="nav-right">
            <Link to="/" className="sp-nav-home">← Головна</Link>
            <a href="#pf-cta" className="btn btn-primary nav-cta">Обговорити проєкт</a>
          </div>
        </div>
      </nav>

      <header className="pf-top">
        <div className="wrap">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            <div className="eyebrow">Портфоліо</div>
            <h1>Наші роботи</h1>
          </motion.div>
        </div>
      </header>

      <section className="section pf-hall" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="hall">

            <div className="hall-screen">
              <div className="hall-frame">
                {cur && (playing ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${cur.yt}?autoplay=1&playsinline=1&rel=0`}
                    title={cur.t} allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                    allowFullScreen />
                ) : (
                  <button className="hall-poster" onClick={() => setPlaying(true)} aria-label={`Дивитись: ${cur.t}`}>
                    <img src={ytThumb(cur.yt)} onError={(e) => { (e.target as HTMLImageElement).src = cur.img; }} alt={cur.t} />
                    <span className="hall-play"><PlayIco s={26} /></span>
                  </button>
                ))}
              </div>
              <div className="hall-glow" aria-hidden="true" />

              {cur && (
                <div className="hall-meta">
                  <h2>{cur.t}</h2>
                  {cur.ch && <div className="hall-ch">{cur.ch}</div>}
                </div>
              )}
            </div>

            <aside className="hall-list" aria-label="Список робіт">
              <div className="hall-list-h">Усі роботи <span>{works.length}</span></div>
              {works.length > 6 && (
                <div className="hall-search">
                  <input value={q} onChange={(e) => setQ(e.target.value)}
                    placeholder="Пошук за назвою або каналом" aria-label="Пошук по роботах" />
                  {q && <button onClick={() => setQ('')} aria-label="Очистити">×</button>}
                </div>
              )}
              <div className="hall-scroll">
                {list.map(({ w, i }) => (
                  <button key={w.id} className={`hall-item ${i === active ? 'on' : ''}`}
                    onClick={() => setActive(i)} aria-current={i === active}>
                    <span className="hall-thumb">
                      <img src={ytThumb(w.yt)} onError={(e) => { (e.target as HTMLImageElement).src = w.img; }} alt="" loading="lazy" />
                      {i === active && <span className="hall-now" aria-hidden="true" />}
                    </span>
                    <span className="hall-txt">
                      <span className="hall-t">{w.t}</span>
                      <span className="hall-c">{w.cat}{w.ch && ` · ${w.ch}`}</span>
                    </span>
                  </button>
                ))}
                {list.length === 0 && <div className="hall-none">Нічого не знайшлось</div>}
              </div>
            </aside>

          </div>
        </div>
      </section>

      <section className="section final sp-cta" id="pf-cta">
        <div className="hero-glow" />
        <div className="wrap">
          <Reveal className="sp-cta-in">
            <div className="eyebrow center" style={{ marginBottom: 22 }}>Готові почати?</div>
            <h2>Отримайте безкоштовну <span className="box">консультацію</span></h2>
            <p>Розкажіть про ідею — покажемо, як перетворити її на контент, який дивляться. Без зобовʼязань.</p>
            <div className="hero-actions" style={{ justifyContent: 'center' }}>
              <a href="https://t.me/tereveni_studio" target="_blank" rel="noreferrer" className="btn btn-primary"><span className="dot" /> Написати в Telegram</a>
            </div>
            {/* 12.08: замість кнопки на /#contact, що викидала на головну */}
            <div className="inner-cta-form"><ContactForm /></div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
