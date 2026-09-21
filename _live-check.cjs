const { chromium } = require('C:/Claude/clients/kodmezczyznynetpl/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  for (const r of ['/pro-nas', '/service/podcast', '/portfolio']) {
    await p.goto('https://tereveni.studio' + r, { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
    const m = await p.evaluate(() => ({ t: document.title, c: document.head.querySelector('link[rel=canonical]')?.href, i: document.head.querySelector('meta[property="og:image"]')?.content }));
    console.log(r.padEnd(18), '|', m.t, '|', m.c, '|', m.i);
  }
  await b.close();
})();
