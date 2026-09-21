const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('C:/Claude/clients/kodmezczyznynetpl/node_modules/playwright');
const DIST = path.join(__dirname, 'dist');
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.webp':'image/webp', '.jpg':'image/jpeg', '.png':'image/png', '.mp4':'video/mp4', '.xml':'application/xml', '.txt':'text/plain' };
const srv = http.createServer((req, res) => {
  let f = path.join(DIST, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const routes = ['/', '/pro-nas', '/portfolio', '/service/production', '/service/podcast', '/service/youtube-show', '/service/content', '/admin'];
srv.listen(4417, async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const r of routes) {
    await p.goto('http://localhost:4417' + r, { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    const m = await p.evaluate(() => {
      const g = (sel) => { const e = document.head.querySelector(sel); return e ? (e.getAttribute('content') || e.getAttribute('href') || '') : ''; };
      return { title: document.title, canon: g('link[rel="canonical"]'), img: g('meta[property="og:image"]'), robots: g('meta[name="robots"]'), desc: g('meta[name="description"]').length };
    });
    console.log(r.padEnd(24), '|', m.title.slice(0, 46).padEnd(46), '|', m.canon.replace('https://tereveni.studio', '').padEnd(24), '|', m.img.replace('https://tereveni.studio', '').padEnd(26), '|', m.robots, '| desc', m.desc);
  }
  await b.close(); srv.close();
});
