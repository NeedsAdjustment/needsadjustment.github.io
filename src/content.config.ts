import { defineCollection } from 'astro:content'
import { z } from 'zod'
import { glob } from 'astro/loaders'

const scraps = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/scraps' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    order: z.number().optional(),
    date: z.coerce.string().optional(),
    excerpt: z.string().optional(),
  }),
})

export const collections = { scraps }
