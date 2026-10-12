// Renders public/assets/og-image-v2.png (1200x630 social preview) from the built site:
// the real card renderer, fonts and tokens. Usage: npm run build; PORT=4390 node scripts/serve-dist.mjs &; node scripts/og-image.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const ill = process.argv[2] || 'noren';
// New filename whenever the design changes, so link-preview caches (Telegram, Slack) refetch.
const out = process.argv[3] || 'public/assets/og-image-v2.png';
const img = 'data:image/jpeg;base64,' + readFileSync(`src/assets/illustrations/${ill}.jpg`).toString('base64');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await p.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
await p.goto(`http://localhost:${process.env.PORT ?? 4390}/#a=peanut,wheat,egg,shrimp&s=severe&en=0`);
await p.waitForTimeout(600);
await p.evaluate((img) => {
  const brand = document.querySelector('.tm-header__brand').cloneNode(true);
  const card = document.querySelector('#card').cloneNode(true);
  card.removeAttribute("id"); card.removeAttribute("tabindex"); card.querySelectorAll(".card-line--closing").forEach(e=>e.remove()); const bl=[...card.querySelectorAll(".card-line--blank")]; bl.at(-1)?.remove();
  const stage = document.createElement('div');
  stage.id = 'og';
  stage.innerHTML = `
    <div class="og-ill" style="background-image:url(${img})"></div>
    <div class="og-left">
      <div class="og-brand"></div>
      <p class="og-eyebrow">Free Japanese restaurant cards</p>
      <h1 class="og-h1">Eat safely<br>in Japan.</h1>
      <p class="og-sub">A polite card in Japanese for food allergies, halal, vegan and gluten-free diets.</p>
      <p class="og-url">tabemasen.io</p>
    </div>
    <div class="og-card"></div>`;
  stage.querySelector('.og-brand').append(brand);
  stage.querySelector('.og-card').append(card);
  document.body.replaceChildren(stage);
  const st = document.createElement('style');
  st.textContent = `
    html,body{margin:0;padding:0;background:#fff;overflow:hidden}
    #og{position:relative;width:1200px;height:630px;background:var(--tm-paper);overflow:hidden}
    .og-ill{position:absolute;right:-40px;top:-10px;width:760px;height:510px;background-size:cover;background-position:center;opacity:.95}
    .og-left{position:absolute;left:64px;top:56px;width:470px}
    .og-brand .tm-header__brand{transform:scale(1.35);transform-origin:left center}
    .og-eyebrow{margin:56px 0 0;font:700 15px/1 var(--tm-font-body);letter-spacing:.14em;text-transform:uppercase;color:var(--tm-ink-faint)}
    .og-h1{margin:18px 0 0;font:500 76px/1.02 var(--tm-font-display);color:var(--tm-ink);letter-spacing:-.01em}
    .og-sub{margin:26px 0 0;font:400 23px/1.5 var(--tm-font-body);color:var(--tm-ink-muted)}
    .og-url{position:absolute;left:0;top:500px;margin:0;font:700 20px/1 var(--tm-font-body);color:var(--tm-shu-text);border-bottom:2px solid var(--tm-shu);padding-bottom:6px}
    .og-card{position:absolute;left:640px;top:118px;width:520px;transform:rotate(2deg);transform-origin:top left}
    .og-card .card{box-shadow:var(--tm-shadow-card);font-size:17px}
  `;
  document.head.append(st);
}, img);
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(500);
await p.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await b.close();
// Palette PNG keeps it well under WhatsApp's ~300 KB preview limit.
const { default: sharp } = await import('sharp');
const { writeFileSync } = await import('node:fs');
writeFileSync(out, await sharp(readFileSync(out)).png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 }).toBuffer());
