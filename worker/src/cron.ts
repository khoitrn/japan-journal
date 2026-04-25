import { getDay, saveDay, getVoiceProfile } from './kv'
import { generateDraft, buildWhatsAppPreview } from './claude'
import { sendWhatsApp } from './twilio'
import { getDayForDate, todayJST } from './trip'
import type { Env } from './index'

export async function handleCron(env: Env): Promise<void> {
  const today = todayJST()
  const tripDay = getDayForDate(today)

  // Not a trip day — skip
  if (!tripDay) return

  let entry = await getDay(env.JOURNAL_KV, today)

  // No jottings at all — still generate an empty draft and remind them
  if (!entry) {
    entry = {
      day: tripDay.day,
      date: today,
      city: tripDay.city,
      status: 'jotting',
      jottings: [],
    }
  }

  // Already approved or exported — skip
  if (entry.status === 'approved' || entry.status === 'exported') return

  try {
    const voice = await getVoiceProfile(env.JOURNAL_KV)
    const sections = await generateDraft(env.CLAUDE_API_KEY, entry, voice)
    entry.sections = sections
    entry.status = 'reviewing'
    entry.draftGeneratedAt = new Date().toISOString()
    await saveDay(env.JOURNAL_KV, entry)

    const preview = buildWhatsAppPreview(entry, env.APP_URL)
    await sendWhatsApp(
      env.TWILIO_ACCOUNT_SID,
      env.TWILIO_AUTH_TOKEN,
      env.TWILIO_WHATSAPP_FROM,
      env.USER_PHONE,
      preview
    )
  } catch (e) {
    // If AI fails, still notify the user to fill manually
    await sendWhatsApp(
      env.TWILIO_ACCOUNT_SID,
      env.TWILIO_AUTH_TOKEN,
      env.TWILIO_WHATSAPP_FROM,
      env.USER_PHONE,
      `📔 *Day ${tripDay.day} — ${tripDay.city}*\n\nTime to write your journal! Open the app to fill it in:\n${env.APP_URL}/day/${tripDay.day}\n\nDue on Canvas by *8:00 PM* tonight.`
    )
  }
}
