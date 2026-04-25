import type { Env } from './index'
import { sendWhatsApp } from './twilio'

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function randomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Check if a session token is valid
export async function isAdmin(request: Request, env: Env): Promise<boolean> {
  const auth = request.headers.get('Authorization') ?? ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return false
  const val = await env.JOURNAL_KV.get(`session:${token}`)
  return val === 'valid'
}

// POST /api/auth/login  { pin: string }
export async function handleLogin(request: Request, env: Env): Promise<Response> {
  const { pin } = await request.json() as { pin: string }
  if (!pin || !/^\d{4,8}$/.test(pin)) return err('Invalid PIN format')

  const stored = await env.JOURNAL_KV.get('admin_pin_hash')

  // First-time setup — no PIN set yet
  if (!stored) {
    const hash = await hashPin(pin)
    await env.JOURNAL_KV.put('admin_pin_hash', hash)
    const token = crypto.randomUUID()
    await env.JOURNAL_KV.put(`session:${token}`, 'valid', { expirationTtl: 86400 })
    return ok({ token, firstTime: true })
  }

  const hash = await hashPin(pin)
  if (hash !== stored) return err('Incorrect PIN', 401)

  const token = crypto.randomUUID()
  await env.JOURNAL_KV.put(`session:${token}`, 'valid', { expirationTtl: 86400 })
  return ok({ token })
}

// POST /api/auth/logout  — invalidates session
export async function handleLogout(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get('Authorization') ?? ''
  const token = auth.replace('Bearer ', '').trim()
  if (token) await env.JOURNAL_KV.delete(`session:${token}`)
  return ok({ ok: true })
}

// POST /api/auth/reset/request — sends 6-digit code to WhatsApp
export async function handleResetRequest(env: Env): Promise<Response> {
  const code = randomCode()
  await env.JOURNAL_KV.put('reset_code', code, { expirationTtl: 300 }) // 5 min
  await sendWhatsApp(
    env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN,
    env.TWILIO_WHATSAPP_FROM, env.USER_PHONE,
    `🔐 *Japan Journal PIN Reset*\n\nYour reset code is: *${code}*\n\nExpires in 5 minutes. If you didn't request this, ignore it.`
  )
  return ok({ sent: true })
}

// POST /api/auth/reset/confirm  { code: string, newPin: string }
export async function handleResetConfirm(request: Request, env: Env): Promise<Response> {
  const { code, newPin } = await request.json() as { code: string; newPin: string }
  if (!code || !newPin || !/^\d{4,8}$/.test(newPin)) return err('Invalid input')

  const stored = await env.JOURNAL_KV.get('reset_code')
  if (!stored || stored !== code) return err('Invalid or expired code', 401)

  const hash = await hashPin(newPin)
  await env.JOURNAL_KV.put('admin_pin_hash', hash)
  await env.JOURNAL_KV.delete('reset_code')

  const token = crypto.randomUUID()
  await env.JOURNAL_KV.put(`session:${token}`, 'valid', { expirationTtl: 86400 })
  return ok({ token })
}

// GET /api/auth/status — check if PIN has been set up
export async function handleAuthStatus(env: Env): Promise<Response> {
  const pinSet = !!(await env.JOURNAL_KV.get('admin_pin_hash'))
  return ok({ pinSet })
}

function ok(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
}

function err(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
}
