export const TRIP_DAYS = [
  { day: 1,  date: '2026-05-11', city: 'Sapporo',              emoji: '🏔️' },
  { day: 2,  date: '2026-05-12', city: 'Sapporo',              emoji: '🏔️' },
  { day: 3,  date: '2026-05-13', city: 'Sapporo → Sendai',     emoji: '🚅' },
  { day: 4,  date: '2026-05-14', city: 'Sendai',               emoji: '⛩️' },
  { day: 5,  date: '2026-05-15', city: 'Tokyo',                emoji: '🗼' },
  { day: 6,  date: '2026-05-16', city: 'Tokyo',                emoji: '🗼' },
  { day: 7,  date: '2026-05-17', city: 'Tokyo',                emoji: '🗼' },
  { day: 8,  date: '2026-05-18', city: 'Kyoto',                emoji: '🦌' },
  { day: 9,  date: '2026-05-19', city: 'Kyoto',                emoji: '🦌' },
  { day: 10, date: '2026-05-20', city: 'Kyoto',                emoji: '🦌' },
  { day: 11, date: '2026-05-21', city: 'Hiroshima / Miyajima', emoji: '🕊️' },
  { day: 12, date: '2026-05-22', city: 'Fukuoka',              emoji: '🍜' },
  { day: 13, date: '2026-05-23', city: 'Fukuoka',              emoji: '🍜' },
  { day: 14, date: '2026-05-24', city: 'Fukuoka',              emoji: '🍜' },
]

// Returns the trip day object for a given ISO date string (in JST)
export function getDayForDate(isoDate: string) {
  return TRIP_DAYS.find(d => d.date === isoDate) ?? null
}

// Returns current date string in JST (UTC+9)
export function todayJST(): string {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 10)
}
