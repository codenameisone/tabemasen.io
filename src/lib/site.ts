export const NAV = [
  { href: '/guides/', label: 'Guides' },
  { href: '/allergies/', label: 'Allergies' },
  { href: '/halal/', label: 'Halal' },
  { href: '/vegan/', label: 'Vegan' },
  { href: '/gluten-free-japan/', label: 'Gluten-free' },
] as const;

export const FOOTER = {
  cards: [
    { href: '/allergies/', label: 'Allergies' },
    { href: '/gluten-free-japan/', label: 'Gluten-free' },
    { href: '/vegan/', label: 'Vegan' },
    { href: '/halal/', label: 'Halal' },
  ],
  guides: [
    { href: '/allergies/food-allergies-in-japanese/', label: 'Food allergies in Japanese' },
    { href: '/allergies/labeling-guide/', label: 'Japan labeling guide' },
    { href: '/celiac/', label: 'Celiac in Japan' },
    { href: '/halal/certification-guide/', label: 'Halal certification in Japan' },
    { href: '/guides/', label: 'All guides' },
  ],
  resources: [
    { href: 'https://www.foodallergy.org/resources/travel-tips-japan', label: 'FoodAllergy.org Japan tips' },
    { href: 'https://www.legalnomads.com/gluten-free/japanese/', label: 'Legal Nomads — GF Japan' },
    { href: 'https://jp.usembassy.gov/services/importing-medication/', label: 'Yunyu Kakunin-sho' },
  ],
  // Pages whose legacy footer listed their own resources instead of the allergy ones.
  resourcesByPage: {
    vegan: [
      { href: 'https://www.happycow.net/asia/japan/', label: 'HappyCow Japan' },
      { href: 'https://www.vegeproject.org/', label: 'VegeProject Japan' },
      { href: 'https://isitveganjapan.com/', label: 'Is It Vegan Japan?' },
      { href: 'https://vegewel.com/en/', label: 'Vegewel restaurant guide' },
    ],
    halal: [
      { href: 'https://www.halalgourmet.jp/', label: 'Halal Gourmet Japan' },
      { href: 'https://halalnavi.com/', label: 'Halal Navi' },
      { href: 'https://tokyocamii.org/en/', label: 'Tokyo Camii (mosque)' },
      { href: 'https://www.jhalal.com/', label: 'Japan Halal Association' },
    ],
    'halal-cert': [
      { href: 'https://www.halalgourmet.jp/en', label: 'Halal Gourmet Japan' },
      { href: 'https://www.halal-navi.com/', label: 'Halal Navi' },
      { href: 'https://www.japan.travel/en/plan/muslim-travelers/', label: 'JNTO — Muslim Travelers' },
      { href: 'https://jhalal.com/en/', label: 'Japan Halal Association' },
    ],
  } as Record<string, readonly { href: string; label: string }[]>,
  about: [
    { href: '/about/', label: 'About & safety' },
    { href: '/featured/', label: 'Featured in' },
    { href: 'https://github.com/codenameisone/tabemasen.io', label: 'GitHub' },
    { href: 'https://github.com/codenameisone/tabemasen.io/blob/main/CHANGELOG.md', label: 'Changelog' },
    { href: 'mailto:hello@tabemasen.io', label: 'Feedback' },
  ],
} as const;
