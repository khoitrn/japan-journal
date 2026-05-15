import type { DayEntry, JournalSections, VoiceProfile } from './types'

type Row = Record<string, unknown>
type PhotoRow = { id: string; day: number; r2_key: string; caption: string; position: number }

function rowToEntry(row: Row, photos: PhotoRow[], base: string): DayEntry {
  const entry: DayEntry = {
    day: row.day as number,
    date: row.date as string,
    city: row.city as string,
    status: row.status as DayEntry['status'],
    jottings: JSON.parse((row.jottings as string) || '[]'),
    draftGeneratedAt: (row.draft_generated_at as string) ?? undefined,
    exportedAt: (row.exported_at as string) ?? undefined,
  }
  if (row.sections) {
    entry.sections = JSON.parse(row.sections as string) as JournalSections
    entry.sections.photos = photos.map(p => ({
      id: p.id,
      url: base ? `${base}/api/photos/${p.r2_key}` : p.r2_key,
      caption: p.caption,
    }))
  }
  return entry
}

export async function getDay(db: D1Database, dayNum: number, base = ''): Promise<DayEntry | null> {
  const row = await db.prepare('SELECT * FROM journal_entries WHERE day = ?').bind(dayNum).first<Row>()
  if (!row) return null
  const { results: photos } = await db.prepare(
    'SELECT id, day, r2_key, caption, position FROM photos WHERE day = ? ORDER BY position'
  ).bind(dayNum).all<PhotoRow>()
  return rowToEntry(row, photos, base)
}

export async function getAllDays(db: D1Database, base = ''): Promise<DayEntry[]> {
  const [{ results: entries }, { results: allPhotos }] = await Promise.all([
    db.prepare('SELECT * FROM journal_entries ORDER BY day').all<Row>(),
    db.prepare('SELECT id, day, r2_key, caption, position FROM photos ORDER BY day, position').all<PhotoRow>(),
  ])
  const byDay: Record<number, PhotoRow[]> = {}
  for (const p of allPhotos) {
    ;(byDay[p.day] ??= []).push(p)
  }
  return entries.map(row => rowToEntry(row, byDay[row.day as number] ?? [], base))
}

export async function upsertDay(
  db: D1Database,
  entry: DayEntry,
  photoUpdates?: Array<{ id: string; caption: string }>
): Promise<void> {
  const sectionsForDb = entry.sections ? { ...entry.sections, photos: [] } : null
  await db.prepare(`
    INSERT INTO journal_entries (day, date, city, status, jottings, sections, draft_generated_at, exported_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(day) DO UPDATE SET
      status             = excluded.status,
      jottings           = excluded.jottings,
      sections           = excluded.sections,
      draft_generated_at = excluded.draft_generated_at,
      exported_at        = excluded.exported_at,
      updated_at         = datetime('now')
  `).bind(
    entry.day, entry.date, entry.city, entry.status,
    JSON.stringify(entry.jottings),
    sectionsForDb ? JSON.stringify(sectionsForDb) : null,
    entry.draftGeneratedAt ?? null,
    entry.exportedAt ?? null,
  ).run()

  if (photoUpdates?.length) {
    await Promise.all(
      photoUpdates.map(p =>
        db.prepare('UPDATE photos SET caption = ? WHERE id = ?').bind(p.caption, p.id).run()
      )
    )
  }
}

export async function insertPhoto(
  db: D1Database,
  id: string, day: number, r2Key: string, caption: string, position: number
): Promise<void> {
  await db.prepare(
    'INSERT INTO photos (id, day, r2_key, caption, position) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, day, r2Key, caption, position).run()
}

export async function deletePhoto(db: D1Database, id: string): Promise<string | null> {
  const row = await db.prepare('SELECT r2_key FROM photos WHERE id = ?').bind(id).first<{ r2_key: string }>()
  if (!row) return null
  await db.prepare('DELETE FROM photos WHERE id = ?').bind(id).run()
  return row.r2_key
}

export async function countPhotos(db: D1Database, day: number): Promise<number> {
  const row = await db.prepare('SELECT COUNT(*) as n FROM photos WHERE day = ?').bind(day).first<{ n: number }>()
  return row?.n ?? 0
}

export async function getVoiceProfile(db: D1Database): Promise<VoiceProfile | null> {
  const row = await db.prepare('SELECT * FROM voice_profile WHERE id = 1').first<Row>()
  if (!row) return null
  return {
    description: row.description as string,
    sample: row.sample as string,
    rules: JSON.parse((row.rules as string) || '[]'),
  }
}

export async function saveVoiceProfile(db: D1Database, profile: VoiceProfile): Promise<void> {
  await db.prepare(`
    INSERT INTO voice_profile (id, description, sample, rules) VALUES (1, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      description = excluded.description,
      sample      = excluded.sample,
      rules       = excluded.rules
  `).bind(profile.description, profile.sample, JSON.stringify(profile.rules)).run()
}
