import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion';

// «Тюнер» локацій (ідея Влада 30.07): один 3D-циліндр, колажі згруповані секторами
// по локаціях; під каруселлю — шкала як у радіо: маркер їде синхронно з обертанням,
// клік по сектору докручує барабан до локації. Сектор «Виїзна» — спец-картка без фото.
type Slide = { img: string; t: string; loc: string };

const G = (slug: string, t: string, loc: string): Slide => ({ img: `/gallery/${slug}.webp`, t, loc });

// Graphite — колажі з впеченим написом «Графіт»; Brooklyn — свої.
// «Кастом» (Влад 5.08) — сюди все, що підписане НАЗВОЮ ШОУ, а не локацією:
// раніше цим добивали Modern, і виходило, що секція локацій розповідала про передачі.
export const GALLERY: Slide[] = [
  G('g-tzboru', 'Точка Збору', 'Graphite'),
  G('g-vzb', 'ВЗБ', 'Graphite'),
  G('g-alias', 'Футбольний Alias', 'Graphite'),
  G('g-ivmed', 'IVMED', 'Graphite'),
  G('g-karat', 'Carat Media', 'Graphite'),
  G('g-aktyvni', 'АкТИвні', 'Graphite'),
  G('g-matvieieva', 'Матвєєва', 'Graphite'),
  G('g-propusk', 'Пропуск', 'Graphite'),
  G('g-ukrlit', 'Укрліт', 'Graphite'),
  G('g-liasy', 'Ляси', 'Graphite'),
  G('b-tseivo', 'ЦЕЙВО подкаст', 'Brooklyn'),
  G('b-2', '', 'Brooklyn'),
  G('b-3', '', 'Brooklyn'),
  G('b-4', '', 'Brooklyn'),
  G('b-5', '', 'Brooklyn'),
  G('b-7', '', 'Brooklyn'),
  G('b-8', '', 'Brooklyn'),
  G('m-1', '', 'Modern'),
  G('m-2', '', 'Modern'),
  G('m-3', '', 'Modern'),
  G('r-1', '', 'Retro'),
  G('r-2', '', 'Retro'),
  G('r-3', '', 'Retro'),
  G('g-tosty', 'Тости', 'Кастом'),
  G('g-poradnytsia', 'Порадниця', 'Кастом'),
  G('g-chysta-pravda', 'Чиста правда', 'Кастом'),
  G('g-rozpakivka', 'Розпаківка', 'Кастом'),
  G('g-mokri', 'Мокрі та смішні', 'Кастом'),
  G('g-moralizator', 'Moralizator', 'Кастом'),
  G('c-moralizator2', 'Moralizator', 'Кастом'),
  G('c-ebaut', 'Ebaut', 'Кастом'),
  G('c-inbitvin', 'Інбітвін', 'Кастом'),
  G('c-poradnytsia2', 'Порадниця', 'Кастом'),
  G('c-poradnytsia3', 'Порадниця', 'Кастом'),
];

// Кнопка сектора рендериться завжди, але неактивна, поки в ньому нуль карток:
// інакше барабан крутився б у нікуди, а сітка «дихала» б при доданні локації.
const SECTOR_ORDER = ['Graphite', 'Brooklyn', 'Modern', 'Retro', 'Кастом'];

export default function LocGallery({ bookUrl }: { bookUrl: string }) {
  const n = GALLERY.length;
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 640px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const on = () => setIsMobile(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // Сектори без лічильників (Влад 31.07). count === 0 → локація ще без фото.
  const sectors = useMemo(() => SECTOR_ORDER.map((loc) => ({
    loc,
    start: GALLERY.findIndex((s) => s.loc === loc),
    count: GALLERY.filter((s) => s.loc === loc).length,
  })), []);
  // Для геометрії барабана порожні сектори не існують
  const filled = useMemo(() => sectors.filter((s) => s.count > 0), [sectors]);

  // РОЗРИВ У КІЛЬЦІ (Влад 31.07): між локаціями порожній слот, тому кільце має
  // більше слотів, ніж карток. slots[i] = позиція картки i на кільці.
  const GAP = 0.45;
  const { slots, totalSlots } = useMemo(() => {
    const arr: number[] = [];
    let slot = 0;
    GALLERY.forEach((s, i) => {
      if (i > 0) slot += s.loc !== GALLERY[i - 1].loc ? 1 + GAP : 1;
      arr.push(slot);
    });
    return { slots: arr, totalSlots: slot + 1 + GAP };
  }, []);

  // Барабан має вміщатись в екран РАЗОМ із кнопками (Влад 5.08). Раніше сцена була
  // 600px намертво, і на ноутбуці кнопки локацій опинялись за межею екрана.
  const [vh, setVh] = useState(() => window.innerHeight);
  useEffect(() => {
    const on = () => setVh(window.innerHeight);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  // Висота сцени — від висоти вікна; решту місця забирають заголовок, кнопки й відступи.
  const stageH = isMobile
    ? Math.min(470, Math.max(300, vh * 0.46))
    : Math.min(618, Math.max(340, vh * 0.66));

  // Геометрія: велика faceWidth + далека perspective = різкі картки.
  // ВАЖЛИВО: видимий розмір картки задає ШИРИНА грані, а не висота сцени — картинка
  // має aspect-ratio 9/16 від ширини, а тоді ще множиться перспективою (×1.385).
  // Тому ширину грані рахуємо назад від тієї висоти, у яку картка мусить влізти,
  // інакше зменшена сцена просто обріже картки знизу.
  const faceAngle = 360 / totalSlots;
  const perFace = Math.round(
    Math.min(isMobile ? 165 : 250, Math.max(120, (stageH * 0.94) / ((16 / 9) * 1.385) + 16)),
  );
  const cylinderWidth = totalSlots * perFace;
  const faceWidth = cylinderWidth / totalSlots;
  const radius = useMemo(() => cylinderWidth / (2 * Math.PI), [cylinderWidth]);

  const rotation = useMotionValue(0);
  const transform = useTransform(rotation, (v) => `rotate3d(0, 1, 0, ${v}deg)`);

  // неперервна позиція на кільці (у слотах) → найближча КАРТКА (порожні слоти пропускаються)
  const slotPos = (v: number) => ((((-v / faceAngle) % totalSlots) + totalSlots) % totalSlots);
  const cardAt = (v: number) => {
    const s = slotPos(v);
    let best = 0, bestD = Infinity;
    slots.forEach((sl, i) => {
      const raw = Math.abs(sl - s);
      const d = Math.min(raw, totalSlots - raw);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  };

  const [idx, setIdx] = useState(0);
  const idxRef = useRef(0);
  useMotionValueEvent(rotation, 'change', (v) => {
    const i = cardAt(v);
    if (i === idxRef.current) return;
    idxRef.current = i;
    setIdx(i);
  });

  // Прогрес усередині активного сектора (0..1) — заливка біжить по самій кнопці
  const localProgress = useTransform(rotation, (v) => {
    const s = slotPos(v);
    const sec = filled.find((x) => s >= slots[x.start] - 0.5 && s < slots[x.start + x.count - 1] + 0.5 + GAP) || filled[filled.length - 1];
    const a = slots[sec.start], b = slots[sec.start + sec.count - 1];
    return Math.min(Math.max((s - a + 0.5) / (b - a + 1), 0), 1);
  });

  const [active, setActive] = useState<Slide | null>(null);
  const [hovered, setHovered] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const [hoverLoc, setHoverLoc] = useState<string | null>(null);

  // Доводка до КАРТКИ найкоротшим шляхом (порожні слоти розриву не ловляться)
  const snapToCard = (i: number, fast = false) => {
    const target = -slots[i] * faceAngle;
    const cur = rotation.get();
    const diff = (((target - cur + 180) % 360) + 360) % 360 - 180;
    setSnapping(true);
    animate(rotation, cur + diff, fast
      ? { type: 'tween', duration: 0.7, ease: [0.22, 1, 0.36, 1], onComplete: () => setSnapping(false) }
      : { type: 'spring', stiffness: 100, damping: 30, mass: 0.4, onComplete: () => setSnapping(false) });
  };
  const go = (d: number) => snapToCard((idxRef.current + d + n) % n);
  const spinToSector = (start: number) => snapToCard(start, true);

  // QA 01.08: не крутити барабан, коли галерея поза екраном — марно жере кадри
  const stageRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = stageRef.current; if (!el) return;
    const o = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    o.observe(el);
    return () => o.disconnect();
  }, []);

  // Один раз «розморожуємо» всі картки, коли галерея дійшла до екрана.
  // ЧОМУ: картки лежать на 3D-циліндрі, і ті, що зараз позаду, для браузера поза
  // вʼюпортом — з loading="lazy" вони не вантажаться взагалі, доки барабан їх не
  // поверне. Через це перемикання на «Кастом» чи «Retro» починало тягнути картинки
  // аж у момент кліку: на мобільному це секунди порожніх рамок (Влад, 12.08).
  // Після появи секції віддаємо всі 34 браузеру одразу — він качає їх паралельно
  // своїм планувальником, а не по черзі, як робила саморобна черга.
  const [warm, setWarm] = useState(false);
  useEffect(() => {
    if (!inView || warm) return;
    const t = window.setTimeout(() => setWarm(true), 300);
    return () => window.clearTimeout(t);
  }, [inView, warm]);

  // Авто-обертання; пауза: поза екраном, ховер, снап, фулскрін, reduced-motion
  useEffect(() => {
    if (!inView || hovered || snapping || active) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.1);
      last = t;
      // Швидкість — у картках за секунду, а не в градусах: кут на картку падає з
      // кількістю локацій, тому стала швидкість у градусах робила барабан щоразу швидшим.
      rotation.set(rotation.get() - (faceAngle / 3.6) * dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, hovered, snapping, active, rotation, faceAngle]);

  useEffect(() => {
    if (!active) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        setActive((cur) => {
          if (!cur) return cur;
          const imgs = GALLERY;
          const i = imgs.indexOf(cur);
          return imgs[(i + (e.key === 'ArrowRight' ? 1 : -1) + imgs.length) % imgs.length];
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [active]);

  // Клік по грані через ref — щоб грані не перерендерювались на кожен кадр обертання
  const onFaceClick = useCallback((i: number, s: Slide) => {
    if (i !== idxRef.current) { snapToCard(i); return; }
    setActive(s);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Грані рендеряться один раз на геометрію — обертання не тягне React за собою
  const faces = useMemo(() => GALLERY.map((s, i) => (
    <button
      type="button"
      key={s.img}
      className="lg3-face"
      data-loc={s.loc}
      aria-label={s.t ? `${s.t} · локація ${s.loc}` : `Локація ${s.loc}`}
      style={{ width: faceWidth, transform: `rotateY(${slots[i] * faceAngle}deg) translateZ(${radius}px)` }}
      onClick={() => onFaceClick(i, s)}
    >
      <img src={s.img.replace('/gallery/', '/gallery/t-')} alt="" loading={i < 7 || warm ? 'eager' : 'lazy'} decoding="async" draggable={false} />
    </button>
  )), [faceWidth, radius, faceAngle, slots, onFaceClick, warm]);

  const cur = GALLERY[idx];
  const activeSector = cur.loc;

  return (
    <div className="lg3">
      <div className="lg3-stage" ref={stageRef} style={{ height: Math.round(stageH) }}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {/* гігантський outline-напис поточної локації за барабаном */}
        <motion.div key={activeSector} className="lg3-bigword" aria-hidden="true"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }}>
          {activeSector.toUpperCase()}
        </motion.div>

        {/* Перспектива йде за радіусом, а не фіксованим числом: радіус росте з кількістю
            карток, і при сталій perspective передня картка наближається до камери й
            роздувається (34 картки = 757px замість 576 при сцені 600). Відношення 3.6
            тримає видимий розмір незмінним, скільки б локацій не додали. */}
        <div className="lg3-persp" style={{ perspective: `${Math.round(radius * 3.6)}px` }}>
          {/* Драг прибрано (Влад 31.07): перехоплював кліки по картках. Керування — стрілки/шкала/клік */}
          <motion.div
            className="lg3-cyl"
            data-active={activeSector}
            style={{ transform, rotateY: rotation, width: cylinderWidth }}
          >
            {faces}
          </motion.div>
        </div>
        <button className="lg3-arr left" onClick={() => go(-1)} aria-label="Попередня">‹</button>
        <button className="lg3-arr right" onClick={() => go(1)} aria-label="Наступна">›</button>
      </div>

      {/* Сітка локацій 3×2 (Влад 5.08): п'ять локацій + бронювання шостою клітинкою.
          Підпис із назвою шоу прибрано — секція про приміщення, а не про передачі. */}
      <div className="lg3-scale">
        <div className="lg3-labels">
          {sectors.map((s) => (
            <button key={s.loc}
              className={`lg3-seg ${activeSector === s.loc ? 'on' : ''}`}
              data-loc={s.loc}
              disabled={s.count === 0}
              title={s.count === 0 ? 'Фото цієї локації скоро будуть' : undefined}
              onMouseEnter={() => setHoverLoc(s.loc)}
              onMouseLeave={() => setHoverLoc(null)}
              onClick={() => spinToSector(s.start)}>
              <span>Локація {s.loc}</span>
              {activeSector === s.loc
                ? <motion.i className="lg3-fill" style={{ scaleX: localProgress }} />
                : <i className={`lg3-fill hint ${hoverLoc === s.loc ? 'on' : ''}`} />}
            </button>
          ))}
          <a className="lg3-seg lg3-cta" href={bookUrl} target="_blank" rel="noreferrer">
            <span>Забронювати цю локацію</span>
          </a>
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div className="lg3-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActive(null)}>
            <button className="vmodal-x" onClick={() => setActive(null)} aria-label="Закрити">×</button>
            <motion.img
              src={active.img} alt="" onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            />
            <div className="lg3-full-cap">{active.t ? `${active.t} · ` : ''}{active.loc}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
