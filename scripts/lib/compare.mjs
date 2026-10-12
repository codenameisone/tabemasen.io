const REPO_ONLY = [/\.md$/, /^docs\//, /^\.gitignore$/, /^\.github\//];

export function classifyLegacyFiles(paths) {
  const pages = [];
  const statics = [];
  for (const path of paths) {
    if (REPO_ONLY.some((re) => re.test(path))) continue;
    const isPage = path === 'index.html' || path.endsWith('/index.html');
    (isPage ? pages : statics).push(path);
  }
  return { pages, statics };
}

export function firstDifference(a, b) {
  const x = a.split('\n');
  const y = b.split('\n');
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) {
    if (x[i] !== y[i]) {
      return { line: i + 1, expected: x[i] ?? '<end of file>', actual: y[i] ?? '<end of file>' };
    }
  }
  return null;
}
