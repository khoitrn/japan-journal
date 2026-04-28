import { parseTwilioBody, sendWhatsApp, twimlOk } from './twilio'
import { getDay, saveDay, getVoiceProfile } from './kv'
import { generateDraft, applyEdit, buildWhatsAppPreview } from './claude'
import { getDayForDate, todayJST } from './trip'
import type { DayEntry, Jotting } from './types'
import type { Env } from './index'

const SECTION_TAGS: Record<string, string> = {
  '#tech':      'techInsights',
  '#culture':   'culturalObservations',
  '#lang':      'languageApplications',
  '#reflect':   'positiveReflections',
  '#questions': 'questionsCuriosities',
  '#tomorrow':  'tomorrowsAnticipation',
  '#activity':  'activities',
}

function parseSectionTag(text: string): { sectionHint?: string; cleanText: string } {
  const lower = text.toLowerCase()
  for (const [tag, hint] of Object.entries(SECTION_TAGS)) {
    if (lower.startsWith(tag + ' ') || lower === tag) {
      return { sectionHint: hint, cleanText: text.slice(tag.length).trim() }
    }
  }
  return { cleanText: text }
}

async function notify(env: Env, to: string, body: string): Promise<void> {
  if (env.SKIP_TWILIO === 'true') {
    console.log(`[SKIP_TWILIO] → ${to}: ${body.slice(0, 120)}`)
    return
  }
  await sendWhatsApp(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN, env.TWILIO_WHATSAPP_FROM, to, body)
}

export async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const body = await request.text()
  const params = parseTwilioBody(body)

  const from = (params['From'] ?? '').replace('whatsapp:', '')
  const rawText = (params['Body'] ?? '').trim()
  const mediaUrl = params['MediaUrl0'] ?? undefined
  const mediaType = params['MediaContentType0'] ?? undefined
  const upperText = rawText.toUpperCase()

  // DEBUG: log from vs USER_PHONE and reply so we can see the format
  if (upperText === 'PING') {
    await notify(env, from,
      `PING OK\nfrom: ${from}\nUSER_PHONE: ${env.USER_PHONE}\nmatch: ${from === env.USER_PHONE}`)
    return twimlOk()
  }

  // Only accept messages from the configured user
  if (from !== env.USER_PHONE) return twimlOk()

  // HELP command
  if (upperText === 'HELP') {
    await notify(env, from,
`📔 *Japan Journal — How to Use*
ISTM 440 · May 11–24, 2026
━━━━━━━━━━━━━━━

*Throughout the day — just jot anything:*
"visited Toyota factory, their assembly line uses AR"
"said arigatou gozaimasu and the chef waved back"
📸 Send photos directly — I'll save them

*Optional: tag a jotting to pin it to a section:*
#tech — Technology & Business Insights
#culture — Cultural Observations
#lang — Language Application
#reflect — Positive Reflections
#questions — Questions & Curiosities
#tomorrow — Tomorrow's Anticipation
#activity — Activities Log

Even a few words is fine — I'll expand it using context from where you are.

*Every night at 7:30 PM JST:*
I'll send you a draft filled from your jottings. Reply naturally to fix anything.

*When the draft looks good:*
Reply *DONE* → export link → Canvas by *8:00 PM*

*Commands:*
HELP — show this message
PING — check connection status
VOICE: [your style] — set how I write (do this before May 11)
TEST — generate a mock draft to test the flow
DONE — approve draft and get export link

*Web app:*
${env.APP_URL}`)
    return twimlOk()
  }

  // TEST command — bypasses date check, generates a draft from fake jottings
  if (upperText === 'TEST') {
    const testEntry: DayEntry = {
      day: 5,
      date: '2026-05-15',
      city: 'Tokyo',
      status: 'jotting',
      jottings: [
        // tagged + brief → tests expansion using city context
        { id: '1', text: 'Sony HQ robots', sectionHint: 'techInsights', timestamp: new Date().toISOString() },
        { id: '2', text: 'nemawashi in action', sectionHint: 'techInsights', timestamp: new Date().toISOString() },
        // tagged language moment
        { id: '3', text: 'sumimasen for directions, it worked', sectionHint: 'languageApplications', timestamp: new Date().toISOString() },
        // untagged → Claude infers section
        { id: '4', text: 'ramen at Ichiran, solo booth dining, everyone faces the wall — so different from eating out back home', timestamp: new Date().toISOString() },
        { id: '5', text: 'Shinkansen to-the-second punctuality, conductor bows entering and leaving', timestamp: new Date().toISOString() },
        // tagged brief reflection
        { id: '6', text: 'overwhelmed by how efficient everything is', sectionHint: 'positiveReflections', timestamp: new Date().toISOString() },
        // tagged questions
        { id: '7', text: 'how do they keep the trains this precise?', sectionHint: 'questionsCuriosities', timestamp: new Date().toISOString() },
      ],
    }
    try {
      const voice = await getVoiceProfile(env.JOURNAL_KV)
      const sections = await generateDraft(env.CLAUDE_API_KEY, testEntry, voice)
      testEntry.sections = sections
      testEntry.status = 'reviewing'
      testEntry.draftGeneratedAt = new Date().toISOString()
      await saveDay(env.JOURNAL_KV, testEntry)
      const preview = buildWhatsAppPreview(testEntry, env.APP_URL)
      await notify(env, from, `🧪 *TEST MODE — Day 5 Tokyo mock draft:*\n\n${preview}`)
    } catch (e) {
      await notify(env, from, `⚠️ TEST failed: ${(e as Error).message}`)
    }
    return twimlOk()
  }

  const today = todayJST()
  const tripDay = getDayForDate(today)

  // Outside trip dates — acknowledge but do nothing
  if (!tripDay) {
    await notify(env, from, `📔 Japan Journal is active May 11–24. See you in Japan! 🇯🇵`)
    return twimlOk()
  }

  let entry = await getDay(env.JOURNAL_KV, today)
  if (!entry) {
    entry = {
      day: tripDay.day,
      date: today,
      city: tripDay.city,
      status: 'jotting',
      jottings: [],
    }
  }

  // Handle DONE / LOOKS GOOD → approve draft and send export link
  if (entry.status === 'reviewing' && (upperText === 'DONE' || upperText.startsWith('LOOKS GOOD'))) {
    entry.status = 'approved'
    await saveDay(env.JOURNAL_KV, entry)
    await notify(env, from,
      `✅ *Day ${entry.day} approved!*\n\nOpen to review and export your PDF:\n${env.APP_URL}/day/${entry.day}\n\nDue on Canvas by *8:00 PM* tonight. 🎓`)
    return twimlOk()
  }

  // Handle VOICE SETUP
  if (upperText.startsWith('VOICE:')) {
    const profileText = rawText.slice(6).trim()
    await env.JOURNAL_KV.put('voice_profile', JSON.stringify({
      description: profileText,
      sample: '',
      rules: [],
    }))
    await notify(env, from, `✅ Voice profile saved! I'll write in your style from now on.`)
    return twimlOk()
  }

  // If reviewing → treat message as an edit
  if (entry.status === 'reviewing' && entry.sections) {
    try {
      const voice = await getVoiceProfile(env.JOURNAL_KV)
      const { sections, confirmationMessage } = await applyEdit(
        env.CLAUDE_API_KEY, entry, rawText, voice
      )
      entry.sections = sections
      await saveDay(env.JOURNAL_KV, entry)
      await notify(env, from, `${confirmationMessage}\n\nReply *DONE* when ready to export, or keep adding edits.`)
    } catch (e) {
      await notify(env, from,
        `⚠️ Couldn't process that edit — try again or open the app to edit directly: ${env.APP_URL}/day/${entry.day}`)
    }
    return twimlOk()
  }

  // Default: store as a jotting
  const { sectionHint, cleanText } = parseSectionTag(rawText)
  const jotting: Jotting = {
    id: crypto.randomUUID(),
    text: cleanText,
    sectionHint,
    mediaUrl,
    mediaType,
    timestamp: new Date().toISOString(),
  }
  entry.jottings.push(jotting)
  await saveDay(env.JOURNAL_KV, entry)

  // Only confirm the first jotting of the day
  if (entry.jottings.length === 1) {
    await notify(env, from,
      `📔 *Day ${entry.day} — ${entry.city}* started! Keep jotting throughout the day. Draft coming at 7:30 PM JST.`)
  }

  return twimlOk()
}
