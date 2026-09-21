/* Пререндер: кожен публічний маршрут стає СПРАВЖНІМ HTML у dist/<маршрут>/index.html.
   Навіщо: боти ШІ-пошуків (ChatGPT, Perplexity) і частина краулерів не виконують JS —
   зараз вони бачать порожній <div id="root">. Google бачить сайт і так, але сеошник
   Олега просив саме чистий HTML.

   Що НЕ змінюється: код сайту, дизайн, роутер. У браузері React монтується поверх
   готової розмітки, як і раніше.

   Запуск:  npm run build && node _prerender.cjs
   Перевірка: node _prerender.cjs --check   (лише звіт, нічого не пише)
*/
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('C:/Claude/clients/kodmezczyznynetpl/node_modules/playwright');

const DIST = process.env.DIST_DIR ? path.resolve(process.env.DIST_DIR) : path.join(__dirname, 'dist');
const PORT = 4419;
const LIVE = 'https://tereveni.studio';   // звідки беремо дані портфоліо під час збірки

/* /admin свідомо НЕ пререндеримо: він під noindex і показує дані з бази. */
const ROUTES = [
  '/',
  '/pro-nas',
  '/portfolio',
  '/service/production',
  '/service/podcast',
  '/service/youtube-show',
  '/service/content',
];

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.mp4': 'video/mp4', '.xml': 'application/xml', '.txt': 'text/plain', '.json': 'application/json',
  '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  // дані портфоліо тягнемо з живого сайту, щоб у HTML лягли справжні роботи
  if (url.startsWith('/api/')) {
    try {
      const r = await fetch(LIVE + req.url);
      const body = await r.text();
      res.writeHead(r.status, { 'Content-Type': r.headers.get('content-type') || 'application/json' });
      res.end(body);
    } catch {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"rows":[]}');
    }
    return;
  }
  let f = path.join(DIST, url);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

const outFile = (route) => (route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, route, 'index.html'));

(async () => {
  const checkOnly = process.argv.includes('--check');
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('Немає dist — спершу npm run build');
    process.exit(2);
  }

  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch();
  const rows = [];

  for (const route of ROUTES) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
    await page.goto('http://localhost:' + PORT + route, { waitUntil: 'networkidle', timeout: 45000 });
    /* Анімації Framer Motion стартують із opacity/translate — даємо кадрам осісти,
       інакше в HTML впечеться стан «ще не показано». */
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(900);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);

    const html = await page.evaluate(() => '<!doctype html>\n' + document.documentElement.outerHTML);
    const info = await page.evaluate(() => ({
      title: document.title,
      desc: (document.head.querySelector('meta[name="description"]')?.getAttribute('content') || '').length,
      canon: document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
      text: (document.getElementById('root')?.innerText || '').replace(/\s+/g, ' ').trim().length,
    }));
    rows.push({ route, ...info, bytes: html.length, errors });

    if (!checkOnly) {
      const file = outFile(route);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, html, 'utf8');
    }
    await page.close();
  }

  await browser.close();
  server.close();

  console.log('');
  console.log('маршрут'.padEnd(26), 'текст'.padStart(7), 'HTML'.padStart(8), '  заголовок');
  let bad = 0;
  for (const r of rows) {
    const ok = r.text > 400 && r.title && r.desc > 50 && r.canon && !r.errors.length;
    if (!ok) bad++;
    console.log(
      (ok ? '✓ ' : '✗ ') + r.route.padEnd(24),
      String(r.text).padStart(7),
      (Math.round(r.bytes / 1024) + 'КБ').padStart(8),
      '  ' + r.title.slice(0, 50),
      r.errors.length ? ' ПОМИЛКИ: ' + r.errors.join(' | ') : ''
    );
  }
  const titles = new Set(rows.map((r) => r.title));
  console.log('');
  console.log('унікальних заголовків:', titles.size, 'з', rows.length);
  console.log(checkOnly ? 'режим перевірки — файли не змінювались' : 'записано у dist/<маршрут>/index.html');
  process.exit(bad || titles.size !== rows.length ? 1 : 0);
})();
