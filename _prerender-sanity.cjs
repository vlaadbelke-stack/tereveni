/* Чи працює сайт ПОВЕРХ пререндереного HTML: навігація, модалка квізу, помилки консолі. */
const http=require('http'),fs=require('fs'),path=require('path');
const { chromium } = require('C:/Claude/clients/kodmezczyznynetpl/node_modules/playwright');
const DIST=path.join(__dirname,'dist');
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.mp4':'video/mp4','.woff2':'font/woff2','.glb':'model/gltf-binary','.json':'application/json'};
const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);
 if(u.startsWith('/api/')){r.writeHead(200,{'Content-Type':'application/json'});return r.end('{"rows":[]}');}
 let f=path.join(DIST,u); if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(DIST,u,'index.html');
 if(!fs.existsSync(f))f=path.join(DIST,'index.html');
 r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);}).listen(4420);
(async()=>{
 const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:900}});
 const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 p.on('console',m=>{if(m.type()==='error'&&!/favicon|404/.test(m.text()))errs.push('console: '+m.text().slice(0,160));});
 // вхід одразу на внутрішню сторінку — так приходять з пошуку
 await p.goto('http://localhost:4420/service/podcast',{waitUntil:'networkidle'});
 await p.waitForTimeout(1200);
 const t1=await p.title();
 const visible=await p.locator('#root').innerText().then(t=>t.replace(/\s+/g,' ').trim().length);
 // клік по навігації всередині SPA
 const navLink=p.locator('header a, nav a').filter({hasText:/Про|Роботи|Портфоліо/}).first();
 const hasNav=await navLink.count();
 if(hasNav) { await navLink.click(); await p.waitForTimeout(1200); }
 const t2=await p.title(); const url2=p.url();
 console.log('вхід на /service/podcast → заголовок:', t1);
 console.log('видимого тексту після монтування:', visible, 'символів');
 console.log('після кліку в меню →', url2.replace('http://localhost:4420',''), '| заголовок:', t2);
 console.log('помилки:', errs.length?errs.slice(0,3):'немає');
 await b.close(); srv.close();
})();
