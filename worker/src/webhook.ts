import { parseTwilioBody, sendWhatsApp, twimlOk } from './twilio'
import { getDay, saveDay, getVoiceProfile } from './kv'
import { generateDraft, applyEdit, buildWhatsAppPreview } from './claude'
import { getDayForDate, todayJST } from './trip'
import type { DayEntry, Jotting } from './types'
import type { Env } from './index'

export async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const body = await request.text()
  const params = parseTwilioBody(body)

  const from = (params['From'] ?? '').replace('whatsapp:', '')
  const text = (params['Body'] ?? '').trim()
  const mediaUrl = params['MediaUrl0'] ?? undefined
  const mediaType = params['MediaContentType0'] ?? undefined

  // DEBUG: log from vs USER_PHONE and reply so we can see the format
  if (text.toUpperCase() === 'PING') {
    await sendWhatsApp(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN, env.TWILIO_WHATSAPP_FROM, from,
      `PING OK\nfrom: ${from}\nUSER_PHONE: ${env.USER_PHONE}\nmatch: ${from === env.USER_PHONE}`)
    return twimlOk()
  }

  // Only accept messages from the configured user
  if (from !== env.USER_PHONE) return twimlOk()

  // TEST command — bypasses date check, generates a draft from fake jottings
  if (text.toUpperCase() === 'TEST') {
    const testEntry: DayEntry = {
      day: 5,
      date: '2026-05-15',
      city: 'Tokyo',
      status: 'jotting',
      jottings: [
        { id: '1', text: 'visited Sony HQ — their R&D lab had actual robots walking around', timestamp: new Date().toISOString() },
        { id: '2', text: 'ramen at Ichiran, solo booth dining, everyone faces the wall — so different from eating out back home', timestamp: new Date().toISOString() },
        { id: '3', text: 'used sumimasen to ask for directions and it actually worked, the guy walked me to the station', timestamp: new Date().toISOString() },
        { id: '4', text: 'Shinkansen is insanely on time, like to the second, conductor bows when entering and leaving the car', timestamp: new Date().toISOString() },
      ],
    }
    try {
      const voice = await getVoiceProfile(env.JOURNAL_KV)
      const sections = await generateDraft(env.CLAUDE_API_KEY, testEntry, voice)
      testEntry.sections = sections
      const preview = buildWhatsAppPreview(testEntry, env.APP_URL)
      await sendWhatsApp(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN, env.TWILIO_WHATSAPP_FROM, from, `🧪 *TEST MODE — Day 5 Tokyo mock draft:*\n\n${preview}`)
    } catch (e) {
      await sendWhatsApp(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN, env.TWILIO_WHATSAPP_FROM, from, `⚠️ TEST failed: ${(e as Error).message}`)
    }
    return twimlOk()
  }

  const today = todayJST()
  const tripDay = getDayForDate(today)

  // Outside trip dates — acknowledge but do nothing
  if (!tripDay) {
    await sendWhatsApp(
      env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN,
      env.TWILIO_WHATSAPP_FROM, from,
      `📔 Japan Journal is active May 11–24. See you in Japan! 🇯🇵`
    )
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

  const upperText = text.toUpperCase()

  // Handle DONE / LOOKS GOOD → approve draft and send export link
  if (entry.status === 'reviewing' && (upperText === 'DONE' || upperText.startsWith('LOOKS GOOD'))) {
    entry.status = 'approved'
    await saveDay(env.JOURNAL_KV, entry)
    await sendWhatsApp(
      env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN,
      env.TWILIO_WHATSAPP_FROM, from,
      `✅ *Day ${entry.day} approved!*\n\nOpen to review and export your PDF:\n${env.APP_URL}/day/${entry.day}\n\nDue on Canvas by *8:00 PM* tonight. 🎓`
    )
    return twimlOk()
  }

  // Handle VOICE SETUP → prompt for voice profile
  if (upperText.startsWith('VOICE:')) {
    const profileText = text.slice(6).trim()
    await env.JOURNAL_KV.put('voice_profile', JSON.stringify({
      description: profileText,
      sample: '',
      rules: [],
    }))
    await sendWhatsApp(
      env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN,
      env.TWILIO_WHATSAPP_FROM, from,
      `✅ Voice profile saved! I'll write in your style from now on.`
    )
    return twimlOk()
  }

  // If reviewing → treat message as an edit
  if (entry.status === 'reviewing' && entry.sections) {
    try {
      const voice = await getVoiceProfile(env.JOURNAL_KV)
      const { sections, confirmationMessage } = await applyEdit(
        env.CLAUDE_API_KEY, entry, text, voice
      )
      entry.sections = sections
      await saveDay(env.JOURNAL_KV, entry)
      await sendWhatsApp(
        env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN,
        env.TWILIO_WHATSAPP_FROM, from,
        `${confirmationMessage}\n\nReply *DONE* when ready to export, or keep adding edits.`
      )
    } catch (e) {
      await sendWhatsApp(
        env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN,
        env.TWILIO_WHATSAPP_FROM, from,
        `⚠️ Couldn't process that edit — try again or open the app to edit directly: ${env.APP_URL}/day/${entry.day}`
      )
    }
    return twimlOk()
  }

  // Default: store as a jotting
  const jotting: Jotting = {
    id: crypto.randomUUID(),
    text,
    mediaUrl,
    mediaType,
    timestamp: new Date().toISOString(),
  }
  entry.jottings.push(jotting)
  await saveDay(env.JOURNAL_KV, entry)

  // Silent save — no reply for every jotting (keeps it frictionless)
  // Only confirm if it's their first jotting of the day
  if (entry.jottings.length === 1) {
    await sendWhatsApp(
      env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN,
      env.TWILIO_WHATSAPP_FROM, from,
      `📔 *Day ${entry.day} — ${entry.city}* started! Keep jotting throughout the day. Draft coming at 7:30 PM JST.`
    )
  }

  return twimlOk()
}
