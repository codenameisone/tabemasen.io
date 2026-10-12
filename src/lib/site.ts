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
  about: [
    { href: '/about/', label: 'About & safety' },
    { href: '/featured/', label: 'Featured in' },
    { href: 'https://github.com/codenameisone/tabemasen.io', label: 'GitHub' },
    { href: 'https://github.com/codenameisone/tabemasen.io/blob/main/CHANGELOG.md', label: 'Changelog' },
    { href: 'mailto:hello@tabemasen.io', label: 'Feedback' },
  ],
} as const;
