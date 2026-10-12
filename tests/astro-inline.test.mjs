import { describe, it, expect } from 'vitest';
import { markInline } from '../scripts/lib/astro-inline.mjs';

describe('markInline', () => {
  it('marks a bare script', () => {
    expect(markInline('<script>location.replace("/")</script>'))
      .toBe('<script is:inline>location.replace("/")</script>');
  });

  it('marks a src-only script (Astro would otherwise bundle it)', () => {
    expect(markInline('<script src="data.js"></script>'))
      .toBe('<script is:inline src="data.js"></script>');
  });

  it('marks JSON-LD and multi-line attribute lists', () => {
    expect(markInline('<script type="application/ld+json">{}</script>'))
      .toBe('<script is:inline type="application/ld+json">{}</script>');
    expect(markInline('<script data-goatcounter="x"\n        async src="//gc.zgo.at/count.js"></script>'))
      .toBe('<script is:inline data-goatcounter="x"\n        async src="//gc.zgo.at/count.js"></script>');
  });

  it('marks style blocks', () => {
    expect(markInline('<style>\n.a{}\n</style>')).toBe('<style is:inline>\n.a{}\n</style>');
  });

  it('is idempotent', () => {
    const once = markInline('<script src="a.js"></script><style>.a{}</style>');
    expect(markInline(once)).toBe(once);
  });

  it('leaves closing tags and look-alike words alone', () => {
    expect(markInline('<p>scripts and styles</p></script></style><scripted>'))
      .toBe('<p>scripts and styles</p></script></style><scripted>');
  });
});
