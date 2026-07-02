import type { CollectionEntry } from 'astro:content'

export function stripMarkdown(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    .replace(/[#*_~`>|]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function formatDate(date: string | undefined): string | undefined {
  if (!date) return undefined
  const d = new Date(date)
  if (isNaN(d.getTime())) return date
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function sortScrapsNewestFirst(scraps: CollectionEntry<'scraps'>[]) {
  return [...scraps].sort((a, b) => {
    const dateA = a.data.date ? new Date(a.data.date).getTime() : 0
    const dateB = b.data.date ? new Date(b.data.date).getTime() : 0
    return dateB - dateA
  })
}
