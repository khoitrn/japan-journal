import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function HelpModal() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} title="Help & Docs" style={{
        position: 'fixed', bottom: 80, right: 20, width: 40, height: 40,
        borderRadius: '50%', background: '#bd93f9', border: 'none',
        color: '#1e1f29', fontSize: 18, fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>?</button>

      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#282a36', border: '1px solid #44475a', borderRadius: 12,
            maxWidth: 520, width: '100%', maxHeight: '85vh', overflowY: 'auto',
          }}>
            {/* Header */}
            <div style={{ background: '#075E54', borderRadius: '12px 12px 0 0', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#f8f8f2' }}>📔 Japan Journal — Docs</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>ISTM 440 · May 11–24, 2026</div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#f8f8f2', fontSize: 20, cursor: 'pointer', opacity: 0.8 }}>×</button>
            </div>

            <div style={{ padding: '20px' }}>

              {isAdmin ? (
                <>
                  <Section title="Daily Flow">
                    <Step n="1" label="Jot throughout the day">
                      Send anything to your Twilio WhatsApp number as you go — observations, quotes, funny moments, language wins. No format required. Send photos directly too.
                    </Step>
                    <Step n="2" label="Get your draft at 7:30 PM JST">
                      The AI reads all your jottings, fills in all 9 journal sections in your voice, and sends you a preview on WhatsApp with word counts.
                    </Step>
                    <Step n="3" label="Edit via WhatsApp or the web app">
                      Reply naturally in WhatsApp to fix anything — <em>"the Sony visit was actually 2 hours not 1"</em> — or open this app to edit directly. Both update the same draft.
                    </Step>
                    <Step n="4" label="Export and submit">
                      Reply <Code>DONE</Code> on WhatsApp → tap the link → hit <strong>Export PDF → Canvas</strong> → upload to Canvas by <strong>8:00 PM JST</strong>.
                    </Step>
                  </Section>

                  <Section title="WhatsApp Commands">
                    <CommandRow cmd="HELP" desc="Show the command guide on WhatsApp" />
                    <CommandRow cmd="PING" desc="Check connection — replies with your phone number match status" />
                    <CommandRow cmd="VOICE: [your style]" desc="Set how the AI writes. Do this before May 11." />
                    <CommandRow cmd="TEST" desc="Generate a mock Day 5 Tokyo draft to test the full pipeline" />
                    <CommandRow cmd="DONE" desc="Approve your draft and get the export link" />
                  </Section>
                </>
              ) : (
                <Section title="How to use">
                  <Step n="1" label="Pick your day">
                    Tap any day from the feed. Each day shows the city and date from the trip schedule.
                  </Step>
                  <Step n="2" label="Fill out all 9 sections">
                    Word counts are shown live — green means you're in range. Hit all the targets before exporting.
                  </Step>
                  <Step n="3" label="Upload 3–5 photos">
                    Scroll to Section 8 and add photos with captions explaining why you chose each.
                  </Step>
                  <Step n="4" label="Export and submit">
                    Hit <strong>Export PDF → Canvas</strong> at the bottom → upload the PDF to Canvas by <strong>8:00 PM JST</strong>.
                  </Step>
                  <div style={{ background: '#383a4a', borderRadius: 8, padding: '10px 12px', marginTop: 12, fontSize: 12, color: '#6272a4', lineHeight: 1.6 }}>
                    💾 Your progress saves automatically in your browser. Come back anytime on the same device to continue editing before you export.
                  </div>
                </Section>
              )}

              <Section title="Journal Template (9 Sections)">
                <TemplateRow n="1" label="Activities Log" req="List business visits, meals, transport, language moments" />
                <TemplateRow n="2" label="Technology & Business Insights" req="100–150 words" />
                <TemplateRow n="3" label="Cultural Observations" req="100–150 words" />
                <TemplateRow n="4" label="Language Application" req="Every moment you used Japanese" />
                <TemplateRow n="5" label="Connections to Course Objectives" req="All 5 objectives, 'Not Applicable' if none" />
                <TemplateRow n="6" label="Positive Reflections" req="100–150 words, at least 2 prompts" />
                <TemplateRow n="7" label="Questions & Curiosities" req="50–100 words" />
                <TemplateRow n="8" label="Visual Documentation" req="3–5 photos with captions" />
                <TemplateRow n="9" label="Tomorrow's Anticipation" req="50–100 words" />
              </Section>

              <Section title="Trip Cities">
                {[
                  ['May 11–12', 'Sapporo 🏔️'],
                  ['May 13', 'Sapporo → Sendai 🚅'],
                  ['May 14', 'Sendai ⛩️'],
                  ['May 15–17', 'Tokyo 🗼'],
                  ['May 18–20', 'Kyoto 🦌'],
                  ['May 21', 'Hiroshima / Miyajima 🕊️'],
                  ['May 22–24', 'Fukuoka 🍜'],
                ].map(([dates, city]) => (
                  <div key={dates} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #383a4a', fontSize: 13 }}>
                    <span style={{ color: '#6272a4' }}>{dates}</span>
                    <span style={{ color: '#f8f8f2' }}>{city}</span>
                  </div>
                ))}
              </Section>

              {isAdmin && (
                <Section title="AI & Academic Integrity">
                  <p style={{ fontSize: 13, color: '#f8f8f2', lineHeight: 1.7 }}>
                    Your jottings are the authentic record of what you experienced. The AI organizes and expands them in your voice — it can't invent experiences you didn't have. Per Prof. Gomillion's AI policy, the journal must reflect your genuine in-person experiences. Always review the draft before exporting and make sure it accurately represents your day.
                  </p>
                </Section>
              )}

              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#6272a4' }}>
                {isAdmin
                  ? <>Twilio sandbox: <strong style={{ color: '#f8f8f2' }}>+14155238886</strong> · Due nightly 8:00 PM JST</>
                  : 'Due nightly 8:00 PM JST · Submit via Canvas'
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#bd93f9', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

function Step({ n, label, children }: { n: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#bd93f9', color: '#1e1f29', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{n}</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#f8f8f2', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 12, color: '#6272a4', lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  )
}

function CommandRow({ cmd, desc }: { cmd: string; desc: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'flex-start' }}>
      <code style={{ background: '#383a4a', color: '#50fa7b', padding: '2px 7px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace', flexShrink: 0 }}>{cmd}</code>
      <span style={{ fontSize: 12, color: '#6272a4', lineHeight: 1.5 }}>{desc}</span>
    </div>
  )
}

function TemplateRow({ n, label, req }: { n: string; label: string; req: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: '1px solid #383a4a', alignItems: 'flex-start' }}>
      <span style={{ color: '#bd93f9', fontWeight: 600, fontSize: 12, flexShrink: 0, width: 20 }}>{n}.</span>
      <div>
        <div style={{ fontSize: 13, color: '#f8f8f2', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: '#6272a4' }}>{req}</div>
      </div>
    </div>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return <code style={{ background: '#383a4a', color: '#50fa7b', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>{children}</code>
}
