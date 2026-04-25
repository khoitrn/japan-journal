import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Role = 'none' | 'guest' | 'admin'

interface AuthCtx {
  role: Role
  token: string | null
  loginAsAdmin: (pin: string) => Promise<{ ok: boolean; error?: string; firstTime?: boolean }>
  loginAsGuest: () => void
  logout: () => void
  requestReset: () => Promise<{ ok: boolean; error?: string }>
  confirmReset: (code: string, newPin: string) => Promise<{ ok: boolean; error?: string }>
  pinIsSet: boolean
}

const Ctx = createContext<AuthCtx | null>(null)
const BASE = import.meta.env.VITE_WORKER_URL ?? 'http://localhost:8787'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('none')
  const [token, setToken] = useState<string | null>(null)
  const [pinIsSet, setPinIsSet] = useState(true)

  useEffect(() => {
    // Restore session from sessionStorage
    const saved = sessionStorage.getItem('admin_token')
    if (saved) { setToken(saved); setRole('admin') }
    else if (sessionStorage.getItem('guest') === '1') setRole('guest')

    // Check if PIN is set up
    fetch(`${BASE}/api/auth/status`)
      .then(r => r.json())
      .then((d: { pinSet: boolean }) => setPinIsSet(d.pinSet))
      .catch(() => {})
  }, [])

  const loginAsAdmin = async (pin: string) => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    const data = await res.json() as { token?: string; error?: string; firstTime?: boolean }
    if (!res.ok) return { ok: false, error: data.error ?? 'Wrong PIN' }
    sessionStorage.setItem('admin_token', data.token!)
    setToken(data.token!)
    setRole('admin')
    setPinIsSet(true)
    return { ok: true, firstTime: data.firstTime }
  }

  const loginAsGuest = () => {
    sessionStorage.setItem('guest', '1')
    setRole('guest')
  }

  const logout = () => {
    if (token) {
      fetch(`${BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    sessionStorage.removeItem('admin_token')
    sessionStorage.removeItem('guest')
    setToken(null)
    setRole('none')
  }

  const requestReset = async () => {
    const res = await fetch(`${BASE}/api/auth/reset/request`, { method: 'POST' })
    const data = await res.json() as { sent?: boolean; error?: string }
    if (!res.ok) return { ok: false, error: data.error }
    return { ok: true }
  }

  const confirmReset = async (code: string, newPin: string) => {
    const res = await fetch(`${BASE}/api/auth/reset/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, newPin }),
    })
    const data = await res.json() as { token?: string; error?: string }
    if (!res.ok) return { ok: false, error: data.error }
    sessionStorage.setItem('admin_token', data.token!)
    setToken(data.token!)
    setRole('admin')
    return { ok: true }
  }

  return (
    <Ctx.Provider value={{ role, token, loginAsAdmin, loginAsGuest, logout, requestReset, confirmReset, pinIsSet }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
