import type { DayEntry, JournalSections, VoiceProfile } from './types'

const CITY_CONTEXT: Record<string, string> = {
  'Sapporo':              'Hokkaido capital. Known for Hokkaido University research hub, precision agriculture and dairy tech, snow/tourism innovation, and Sapporo Breweries (est. 1876). Ainu indigenous culture. Cold climate drives unique engineering approaches.',
  'Sapporo → Sendai':    'Travel day by Shinkansen. Passing through rural Tohoku landscape — an opportunity to observe infrastructure, transit punctuality, and regional contrasts with urban centers.',
  'Sendai':               'Tohoku region hub. Tohoku University is a top research university known for pioneering disaster-response robotics after the 2011 earthquake/tsunami. Post-disaster reconstruction made Sendai a testbed for resilience tech. Date Masamune samurai history. Tanabata festival textile tradition.',
  'Tokyo':                'Global tech and business hub. Akihabara (electronics), Shibuya (digital/startup culture), Roppongi (VC/startup scene). Home to Sony, SoftBank HQ area, Toyota showroom. Culture of extreme punctuality (Shinkansen to-the-second), vending machine density (~4M nationwide), convenience store supply-chain innovation, and nemawashi consensus decision-making.',
  'Kyoto':                'Ancient capital balancing tradition with technology. Kyocera HQ. Nishijin textile district (automated looms preceded modern computing). Fushimi sake brewing (process automation + craft heritage). Temples use advanced preservation technology. Wabi-sabi and mono no aware philosophies visibly shape design aesthetics.',
  'Hiroshima / Miyajima': 'Peace Memorial City — rebuilt entirely post-WWII, a living case study in urban reconstruction and resilience. Mazda HQ (rotary engine innovation, born here). Miyajima island: Itsukushima shrine, deer, sacred landscape. Contrast of industrial heritage and natural/cultural heritage.',
  'Fukuoka':              'Japan\'s designated "startup special zone" city with deregulated business rules to attract entrepreneurs. PayPay and LINE Corp regional presence. Kyushu University strong on tech transfer. Proximity to Korea and China makes it Japan\'s most internationally minded city. Hakata textile tradition. Tonkotsu ramen originated here.',
}

function stripCodeFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
}

const COURSE_OBJECTIVES = `
1. Japanese Technology Management Systems Analysis — R&D strategies, AI/robotics/IoT, how cultural values shape ethical frameworks
2. Japanese Technology Ecosystem Comprehension — government-corporate-university partnerships, digital transformation in traditional industries
3. Comparative Technology Management Assessment — Japanese vs American product lifecycle, kaizen (continuous improvement), nemawashi (consensus building)
4. Technology-Driven Solutions Analysis — how demographic shifts, resource limits, geography drive innovation; talent development vs Western approaches
5. Cross-Cultural Technology Strategy Development — Japanese-American business interactions, cross-cultural team management, market entry frameworks
`.trim()

const TEMPLATE_REQUIREMENTS = `
Section 1 — Activities Log: list every activity today (business visits, cultural activities, group meals, transportation, free exploration, language practice). Each as { type, details, include }.
Section 2 — Technology & Business Insights: 100-150 words about Japanese technology management or business practices observed today.
Section 3 — Cultural Observations: 100-150 words about cultural elements observed and how they might influence business/technology.
Section 4 — Language Application: list every moment the student used Japanese (greetings, transportation, food, questions, signs). Each as { skill, context, include }.
Section 5 — Connections to Course Objectives: connect today's experiences to all 5 objectives. If not applicable write "Not Applicable".
Section 6 — Positive Reflections: 100-150 words total responding to at least 2 of these prompts: new insight, what delighted you, proudest accomplishment, beautiful thing, connection made, moment that made you smile, thing you hope not to forget, tried something outside comfort zone.
Section 7 — Questions & Curiosities: 50-100 words of questions that emerged today.
Section 8 — Visual Documentation: list photos with captions (student uploads 3-5 photos).
Section 9 — Tomorrow's Anticipation: 50-100 words on what they look forward to tomorrow and how to build on today.
`.trim()

function buildSystemPrompt(voice: VoiceProfile | null): string {
  const voiceSection = voice
    ? `
STUDENT'S VOICE PROFILE:
${voice.description}

Writing sample: "${voice.sample}"

Style rules:
${voice.rules.map(r => `- ${r}`).join('\n')}
`.trim()
    : 'Write in casual, genuine first-person college student voice. Reflective but not formal.'

  return `You are a travel journal assistant for a Texas A&M student on the ISTM 440 Japan study abroad trip.

YOUR JOB: Take the student's raw WhatsApp jottings and write their daily journal in their own voice.

${voiceSection}

COURSE OBJECTIVES:
${COURSE_OBJECTIVES}

JOURNAL TEMPLATE REQUIREMENTS:
${TEMPLATE_REQUIREMENTS}

RULES — NEVER BREAK THESE:
1. Ground every sentence in something the student actually mentioned. Never invent experiences, people, or places.
2. When a jotting is brief (a few words), expand it using your knowledge of the city's tech ecosystem, cultural landmarks, or historical context — but frame it as the student's reaction/observation, not a Wikipedia entry.
3. Jottings with a section tag (shown as [→ section]) MUST go into that section — tag overrides your own judgment.
4. If a section has zero relevant jottings (tagged or inferred), output exactly: "[NO JOTTINGS — PLEASE ADD]"
5. Hit word count targets by expanding the student's notes in their voice — a short jotting is an invitation to flesh out, not a sign to skip.
6. Sound like the student at their most articulate, not a corporate report.
7. The student's genuine voice is the product — protect it.`
}

function buildUserPrompt(entry: DayEntry): string {
  const jottingsList = entry.jottings
    .map((j, i) => {
      const hint = j.sectionHint ? ` [→ ${j.sectionHint}]` : ''
      const photo = j.mediaUrl ? ' [📸 photo attached]' : ''
      return `${i + 1}. [${j.timestamp}]${hint} ${j.text}${photo}`
    })
    .join('\n')

  const photoCount = entry.jottings.filter(j => j.mediaUrl).length
  const photoUrls = entry.jottings
    .filter(j => j.mediaUrl)
    .map(j => j.mediaUrl!)

  const cityContext = CITY_CONTEXT[entry.city] ?? ''

  return `Day ${entry.day} — ${entry.city} (${entry.date})${cityContext ? `\n\nLOCATION CONTEXT (use to expand brief jottings):\n${cityContext}` : ''}

STUDENT'S JOTTINGS FROM TODAY:
${jottingsList || '(no jottings yet)'}

${photoCount > 0 ? `PHOTOS SHARED: ${photoCount} photo(s)\nURLs: ${photoUrls.join(', ')}` : 'PHOTOS: none shared yet'}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "activities": [{ "type": string, "details": string, "include": boolean }],
  "techInsights": string,
  "culturalObservations": string,
  "languageApplications": [{ "skill": string, "context": string, "include": boolean }],
  "objectiveConnections": [
    { "objectiveKey": "obj1", "objectiveLabel": "Japanese Technology Management Systems", "connection": string },
    { "objectiveKey": "obj2", "objectiveLabel": "Japanese Technology Ecosystem", "connection": string },
    { "objectiveKey": "obj3", "objectiveLabel": "Comparative Technology Assessment", "connection": string },
    { "objectiveKey": "obj4", "objectiveLabel": "Technology-Driven Solutions", "connection": string },
    { "objectiveKey": "obj5", "objectiveLabel": "Cross-Cultural Technology Strategy", "connection": string }
  ],
  "positiveReflections": string,
  "questionsCuriosities": string,
  "photos": [{ "url": string, "caption": string }],
  "tomorrowsAnticipation": string
}`
}

function buildEditPrompt(entry: DayEntry, editMessage: string): string {
  return `The student is reviewing their Day ${entry.day} draft and sent this reply:
"${editMessage}"

CURRENT DRAFT:
${JSON.stringify(entry.sections, null, 2)}

Update the relevant section(s) based on their message. Use only information they provided.
Return a JSON object with two fields:
{
  "sections": { ...full updated sections object... },
  "confirmationMessage": "short WhatsApp-friendly confirmation of what was updated (1-2 sentences)"
}`
}

export async function generateDraft(
  apiKey: string,
  entry: DayEntry,
  voice: VoiceProfile | null
): Promise<JournalSections> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: buildSystemPrompt(voice),
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: buildUserPrompt(entry) }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude error ${response.status}: ${err}`)
  }

  const data = await response.json() as { content: Array<{ text: string }> }
  const text = stripCodeFences(data.content[0].text)
  return JSON.parse(text) as JournalSections
}

export async function applyEdit(
  apiKey: string,
  entry: DayEntry,
  editMessage: string,
  voice: VoiceProfile | null
): Promise<{ sections: JournalSections; confirmationMessage: string }> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: buildSystemPrompt(voice),
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: buildEditPrompt(entry, editMessage) }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude edit error ${response.status}: ${err}`)
  }

  const data = await response.json() as { content: Array<{ text: string }> }
  const text = stripCodeFences(data.content[0].text)
  return JSON.parse(text)
}

export function buildWhatsAppPreview(entry: DayEntry, appUrl: string): string {
  const s = entry.sections!
  const wc = (text: string) => text.split(/\s+/).filter(Boolean).length

  const check = (text: string, min: number, max: number) => {
    const w = wc(text)
    if (text.includes('[NO JOTTINGS')) return '⚠️'
    if (w < min) return `⚠️ (${w}/${min} words)`
    return '✅'
  }

  const photoCount = s.photos.filter(p => p.url).length
  const activityCount = s.activities.filter(a => a.include).length
  const langCount = s.languageApplications.filter(l => l.include).length
  const objMissing = s.objectiveConnections.filter(o => o.connection === 'Not Applicable').length

  return `📔 *Day ${entry.day} Draft — ${entry.city}*
_${entry.date}_
━━━━━━━━━━━━━━━

*Filled from your jottings:*
✅ Activities: ${activityCount} logged
${check(s.techInsights, 100, 150)} Tech Insights (${wc(s.techInsights)} words)
${check(s.culturalObservations, 100, 150)} Cultural (${wc(s.culturalObservations)} words)
${langCount > 0 ? '✅' : '⚠️'} Language: ${langCount} moment${langCount !== 1 ? 's' : ''} logged
${objMissing > 0 ? `⚠️` : '✅'} Objectives: ${5 - objMissing}/5 connected
${check(s.positiveReflections, 100, 150)} Reflections (${wc(s.positiveReflections)} words)
${check(s.questionsCuriosities, 50, 100)} Questions (${wc(s.questionsCuriosities)} words)
📸 Photos: ${photoCount} uploaded
${check(s.tomorrowsAnticipation, 50, 100)} Tomorrow (${wc(s.tomorrowsAnticipation)} words)

*Reply to add or fix anything* — just type it naturally and I'll update the right section.

*Reply DONE* when ready to export →
${appUrl}/day/${entry.day}`
}
