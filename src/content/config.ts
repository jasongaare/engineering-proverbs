import { defineCollection, z } from 'astro:content';

const proverbs = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.number(),
    quote: z.string(),
    author: z.string(),
    source: z.string().optional(),
  }),
});

export const collections = { proverbs };
