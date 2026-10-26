import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'

const scraps = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/scraps' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().optional(),
    excerpt: z.string().optional(),
  }),
})

export const collections = { scraps }
