import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DayEntry } from '../types'
import { fetchAllDays } from '../utils/api'
import { TRIP_DAYS } from '../data/trip'

const STATUS_LABEL: Record<string, string> = {
  jotting:   '📝 Jotting',
  reviewing: '👀 Draft Ready',
  approved:  '✅ Approved',
  exported:  '📤 Submitted',
}

const STATUS_COLOR: Record<string, string> = {
  jotting:   '#666',
  reviewing: '#b45309',
  approved:  '#166534',
  exported:  '#1e40af',
}

export default function Feed() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<Map<number, DayEntry>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllDays().then(days => {
      const map = new Map(days.map(d => [d.day, d]))
      setEntries(map)
      setLoading(false)
    })
  }, [])

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#ECE5DD' }}>
      {/* WhatsApp-style header */}
      <div style={{ background: '#075E54', color: '#fff', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#128C7E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🇯🇵</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Japan Journal</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>ISTM 440 · May 11–24, 2026</div>
          </div>
        </div>
      </div>

      {/* Chat background */}
      <div style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading…</div>
        ) : (
          TRIP_DAYS.map(tripDay => {
            const entry = entries.get(tripDay.day)
            const isToday = tripDay.date === today
            const isPast = tripDay.date < today
            const isFuture = tripDay.date > today

            return (
              <button
                key={tripDay.day}
                onClick={() => navigate(`/day/${tripDay.day}`)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: isFuture && !entry ? 'default' : 'pointer',
                  padding: 0,
                  marginBottom: 2,
                }}
              >
                {/* Date divider for first day of each city */}
                {(tripDay.day === 1 || TRIP_DAYS[tripDay.day - 2]?.city !== tripDay.city) && (
                  <div style={{ textAlign: 'center', fontSize: 11, color: '#667781', margin: '8px 0 4px', background: '#d9dbd5', borderRadius: 12, padding: '2px 10px', display: 'inline-block', marginLeft: '50%', transform: 'translateX(-50%)' }}>
                    {tripDay.city}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  paddingRight: 4,
                }}>
                  <div style={{
                    background: entry ? '#DCF8C6' : isToday ? '#fff' : isFuture ? '#f0f0f0' : '#fff',
                    borderRadius: '8px 8px 2px 8px',
                    padding: '8px 12px',
                    maxWidth: '85%',
                    minWidth: 200,
                    boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
                    opacity: isFuture && !entry ? 0.5 : 1,
                    border: isToday ? '2px solid #25D366' : 'none',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>
                        {tripDay.emoji} Day {tripDay.day} — {tripDay.city}
                      </span>
                      {isToday && <span style={{ fontSize: 10, background: '#25D366', color: '#fff', borderRadius: 8, padding: '1px 6px' }}>TODAY</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>{tripDay.date}</div>

                    {entry ? (
                      <>
                        <div style={{ fontSize: 12, color: STATUS_COLOR[entry.status], fontWeight: 500 }}>
                          {STATUS_LABEL[entry.status]}
                        </div>
                        {entry.jottings.length > 0 && (
                          <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
                            {entry.jottings.length} jotting{entry.jottings.length !== 1 ? 's' : ''} captured
                          </div>
                        )}
                        {entry.sections && (
                          <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
                            {entry.sections.photos.length} photo{entry.sections.photos.length !== 1 ? 's' : ''} · draft filled
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: '#aaa' }}>
                        {isFuture ? 'Not started yet' : isToday ? 'Tap to start writing →' : 'No entries'}
                      </div>
                    )}

                    <div style={{ textAlign: 'right', fontSize: 10, color: '#999', marginTop: 4 }}>
                      {entry?.exportedAt ? '✓✓' : '✓'} {entry?.draftGeneratedAt?.slice(11, 16) ?? ''}
                    </div>
                  </div>
                </div>
              </button>
            )
          })
        )}

        {/* Bottom message */}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#888', padding: '20px 0 8px' }}>
          📔 Journal due daily by 8:00 PM JST · Submit via Canvas
        </div>
      </div>
    </div>
  )
}
