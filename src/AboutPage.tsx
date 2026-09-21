import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Reveal, Brand, SiteFooter, Ico, NavLinks, AUDIENCE, WHY, ContactForm } from './App';
import { MaskTitle } from './Motion';
import { STUDIO_ADDRESS, STUDIO_MAPS_URL } from './studio';
import { useSeo, PAGE_SEO } from './seo';

// Сторінка «Про нас» (Олег, 4 серп): сюди винесено два блоки з головної —
// «Для кого» і «За результат відповідаємо ми». Оболонка та сама, що в ServicePage,
// щоб сторінки сайту читались як одна серія.
export default function AboutPage() {
  useSeo(PAGE_SEO.about);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <>
      {/* NAV */}
      <nav className="nav scrolled">
        <div className="wrap nav-in">
          <Link to="/" aria-label="На головну"><Brand /></Link>
          <NavLinks />
          <div className="nav-right">
            <Link to="/" className="sp-nav-home">← Головна</Link>
            <a href="#ab-cta" className="btn btn-primary nav-cta">Обговорити проєкт</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="sp-hero ab-hero">
        {/* фото Влада від 4 серп: неон із назвою в кадрі — бренд одразу на першому екрані */}
        <img className="sp-hero-bg" src="/about-hero.webp" alt="Студія ТЕРЕВЕНІ — неонова вивіска, мікрофони і стіл для запису" />
        <div className="sp-hero-scrim" />
        <div className="hero-glow" />
        <div className="wrap sp-hero-in">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <h1>Про нас</h1>
            {/* без кнопок у героєві — велике СТА стоїть унизу сторінки, тут вони дублювали б його */}
            <p className="sp-tagline">З нами знімають канали, які дивляться сотні тисяч людей. Беремо проєкт під ключ — від сценарію до аналітики росту.</p>
          </motion.div>
        </div>
      </header>

      {/* ЗА РЕЗУЛЬТАТ ВІДПОВІДАЄМО МИ — перенесено з головної */}
      <section className="section why-sec" id="why">
        <div className="why-bgicons" aria-hidden="true">
          <img className="wbi3d w1" src="/3d/videocam.webp" alt="" loading="lazy" />
          <img className="wbi3d w2" src="/3d/bell.webp" alt="" loading="lazy" />
          <img className="wbi3d w3" src="/3d/chart.webp" alt="" loading="lazy" />
          <img className="wbi3d w4" src="/3d/target.webp" alt="" loading="lazy" />
          <img className="wbi3d w5" src="/3d/trophy.webp" alt="" loading="lazy" />
          <img className="wbi3d w6" src="/3d/chat.webp" alt="" loading="lazy" />
          <img className="wbi3d w7" src="/3d/magnifier.webp" alt="" loading="lazy" />
          <img className="wbi3d w8" src="/3d/telegram.webp" alt="" loading="lazy" />
        </div>
        <div className="wrap">
          <Reveal className="sec-head">
            <div className="eyebrow">Чому ТЕРЕВЕНІ</div>
            <MaskTitle className="sec-title">За результат <span className="box">відповідаємо ми</span></MaskTitle>
            <p className="lead why-sub">Ви знімаєтесь — решта наша робота.</p>
          </Reveal>
          <div className="why-split">
            <div className="why-list">
              {WHY.map((w, i) => (
                <Reveal key={i} delay={i * 0.06}>
                  <div className="why">
                    <div className="why-ico"><Ico k={w.ic} s={18} /></div>
                    <div><h4>{w.t}</h4><p>{w.d}</p></div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="why-right" delay={0.08}>
              <div className="why-photo">
                <img src="/why-team.webp" alt="Команда ТЕРЕВЕНІ біля телевізора з шумом" width={1224} height={708} loading="lazy" />
              </div>
              <div className="why-cap">Контент без продакшну · не повторюйте вдома</div>
            </Reveal>
          </div>
          <Reveal className="why-riskrev-wrap">
            <div className="why-riskrev">
              <span className="rr-dot" />
              <p><strong>Почніть із безкоштовної консультації</strong> — без тиску й жодних зобовʼязань.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ДЛЯ КОГО — перенесено з головної */}
      <section className="section" id="audience">
        <div className="wrap">
          <Reveal className="sec-head">
            <div className="eyebrow">Для кого</div>
            <MaskTitle className="sec-title">Працюємо з тими,<br />хто <em>хоче рости</em></MaskTitle>
          </Reveal>
          <div className="aud-grid">
            {AUDIENCE.map((a, i) => (
              <Reveal key={a.t} delay={i * 0.08}>
                <div className={`aud ${a.feat ? 'feat' : ''} ${a.blue ? 'blue' : ''}`}>
                  <span className="aud-tag">{a.tag}</span>
                  <h3>{a.t}</h3>
                  <p>{a.d}</p>
                  <ul>{a.items.map((it) => <li key={it}>{it}</li>)}</ul>
                  {a.feat && <a href="#ab-cta" className="svc-cta">Обговорити канал під ключ →</a>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA — та сама рамка, що на сторінках послуг */}
      <section className="section final sp-cta" id="ab-cta">
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
