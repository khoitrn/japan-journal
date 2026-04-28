import type { DayEntry, JournalSections, VoiceProfile } from '../types'

const BASE = import.meta.env.VITE_WORKER_URL ?? 'http://localhost:8787'

function token() {
  return sessionStorage.getItem('admin_token') ?? ''
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }
}

export async function fetchDay(dayNum: number): Promise<DayEntry | null> {
  const res = await fetch(`${BASE}/api/day/${dayNum}`, { headers: authHeaders() })
  if (!res.ok) return null
  return res.json()
}

export async function fetchAllDays(): Promise<DayEntry[]> {
  const res = await fetch(`${BASE}/api/days`, { headers: authHeaders() })
  if (!res.ok) return []
  return res.json()
}

export async function saveDay(dayNum: number, sections: JournalSections, status = 'approved'): Promise<DayEntry> {
  const res = await fetch(`${BASE}/api/day/${dayNum}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ sections, status }),
  })
  return res.json()
}

export async function markExported(dayNum: number): Promise<void> {
  await fetch(`${BASE}/api/day/${dayNum}/export`, { method: 'POST', headers: authHeaders() })
}

export async function fetchVoiceProfile(): Promise<VoiceProfile | null> {
  const res = await fetch(`${BASE}/api/voice`, { headers: authHeaders() })
  if (!res.ok) return null
  return res.json()
}

export async function saveVoiceProfile(profile: VoiceProfile): Promise<void> {
  await fetch(`${BASE}/api/voice`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(profile),
  })
}
