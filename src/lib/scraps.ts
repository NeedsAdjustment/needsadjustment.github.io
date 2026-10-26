import type { CollectionEntry } from 'astro:content'

export function stripMarkdown(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    .replace(/[#*_~`>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function formatDate(date: Date | undefined): string | undefined {
  return date?.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function sortScrapsNewestFirst(scraps: CollectionEntry<'scraps'>[]) {
  return [...scraps].sort((a, b) => (b.data.date?.getTime() ?? 0) - (a.data.date?.getTime() ?? 0))
}
