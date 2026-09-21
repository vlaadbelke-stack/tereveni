import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Reveal, Brand, SiteFooter, NavLinks, ContactForm } from './App';
import { SERVICE_PAGES } from './services';
import { useSeo, SITE_URL } from './seo';
import { STUDIO_ADDRESS, STUDIO_MAPS_URL } from './studio';

export default function ServicePage() {
  const { slug } = useParams();
  const data = slug ? SERVICE_PAGES[slug] : undefined;

  // Хук мусить викликатись до раннього return нижче — інакше React
  // свариться на різну кількість хуків між рендерами.
  useSeo(data
    /* Превʼю для шеру — окремий JPG 1200×630 у public/og/, не hero-webp:
       фейсбук і частина месенджерів WebP у превʼю не показують. */
    ? { title: data.title, description: data.intro, path: `/service/${data.slug}`, image: `${SITE_URL}/og/${data.slug}.jpg` }
    : { title: 'Послугу не знайдено', description: 'Такої послуги немає.', path: `/service/${slug ?? ''}`, noindex: true });

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);
  // lightweight 3D tilt on detail cards
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.sp-inc'));
    const cleanups: Array<() => void> = [];
    cards.forEach((el) => {
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 9}deg`);
        el.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * 9}deg`);
      };
      const leave = () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); };
      el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
      cleanups.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); });
    });
    return () => cleanups.forEach((c) => c());
  }, [slug]);

  if (!data) return (
    <div className="sp-404">
      <h1>Послугу не знайдено</h1>
      <Link to="/" className="btn btn-primary">На головну</Link>
    </div>
  );


  return (
    <>
      {/* NAV */}
      <nav className="nav scrolled">
        <div className="wrap nav-in">
          <Link to="/" aria-label="На головну"><Brand /></Link>
          <NavLinks />
          <div className="nav-right">
            <Link to="/" className="sp-nav-home">← Головна</Link>
            <a href="#sp-cta" className="btn btn-primary nav-cta">Обговорити проєкт</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="sp-hero">
        <img className="sp-hero-bg" src={data.hero} alt="" />
        <div className="sp-hero-scrim" />
        {/* Оранжеве світіння прибрано (Влад, 5 серп): на реальному кадрі студії воно
            читалось як пляма-засвітка, а не як акцент. У фінальному CTA лишається. */}
        <div className="wrap sp-hero-in">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <h1>{data.title}</h1>
            <p className="sp-tagline">{data.tagline}</p>
          </motion.div>
        </div>
      </header>

      {/* INTRO + INCLUDES */}
      <section className="section">
        <div className="wrap">
          <Reveal><p className="sp-intro">{data.intro}</p></Reveal>
          <Reveal className="sec-head" >
            <div className="eyebrow">Що входить</div>
            <h2 className="sec-title">Усе — <em>в одній студії</em></h2>
          </Reveal>
          <div className="sp-inc-grid">
            {data.includes.map((it, i) => (
              <Reveal key={it.title} delay={(i % 3) * 0.06}>
                <div className={`sp-inc ${it.bg ? 'has-bg' : ''}`}>
                  {it.bg && <img className="sp-inc-bg" src={it.bg} alt="" loading="lazy" decoding="async" />}
                  <div className="sp-inc-n">{String(i + 1).padStart(2, '0')}</div>
                  <h3>{it.title}</h3>
                  <p>{it.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Блок кроків прибрано (Влад, 4 серп): він дублював секцію «Як ми працюємо»
          на головній — та сама структура з чотирьох кроків. Дані data.steps лишились у services.ts. */}
      {/* ПОРІВНЯННЯ «САМОМУ vs З НАМИ» — замість трьох обіцянок.
          Обіцянки пише кожен; тут ми показуємо різницю в часі й зусиллях, яку можна перевірити. */}
      {data.compare ? (
        <section className="section cmp-sec">
          <div className="wrap">
            <Reveal className="sec-head">
              <div className="eyebrow">Порівняйте</div>
              <h2 className="sec-title">Робити самому<br />чи <em>з нами</em></h2>
              <p className="sp-forwhom" style={{ marginTop: 16 }}>{data.forWhom}</p>
            </Reveal>

            <Reveal delay={0.06}>
              <div className="cmp" role="table" aria-label="Порівняння: самостійно чи з ТЕРЕВЕНІ">
                <div className="cmp-row cmp-head" role="row">
                  <div className="cmp-k" role="columnheader" />
                  <div className="cmp-solo" role="columnheader">Самостійно</div>
                  <div className="cmp-us" role="columnheader"><span className="cmp-badge">з ТЕРЕВЕНІ</span></div>
                </div>
                {data.compare.map((c) => (
                  <div className="cmp-row" role="row" key={c.row}>
                    <div className="cmp-k" role="cell">{c.row}</div>
                    <div className="cmp-solo" role="cell"><i className="cmp-x" aria-hidden="true">✕</i><span>{c.solo}</span></div>
                    <div className="cmp-us" role="cell"><i className="cmp-v" aria-hidden="true">✓</i><span>{c.us}</span></div>
                  </div>
                ))}
              </div>
            </Reveal>

          </div>
        </section>
      ) : (
        <section className="section">
          <div className="wrap sp-res-wrap">
            <Reveal className="sp-res-left">
              <div className="eyebrow">Результат</div>
              <h2 className="sec-title">Що ви <em>отримаєте</em></h2>
              <p className="sp-forwhom">{data.forWhom}</p>
            </Reveal>
            <Reveal className="sp-res-list" delay={0.1}>
              <ul>
                {data.results.map((r) => <li key={r}><span className="cr-dot" /> {r}</li>)}
              </ul>
            </Reveal>
          </div>
        </section>
      )}

      {/* Галерею прибрано (Влад, 5 серп): підписи під кадрами переказували те саме,
          що вже сказано в «Що входить» — 4К-камери, монтаж, гримерка, 120 місць.
          Дані data.gallery лишились у services.ts. */}

      {/* FAQ прибрано (Влад, 4 серп): два з трьох питань дублювали блок порівняння —
          «скільки часу це забирає» і «коли буде результат». Дані data.faq лишились у services.ts. */}
      {/* FINAL CTA */}
      <section className="section final sp-cta" id="sp-cta">
        <div className="hero-glow" />
        <div className="wrap">
          <Reveal className="sp-cta-in">
            <div className="eyebrow center" style={{ marginBottom: 22 }}>Готові почати?</div>
            <h2>{data.ctaLine}</h2>
            <p>Консультація безкоштовна, без зобовʼязань. Розкажіть про задачу — підкажемо формат і наступний крок.</p>
            <div className="hero-actions" style={{ justifyContent: 'center' }}>
              <a href="https://t.me/tereveni_studio" target="_blank" rel="noreferrer" className="btn btn-primary"><span className="dot" /> Написати в Telegram</a>
            </div>
            {/* 12.08: тут була кнопка на /#contact — вона викидала людину на головну
                після того, як та дочитала сторінку послуги. Форма тепер на місці. */}
            <div className="inner-cta-form"><ContactForm /></div>
            <div className="contact-meet" style={{ textAlign: 'center', marginTop: 20 }}>
              <a className="addr-link" href={STUDIO_MAPS_URL} target="_blank" rel="noreferrer">{STUDIO_ADDRESS}</a>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
