import type { DayEntry, VoiceProfile } from './types'

export async function getDay(kv: KVNamespace, date: string): Promise<DayEntry | null> {
  const raw = await kv.get(`day:${date}`)
  return raw ? JSON.parse(raw) : null
}

export async function saveDay(kv: KVNamespace, entry: DayEntry): Promise<void> {
  await kv.put(`day:${entry.date}`, JSON.stringify(entry))
}

export async function getVoiceProfile(kv: KVNamespace): Promise<VoiceProfile | null> {
  const raw = await kv.get('voice_profile')
  return raw ? JSON.parse(raw) : null
}

export async function saveVoiceProfile(kv: KVNamespace, profile: VoiceProfile): Promise<void> {
  await kv.put('voice_profile', JSON.stringify(profile))
}

export async function getAllDays(kv: KVNamespace): Promise<DayEntry[]> {
  const list = await kv.list({ prefix: 'day:' })
  const entries = await Promise.all(
    list.keys.map(async k => {
      const raw = await kv.get(k.name)
      return raw ? (JSON.parse(raw) as DayEntry) : null
    })
  )
  return entries.filter(Boolean) as DayEntry[]
}
