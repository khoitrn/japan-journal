export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function wordCountStatus(
  text: string,
  min: number,
  max: number
): 'empty' | 'under' | 'ok' | 'over' {
  if (!text.trim()) return 'empty'
  const wc = wordCount(text)
  if (wc < min) return 'under'
  if (wc > max) return 'over'
  return 'ok'
}
