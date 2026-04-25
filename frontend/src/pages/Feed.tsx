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
  jotting:   '#6272a4',
  reviewing: '#ffb86c',
  approved:  '#50fa7b',
  exported:  '#8be9fd',
}

export default function Feed() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<Map<number, DayEntry>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllDays().then(days => {
      setEntries(new Map(days.map(d => [d.day, d])))
      setLoading(false)
    })
  }, [])

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#1e1f29' }}>
      {/* Header */}
      <div style={{ background: '#075E54', color: '#f8f8f2', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#128C7E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🇯🇵</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Japan Journal</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>ISTM 440 · May 11–24, 2026</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6272a4' }}>Loading…</div>
        ) : (
          TRIP_DAYS.map(tripDay => {
            const entry = entries.get(tripDay.day)
            const isToday = tripDay.date === today
            const isFuture = tripDay.date > today

            return (
              <button
                key={tripDay.day}
                onClick={() => navigate(`/day/${tripDay.day}`)}
                style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: isFuture && !entry ? 'default' : 'pointer', padding: 0, marginBottom: 2 }}
              >
                {(tripDay.day === 1 || TRIP_DAYS[tripDay.day - 2]?.city !== tripDay.city) && (
                  <div style={{ textAlign: 'center', fontSize: 11, color: '#6272a4', margin: '8px 0 4px', background: '#383a4a', borderRadius: 12, padding: '2px 10px', display: 'inline-block', marginLeft: '50%', transform: 'translateX(-50%)' }}>
                    {tripDay.city}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 4 }}>
                  <div style={{
                    background: entry ? '#383a4a' : isToday ? '#44475a' : '#282a36',
                    borderRadius: '8px 8px 2px 8px',
                    padding: '8px 12px',
                    maxWidth: '85%',
                    minWidth: 200,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    opacity: isFuture && !entry ? 0.4 : 1,
                    border: isToday ? `2px solid #50fa7b` : `1px solid #44475a`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#f8f8f2' }}>
                        {tripDay.emoji} Day {tripDay.day} — {tripDay.city}
                      </span>
                      {isToday && <span style={{ fontSize: 10, background: '#50fa7b', color: '#1e1f29', borderRadius: 8, padding: '1px 6px', fontWeight: 700 }}>TODAY</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#6272a4', marginBottom: 6 }}>{tripDay.date}</div>

                    {entry ? (
                      <>
                        <div style={{ fontSize: 12, color: STATUS_COLOR[entry.status], fontWeight: 500 }}>{STATUS_LABEL[entry.status]}</div>
                        {entry.jottings.length > 0 && (
                          <div style={{ fontSize: 11, color: '#6272a4', marginTop: 3 }}>
                            {entry.jottings.length} jotting{entry.jottings.length !== 1 ? 's' : ''} captured
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: '#6272a4' }}>
                        {isFuture ? 'Not started yet' : isToday ? 'Tap to start →' : 'No entries'}
                      </div>
                    )}

                    <div style={{ textAlign: 'right', fontSize: 10, color: '#6272a4', marginTop: 4 }}>
                      {entry?.exportedAt ? '✓✓' : '✓'} {entry?.draftGeneratedAt?.slice(11, 16) ?? ''}
                    </div>
                  </div>
                </div>
              </button>
            )
          })
        )}

        <div style={{ textAlign: 'center', fontSize: 11, color: '#6272a4', padding: '20px 0 8px' }}>
          📔 Due daily 8:00 PM JST · Submit via Canvas
        </div>
      </div>
    </div>
  )
}
