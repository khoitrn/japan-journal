import type { DayEntry, JournalSections, VoiceProfile } from '../types'

const BASE = import.meta.env.VITE_WORKER_URL ?? 'http://localhost:8787'

export async function fetchDay(dayNum: number): Promise<DayEntry | null> {
  const res = await fetch(`${BASE}/api/day/${dayNum}`)
  if (!res.ok) return null
  return res.json()
}

export async function fetchAllDays(): Promise<DayEntry[]> {
  const res = await fetch(`${BASE}/api/days`)
  if (!res.ok) return []
  return res.json()
}

export async function saveDay(dayNum: number, sections: JournalSections): Promise<DayEntry> {
  const res = await fetch(`${BASE}/api/day/${dayNum}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sections, status: 'approved' }),
  })
  return res.json()
}

export async function markExported(dayNum: number): Promise<void> {
  await fetch(`${BASE}/api/day/${dayNum}/export`, { method: 'POST' })
}

export async function fetchVoiceProfile(): Promise<VoiceProfile | null> {
  const res = await fetch(`${BASE}/api/voice`)
  if (!res.ok) return null
  return res.json()
}

export async function saveVoiceProfile(profile: VoiceProfile): Promise<void> {
  await fetch(`${BASE}/api/voice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
}
