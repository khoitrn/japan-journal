import { handleWebhook } from './webhook'
import { handleCron } from './cron'
import { getDay, saveDay, getAllDays, saveVoiceProfile, getVoiceProfile } from './kv'
import { isAdmin, handleLogin, handleLogout, handleResetRequest, handleResetConfirm, handleAuthStatus } from './auth'

export interface Env {
  JOURNAL_KV: KVNamespace
  TWILIO_ACCOUNT_SID: string
  TWILIO_AUTH_TOKEN: string
  TWILIO_WHATSAPP_FROM: string
  CLAUDE_API_KEY: string
  USER_PHONE: string
  APP_URL: string
}

function cors(res: Response): Response {
  const headers = new Headers(res.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return new Response(res.body, { status: res.status, headers })
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

    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }))

    // Public — Twilio webhook
    if (pathname === '/webhook' && request.method === 'POST') {
      return handleWebhook(request, env)
    }

    // Public — auth routes
    if (pathname === '/api/auth/status' && request.method === 'GET') return handleAuthStatus(env)
    if (pathname === '/api/auth/login'  && request.method === 'POST') return cors(await handleLogin(request, env))
    if (pathname === '/api/auth/logout' && request.method === 'POST') return cors(await handleLogout(request, env))
    if (pathname === '/api/auth/reset/request' && request.method === 'POST') return cors(await handleResetRequest(env))
    if (pathname === '/api/auth/reset/confirm' && request.method === 'POST') return cors(await handleResetConfirm(request, env))

    // Protected — require admin session
    const admin = await isAdmin(request, env)
    if (!admin) return json({ error: 'unauthorized' }, 401)

    // GET /api/days
    if (pathname === '/api/days' && request.method === 'GET') {
      return json(await getAllDays(env.JOURNAL_KV))
    }

    // GET|POST /api/day/:n
    const dayMatch = pathname.match(/^\/api\/day\/(\d+)$/)
    if (dayMatch) {
      const dayNum = parseInt(dayMatch[1])
      if (request.method === 'GET') {
        const days = await getAllDays(env.JOURNAL_KV)
        return json(days.find(d => d.day === dayNum) ?? null)
      }
      if (request.method === 'POST') {
        const body = await request.json() as Record<string, unknown>
        const days = await getAllDays(env.JOURNAL_KV)
        const entry = days.find(d => d.day === dayNum)
        if (!entry) return json({ error: 'not found' }, 404)
        if (body.sections) entry.sections = body.sections as typeof entry.sections
        if (body.status)   entry.status   = body.status   as typeof entry.status
        await saveDay(env.JOURNAL_KV, entry)
        return json(entry)
      }
    }

    // POST /api/day/:n/export
    const exportMatch = pathname.match(/^\/api\/day\/(\d+)\/export$/)
    if (exportMatch && request.method === 'POST') {
      const dayNum = parseInt(exportMatch[1])
      const days = await getAllDays(env.JOURNAL_KV)
      const entry = days.find(d => d.day === dayNum)
      if (!entry) return json({ error: 'not found' }, 404)
      entry.status = 'exported'
      entry.exportedAt = new Date().toISOString()
      await saveDay(env.JOURNAL_KV, entry)
      return json({ ok: true })
    }

    // GET|POST /api/voice
    if (pathname === '/api/voice') {
      if (request.method === 'GET') return json(await getVoiceProfile(env.JOURNAL_KV))
      if (request.method === 'POST') {
        const profile = await request.json()
        await saveVoiceProfile(env.JOURNAL_KV, profile as Parameters<typeof saveVoiceProfile>[1])
        return json({ ok: true })
      }
    }

    return json({ error: 'not found' }, 404)
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await handleCron(env)
  },
}
