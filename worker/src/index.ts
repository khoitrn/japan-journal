import { handleWebhook } from './webhook'
import { handleCron } from './cron'
import {
  getDay, getAllDays, upsertDay,
  insertPhoto, deletePhoto, countPhotos,
  getVoiceProfile, saveVoiceProfile,
} from './db'
import { getAllDays as getAllDaysKV, getVoiceProfile as getVoiceProfileKV } from './kv'
import { isAdmin, handleLogin, handleLogout, handleResetRequest, handleResetConfirm, handleAuthStatus } from './auth'
import { TRIP_DAYS } from './trip'

export interface Env {
  JOURNAL_KV:  KVNamespace   // kept for migration endpoint
  DB:          D1Database
  PHOTOS_R2:   R2Bucket
  TWILIO_ACCOUNT_SID: string
  TWILIO_AUTH_TOKEN:  string
  TWILIO_WHATSAPP_FROM: string
  CLAUDE_API_KEY: string
  USER_PHONE: string
  APP_URL:    string
  SKIP_TWILIO?: string
}

function cors(res: Response): Response {
  const h = new Headers(res.headers)
  h.set('Access-Control-Allow-Origin', '*')
  h.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  h.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return new Response(res.body, { status: res.status, headers: h })
}

function json(data: unknown, status = 200): Response {
  return cors(new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }))
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const { pathname } = url
    const base = url.origin

    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }))

    // Public — Twilio webhook
    if (pathname === '/webhook' && request.method === 'POST') {
      return handleWebhook(request, env)
    }

    // Public — serve photos from R2 (no auth required)
    if (pathname.startsWith('/api/photos/') && request.method === 'GET') {
      const key = pathname.slice('/api/photos/'.length)
      const obj = await env.PHOTOS_R2.get(key)
      if (!obj) return new Response('Not found', { status: 404 })
      return new Response(obj.body, {
        headers: {
          'Content-Type': obj.httpMetadata?.contentType ?? 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Public — auth routes
    if (pathname === '/api/auth/status' && request.method === 'GET')  return handleAuthStatus(env)
    if (pathname === '/api/auth/login'  && request.method === 'POST') return cors(await handleLogin(request, env))
    if (pathname === '/api/auth/logout' && request.method === 'POST') return cors(await handleLogout(request, env))
    if (pathname === '/api/auth/reset/request' && request.method === 'POST') return cors(await handleResetRequest(env))
    if (pathname === '/api/auth/reset/confirm' && request.method === 'POST') return cors(await handleResetConfirm(request, env))

    // All routes below require admin
    const admin = await isAdmin(request, env)
    if (!admin) return json({ error: 'unauthorized' }, 401)

    // GET /api/days
    if (pathname === '/api/days' && request.method === 'GET') {
      return json(await getAllDays(env.DB, base))
    }

    // GET|POST /api/day/:n
    const dayMatch = pathname.match(/^\/api\/day\/(\d+)$/)
    if (dayMatch) {
      const dayNum = parseInt(dayMatch[1])
      const tripDay = TRIP_DAYS.find(d => d.day === dayNum)
      if (!tripDay) return json({ error: 'not found' }, 404)

      if (request.method === 'GET') {
        const entry = await getDay(env.DB, dayNum, base)
        return json(entry)
      }

      if (request.method === 'POST') {
        const body = await request.json() as Record<string, unknown>
        let entry = await getDay(env.DB, dayNum)
        if (!entry) entry = { day: dayNum, date: tripDay.date, city: tripDay.city, status: 'jotting', jottings: [] }
        if (body.sections) {
          const incoming = body.sections as { photos?: Array<{ id?: string; caption: string }> } & Record<string, unknown>
          // Strip photos from sections — they live in the photos table
          entry.sections = { ...incoming, photos: [] } as unknown as typeof entry.sections
          // Update captions for existing R2 photos
          const photoUpdates = (incoming.photos ?? []).filter(p => p.id).map(p => ({ id: p.id!, caption: p.caption }))
          await upsertDay(env.DB, entry, photoUpdates)
        } else {
          if (body.status) entry.status = body.status as typeof entry.status
          await upsertDay(env.DB, entry)
        }
        // Return full entry with photo URLs
        return json(await getDay(env.DB, dayNum, base))
      }
    }

    // POST /api/day/:n/export
    const exportMatch = pathname.match(/^\/api\/day\/(\d+)\/export$/)
    if (exportMatch && request.method === 'POST') {
      const dayNum = parseInt(exportMatch[1])
      const entry = await getDay(env.DB, dayNum)
      if (!entry) return json({ error: 'not found' }, 404)
      entry.status = 'exported'
      entry.exportedAt = new Date().toISOString()
      await upsertDay(env.DB, entry)
      return json({ ok: true })
    }

    // POST /api/photos/:dayNum — upload a photo to R2
    const photoUploadMatch = pathname.match(/^\/api\/photos\/(\d+)$/)
    if (photoUploadMatch && request.method === 'POST') {
      const dayNum = parseInt(photoUploadMatch[1])
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      if (!file) return json({ error: 'no file' }, 400)

      const id = crypto.randomUUID()
      const ext = file.type === 'image/png' ? 'png' : 'jpg'
      const r2Key = `day-${dayNum}/${id}.${ext}`

      await env.PHOTOS_R2.put(r2Key, file.stream(), {
        httpMetadata: { contentType: file.type || 'image/jpeg' },
      })

      const position = await countPhotos(env.DB, dayNum)
      await insertPhoto(env.DB, id, dayNum, r2Key, '', position)

      return json({ id, url: `${base}/api/photos/${r2Key}` })
    }

    // DELETE /api/photos/:id — remove a photo
    const photoDeleteMatch = pathname.match(/^\/api\/photos\/([0-9a-f-]{36})$/)
    if (photoDeleteMatch && request.method === 'DELETE') {
      const r2Key = await deletePhoto(env.DB, photoDeleteMatch[1])
      if (r2Key) await env.PHOTOS_R2.delete(r2Key)
      return json({ ok: true })
    }

    // GET|POST /api/voice
    if (pathname === '/api/voice') {
      if (request.method === 'GET') return json(await getVoiceProfile(env.DB))
      if (request.method === 'POST') {
        const profile = await request.json()
        await saveVoiceProfile(env.DB, profile as Parameters<typeof saveVoiceProfile>[1])
        return json({ ok: true })
      }
    }

    // POST /api/migrate — one-time KV → D1 migration (admin only)
    if (pathname === '/api/migrate' && request.method === 'POST') {
      const days = await getAllDaysKV(env.JOURNAL_KV)
      let migrated = 0
      for (const day of days) {
        if (day.sections) day.sections.photos = []  // photos must be re-uploaded to R2
        await upsertDay(env.DB, day)
        migrated++
      }
      const voice = await getVoiceProfileKV(env.JOURNAL_KV)
      if (voice) await saveVoiceProfile(env.DB, voice)
      return json({ ok: true, migrated })
    }

    return json({ error: 'not found' }, 404)
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await handleCron(env)
  },
}
