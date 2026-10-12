import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { DIET_KEYS } from './data/diets';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: z
    .object({
      title: z.string().min(1),            // listing title
      description: z.string().min(1),      // listing dek
      diets: z.array(z.enum(DIET_KEYS)),
      primaryDiet: z.enum(DIET_KEYS).optional(),
      permalink: z.string().regex(/^\/[a-z0-9/-]*\/$/).optional(),
      legacy: z.boolean().default(false),  // page lives in src/pages; entry is for listings only
      published: z.coerce.date(),
      reviewed: z.coerce.date(),
      author: z.string().default('Nik'),
      draft: z.boolean().default(false),
    })
    .refine((d) => d.diets.length <= 1 || d.primaryDiet, { message: 'primaryDiet is required when a guide has more than one diet' })
    .refine((d) => !d.legacy || d.permalink, { message: 'legacy guides need a permalink' }),
});

export const collections = { guides };
