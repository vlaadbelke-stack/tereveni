import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// Анімаційний пакет 31.07: маска-reveal заголовків по рядках + паралакс фонів.
// Все на transform/opacity (GPU) і вимикається під prefers-reduced-motion.
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Заголовок, що виїжджає з-під маски рядок за рядком.
 *  children розбиваємо по <br /> — кожна частина отримує свою затримку. */
export function MaskTitle({ children, className = '', as: Tag = 'h2', delay = 0 }: {
  children: React.ReactNode; className?: string; as?: 'h1' | 'h2' | 'h3'; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inv, setInv] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (reduced()) { setInv(true); return; }
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInv(true); o.disconnect(); } }, { threshold: 0.2 });
    o.observe(el); return () => o.disconnect();
  }, []);

  // розкладаємо на рядки за <br />
  const kids = Array.isArray(children) ? children : [children];
  const lines: React.ReactNode[][] = [[]];
  kids.forEach((k) => {
    if (typeof k === 'object' && k && 'type' in k && (k as { type: unknown }).type === 'br') lines.push([]);
    else lines[lines.length - 1].push(k);
  });

  return (
    <Tag className={className} ref={ref as never}>
      {lines.map((line, i) => (
        <span className="mline" key={i}>
          <span className={`mline-in ${inv ? 'in' : ''}`} style={{ transitionDelay: `${delay + i * 0.1}s` }}>{line}</span>
        </span>
      ))}
    </Tag>
  );
}

/** Фонове фото з паралаксом: рухається повільніше за скрол. */
export function ParallaxBg({ src, className = '', strength = 12 }: { src: string; className?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${strength}%`, `${strength}%`]);
  const [off] = useState(() => reduced());
  return (
    <div ref={ref} className="pbg-wrap" aria-hidden="true">
      <motion.img className={className} src={src} alt="" loading="lazy" style={off ? undefined : { y }} />
    </div>
  );
}
