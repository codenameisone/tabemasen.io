// Usage: npm run smoke:live -- https://tabemasen.io
//        npm run smoke:live -- http://localhost:4321   (redirect checks skipped)
const origin = (process.argv[2] ?? 'https://tabemasen.io').replace(/\/$/, '');
const live = !/localhost|127\.0\.0\.1/.test(origin);

const pages = ['/', '/about/', '/allergies/', '/allergies/food-allergies-in-japanese/',
  '/allergies/labeling-guide/', '/celiac/', '/featured/', '/gluten-free/', '/gluten-free-japan/',
  '/halal/', '/halal/certification-guide/', '/vegan/'];
const files = ['/data.js', '/app.js', '/analytics.js',
  '/sitemap.xml', '/robots.txt', '/llms.txt', '/llms-full.txt', '/assets/og-image.png'];
const slashless = ['/allergies', '/gluten-free', '/halal', '/vegan'];

let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) failures++; };

for (const path of [...pages, ...files]) {
  const res = await fetch(origin + path, { redirect: 'manual' });
  check(res.status === 200, `${res.status} ${path}`);
}

if (live) {
  for (const path of slashless) {
    const res = await fetch(origin + path, { redirect: 'manual' });
    const to = res.headers.get('location') ?? '';
    check([301, 308].includes(res.status) && to.replace(origin, '') === `${path}/`,
      `${res.status} ${path} -> ${to || '(no location)'}`);
  }
}

console.log(`\n${failures} failure(s) against ${origin}`);
process.exit(failures ? 1 : 0);
