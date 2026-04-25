import { wordCount, wordCountStatus } from '../utils/wordCount'

interface Props {
  text: string
  min: number
  max: number
}

export default function WordCounter({ text, min, max }: Props) {
  const wc = wordCount(text)
  const status = wordCountStatus(text, min, max)

  const color =
    status === 'ok' ? '#25a244' :
    status === 'over' ? '#e05' :
    status === 'under' ? '#b45309' : '#999'

  return (
    <span style={{ fontSize: '11px', color, fontWeight: 500, marginLeft: 8 }}>
      {wc} / {min}–{max} words
      {status === 'ok' && ' ✓'}
      {status === 'over' && ' (over)'}
      {status === 'under' && ` (need ${min - wc} more)`}
    </span>
  )
}
