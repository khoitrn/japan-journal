import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { DayEntry, JournalSections } from '../types'
import { fetchDay, saveDay, markExported } from '../utils/api'
import { printDay } from '../utils/export'
import { TRIP_DAYS } from '../data/trip'
import WordCounter from '../components/WordCounter'
import ActivityTable from '../components/ActivityTable'
import LanguageTable from '../components/LanguageTable'
import ObjectivesTable from '../components/ObjectivesTable'
import PhotoUpload from '../components/PhotoUpload'
import HelpModal from '../components/HelpModal'
import { useAuth } from '../context/AuthContext'

const EMPTY_SECTIONS: JournalSections = {
  activities: [
    { type: 'Business Visit', details: '', include: false },
    { type: 'Cultural Activity', details: '', include: false },
    { type: 'Group Meal', details: '', include: false },
    { type: 'Transportation Experience', details: '', include: false },
    { type: 'Free Exploration', details: '', include: false },
    { type: 'Language Practice', details: '', include: false },
  ],
  techInsights: '',
  culturalObservations: '',
  languageApplications: [
    { skill: 'Used greetings', context: '', include: false },
    { skill: 'Navigated transportation', context: '', include: false },
    { skill: 'Ordered food', context: '', include: false },
    { skill: 'Asked/answered questions', context: '', include: false },
    { skill: 'Read signs/directions', context: '', include: false },
  ],
  objectiveConnections: [
    { objectiveKey: 'obj1', objectiveLabel: 'Japanese Technology Management Systems', connection: '' },
    { objectiveKey: 'obj2', objectiveLabel: 'Japanese Technology Ecosystem', connection: '' },
    { objectiveKey: 'obj3', objectiveLabel: 'Comparative Technology Assessment', connection: '' },
    { objectiveKey: 'obj4', objectiveLabel: 'Technology-Driven Solutions', connection: '' },
    { objectiveKey: 'obj5', objectiveLabel: 'Cross-Cultural Technology Strategy', connection: '' },
  ],
  positiveReflections: '',
  questionsCuriosities: '',
  photos: [],
  tomorrowsAnticipation: '',
}

export default function DayView() {
  const { dayNum } = useParams<{ dayNum: string }>()
  const navigate = useNavigate()
  const day = parseInt(dayNum ?? '1')
  const tripDay = TRIP_DAYS.find(d => d.day === day)

  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const [entry, setEntry] = useState<DayEntry | null>(null)
  const [sections, setSections] = useState<JournalSections>(EMPTY_SECTIONS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!isAdmin) {
      // Guest: load from localStorage only
      const saved = localStorage.getItem(`guest:day:${day}`)
      if (saved) setSections(JSON.parse(saved))
      if (tripDay) setEntry({ day, date: tripDay.date, city: tripDay.city, status: 'jotting', jottings: [] })
      return
    }
    fetchDay(day).then(e => {
      if (e) { setEntry(e); if (e.sections) setSections(e.sections) }
      else if (tripDay) setEntry({ day, date: tripDay.date, city: tripDay.city, status: 'jotting', jottings: [] })
    })
  }, [day])

  const update = <K extends keyof JournalSections>(key: K, value: JournalSections[K]) => {
    setSections(s => ({ ...s, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    if (isAdmin) await saveDay(day, sections)
    else localStorage.setItem(`guest:day:${day}`, JSON.stringify(sections))
    setSaving(false)
    setSaved(true)
  }

  const handleExport = async () => {
    await handleSave()
    await markExported(day)
    printDay({ ...entry!, sections })
  }

  if (!tripDay) return <div style={{ padding: 40, textAlign: 'center', color: '#f8f8f2' }}>Day {day} not found.</div>

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '16px 16px 80px', background: '#1e1f29', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#075E54', color: '#f8f8f2', borderRadius: 10, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 2 }}>ISTM 440 · Day {day} of 14</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Raleway, sans-serif' }}>{tripDay.emoji} {tripDay.city}</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>{tripDay.date} · Due 8:00 PM JST</div>
        </div>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#f8f8f2', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>
          ← All Days
        </button>
      </div>

      {/* Guest banner */}
      {!isAdmin && (
        <div style={{ background: '#383a4a', border: '1px solid #6272a4', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#6272a4' }}>
          👤 Guest mode — fill out the template and export your own PDF. Sign in as admin for AI drafts.
        </div>
      )}

      {isAdmin && entry && entry.jottings.length > 0 && (
        <div style={{ background: '#383a4a', border: '1px solid #50fa7b', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#50fa7b' }}>
          📱 <strong>{entry.jottings.length} WhatsApp jotting{entry.jottings.length !== 1 ? 's' : ''}</strong>
          <span style={{ color: '#f8f8f2' }}> captured today — sections below were filled from these.</span>
        </div>
      )}

      <Section title="1. Activities Log" hint="Check activities that apply. Uncheck to exclude from PDF.">
        <ActivityTable rows={sections.activities} onChange={v => update('activities', v)} />
      </Section>

      <Section title="2. Technology & Business Insights" hint="100–150 words about Japanese technology management or business practices today.">
        <textarea value={sections.techInsights} onChange={e => update('techInsights', e.target.value)}
          rows={6} placeholder="What did you learn about Japanese technology management or business practices?" style={textareaStyle} />
        <WordCounter text={sections.techInsights} min={100} max={150} />
      </Section>

      <Section title="3. Cultural Observations" hint="100–150 words on cultural elements observed and how they might influence business/technology.">
        <textarea value={sections.culturalObservations} onChange={e => update('culturalObservations', e.target.value)}
          rows={6} placeholder="What cultural elements did you observe? How might they influence business or technology in Japan?" style={textareaStyle} />
        <WordCounter text={sections.culturalObservations} min={100} max={150} />
      </Section>

      <Section title="4. Language Application" hint="Log every moment you used Japanese today.">
        <LanguageTable rows={sections.languageApplications} onChange={v => update('languageApplications', v)} />
      </Section>

      <Section title="5. Connections to Course Objectives" hint="Connect today's experiences to all 5 objectives. Write 'Not Applicable' if not relevant.">
        <ObjectivesTable rows={sections.objectiveConnections} onChange={v => update('objectiveConnections', v)} />
      </Section>

      <Section title="6. Positive Reflections" hint="100–150 words total. Respond to at least 2 of the prompts below.">
        <div style={{ background: '#383a4a', border: '1px solid #44475a', borderRadius: 6, padding: '10px 14px', marginBottom: 10, fontSize: 12, color: '#6272a4' }}>
          Pick at least 2: What new insight did you gain? · What delighted you? · Proudest accomplishment? · Beautiful thing you saw? · Connection you made? · Moment that made you smile? · Thing you hope to never forget? · What did you try outside your comfort zone?
        </div>
        <textarea value={sections.positiveReflections} onChange={e => update('positiveReflections', e.target.value)}
          rows={6} placeholder="Your reflections..." style={textareaStyle} />
        <WordCounter text={sections.positiveReflections} min={100} max={150} />
      </Section>

      <Section title="7. Questions & Curiosities" hint="50–100 words. What questions emerged today?">
        <textarea value={sections.questionsCuriosities} onChange={e => update('questionsCuriosities', e.target.value)}
          rows={4} placeholder="What are you curious to learn more about? What questions came up today?" style={textareaStyle} />
        <WordCounter text={sections.questionsCuriosities} min={50} max={100} />
      </Section>

      <Section title="8. Visual Documentation" hint="Upload 3–5 photos with captions explaining why you chose each.">
        <PhotoUpload photos={sections.photos} onChange={v => update('photos', v)} />
      </Section>

      <Section title="9. Tomorrow's Anticipation" hint="50–100 words. What are you most looking forward to tomorrow?">
        <textarea value={sections.tomorrowsAnticipation} onChange={e => update('tomorrowsAnticipation', e.target.value)}
          rows={4} placeholder="What are you most looking forward to tomorrow? How will you build on today's learning?" style={textareaStyle} />
        <WordCounter text={sections.tomorrowsAnticipation} min={50} max={100} />
      </Section>

      <HelpModal isAdmin={isAdmin} />

      {/* Bottom bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#282a36', borderTop: '1px solid #44475a', padding: '12px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end', zIndex: 100 }}>
        <button onClick={handleSave} disabled={saving} style={saveBtn}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Draft'}
        </button>
        <button onClick={handleExport} style={exportBtn}>
          Export PDF → Canvas
        </button>
      </div>
    </div>
  )
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#282a36', border: '1px solid #44475a', borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ background: '#383a4a', borderBottom: '1px solid #44475a', padding: '10px 16px' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#bd93f9', fontFamily: 'Raleway, sans-serif' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#6272a4', marginTop: 2 }}>{hint}</div>
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  )
}

const textareaStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #6272a4', borderRadius: 6,
  fontSize: 14, fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical',
  background: '#21222c', color: '#f8f8f2', boxSizing: 'border-box',
}

const saveBtn: React.CSSProperties = {
  padding: '10px 20px', border: '1px solid #6272a4', borderRadius: 6,
  background: '#44475a', color: '#f8f8f2', cursor: 'pointer', fontSize: 14, fontWeight: 500,
}

const exportBtn: React.CSSProperties = {
  padding: '10px 20px', border: 'none', borderRadius: 6,
  background: '#bd93f9', color: '#1e1f29', cursor: 'pointer', fontSize: 14, fontWeight: 700,
}
