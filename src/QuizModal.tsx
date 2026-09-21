import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { checkContact } from './validate';

// Квіз «Розрахувати вартість» (механіка узгоджена з Олегом 30.07):
// цін на сайті нема — людина відповідає на 3 питання чіпсами, лишає контакт,
// менеджер отримує кваліфіковану заявку і озвучує ціну сам.
type Step = { q: string; options: string[] };
export type QuizDef = { slug: string; title: string; steps: Step[] };

export const QUIZZES: Record<string, QuizDef> = {
  production: {
    slug: 'production',
    title: 'YouTube під ключ',
    steps: [
      { q: 'Канал уже є?', options: ['Є, треба розвивати', 'Немає, стартуємо з нуля'] },
      { q: 'Головна ціль каналу?', options: ['Заявки і продажі', 'Впізнаваність бренду', 'Монетизація контенту'] },
      { q: 'Скільки відео на місяць?', options: ['2–4', '4–8', 'Ще не знаю, порадьте'] },
    ],
  },
  studio: {
    slug: 'studio',
    title: 'Зйомка на студії',
    steps: [
      { q: 'Що знімаємо?', options: ['Подкаст', 'Інтервʼю', 'YouTube-шоу', 'Експертний контент'] },
      { q: 'Скільки людей у кадрі?', options: ['1', '2', '3', '4+'] },
      { q: 'Як часто плануєте знімати?', options: ['Разова зйомка', 'Серія випусків', 'Щомісячно, постійно'] },
    ],
  },
  outdoor: {
    slug: 'outdoor',
    title: 'Зйомка на виїзді',
    steps: [
      { q: 'Що знімаємо?', options: ['Репортаж', 'Івент', 'Промо-ролик', 'Інше'] },
      { q: 'Де локація?', options: ['Київ', 'Київська область', 'Інше місто'] },
      { q: 'Тривалість зйомки?', options: ['До пів дня', 'Повний день', 'Кілька днів'] },
    ],
  },
  live: {
    slug: 'live',
    title: 'Онлайн-трансляція',
    steps: [
      { q: 'Тип події?', options: ['Конференція', 'Спорт', 'Концерт', 'Корпоратив'] },
      { q: 'Скільки глядачів онлайн очікуєте?', options: ['До 100', 'До 1 000', '1 000+'] },
      { q: 'Скільки камер потрібно?', options: ['1–2', '3–4', 'Не знаю, порадьте'] },
    ],
  },
};

export default function QuizModal({ slug, onClose }: { slug: string; onClose: () => void }) {
  const quiz = QUIZZES[slug];
  const total = quiz.steps.length + 1; // + крок контактів
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [hp, setHp] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const pick = (q: string, a: string) => {
    setAnswers((p) => ({ ...p, [q]: a }));
    setStep((s) => s + 1);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    // 12.08: та сама перевірка, що й в основній формі — інакше в заявку падало
    // «38050505050505» і менеджер не міг додзвонитись
    const chk = checkContact(contact);
    if (!chk.ok) { setErr(chk.error || 'Перевірте контакт'); return; }
    setBusy(true);
    setErr('');
    try {
      // QA 01.08: «Запит прийнято» лише коли сервер справді зберіг
      const r = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact: chk.value, service: quiz.title, answers, hp }),
      });
      if (!r.ok) throw new Error(String(r.status));
      setSent(true);
    } catch {
      setErr('Не вдалося надіслати. Спробуйте ще раз або напишіть у Telegram.');
      setBusy(false);
    }
  };

  const contactStep = step >= quiz.steps.length;

  return (
    <div className="vmodal-backdrop" onClick={onClose}>
      <div className="vmodal qz" role="dialog" aria-modal="true" aria-label={`Розрахунок: ${quiz.title}`} onClick={(e) => e.stopPropagation()}>
        <button className="vmodal-x" onClick={onClose} aria-label="Закрити">×</button>

        {sent ? (
          <div className="qz-done">
            <div className="cform-check">✓</div>
            <h3>Запит прийнято</h3>
            <p>Порахуємо вартість під ваш формат і напишемо {contact.startsWith('@') ? 'в Telegram' : 'вам'} найближчим часом.</p>
          </div>
        ) : (
          <div className="qz-body">
            <div className="qz-kicker">Розрахунок вартості</div>
            <div className="qz-title">{quiz.title}</div>
            <div className="qz-progress">
              {Array.from({ length: total }, (_, i) => (
                <span key={i} className={i <= step ? 'on' : ''} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {!contactStep ? (
                <motion.div key={step} className="qz-step"
                  initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -26 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
                  <div className="qz-q">{quiz.steps[step].q}</div>
                  <div className="qz-chips">
                    {quiz.steps[step].options.map((o) => (
                      <button key={o} className="qz-chip" onClick={() => pick(quiz.steps[step].q, o)}>{o}</button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.form key="contact" className="qz-step" onSubmit={submit}
                  initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
                  <div className="qz-q">Куди надіслати розрахунок?</div>
                  <div className="qz-answers">
                    {Object.values(answers).map((a) => <span key={a}>{a}</span>)}
                  </div>
                  <label className="qz-lab">Імʼя<input required type="text" placeholder="Як до вас звертатись" value={name} onChange={(e) => setName(e.target.value)} /></label>
                  <label className="qz-lab">Telegram або телефон<input required type="text" placeholder="@нік або +380…" value={contact} onChange={(e) => setContact(e.target.value)} /></label>
                  <button type="submit" disabled={busy} className="btn btn-primary qz-submit"><span className="dot" /> {busy ? 'Надсилаємо…' : 'Отримати розрахунок'}</button>
                  <input className="hp-field" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} />
                  {err && <div className="cform-err">{err}</div>}
                  <div className="qz-note">Без спаму — одна відповідь із розрахунком під ваш формат.</div>
                </motion.form>
              )}
            </AnimatePresence>

            {step > 0 && !sent && (
              <button className="qz-back" onClick={() => setStep((s) => Math.max(0, s - 1))}>← Назад</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
