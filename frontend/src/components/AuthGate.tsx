import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import KoiHero from './KoiHero'

type Screen = 'main' | 'admin' | 'reset-request' | 'reset-confirm'

const muted  = '#e2e8f4'   // near-white — high contrast on dark card, readable at distance
const purple = '#bd93f9'
const red    = '#ff5555'
const green  = '#50fa7b'

export default function AuthGate() {
  const { loginAsAdmin, loginAsGuest, requestReset, confirmReset, pinIsSet } = useAuth()
  const [screen, setScreen]       = useState<Screen>('main')
  const [pin, setPin]             = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [resetCode, setResetCode] = useState('')
  const [newPin, setNewPin]       = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const activePin = !pinIsSet && confirming ? confirmPin : pin

  const addDigit = (d: string) => {
    if (screen === 'admin') {
      if (!pinIsSet && confirming) { if (confirmPin.length < 6) setConfirmPin(p => p + d) }
      else { if (pin.length < 6) setPin(p => p + d) }
    }
    if (screen === 'reset-confirm') { if (newPin.length < 6) setNewPin(p => p + d) }
  }

  const del = () => {
    if (screen === 'admin') {
      if (!pinIsSet && confirming) setConfirmPin(p => p.slice(0, -1))
      else setPin(p => p.slice(0, -1))
    }
    if (screen === 'reset-confirm') setNewPin(p => p.slice(0, -1))
  }

  const handleAdminSubmit = async () => {
    setError('')
    if (!pinIsSet && !confirming) {
      if (pin.length < 4) return setError('At least 4 digits')
      setConfirming(true)
      return
    }
    if (!pinIsSet && confirming && confirmPin !== pin) {
      setError('PINs do not match')
      setConfirmPin('')
      return
    }
    setLoading(true)
    const res = await loginAsAdmin(!pinIsSet && confirming ? confirmPin : pin)
    setLoading(false)
    if (!res.ok) { setError(res.error ?? 'Wrong PIN'); setPin(''); setConfirmPin(''); setConfirming(false) }
  }

  const handleResetRequest = async () => {
    setLoading(true)
    const res = await requestReset()
    setLoading(false)
    if (res.ok) { setResetSent(true); setScreen('reset-confirm') }
    else setError(res.error ?? 'Failed to send')
  }

  const handleResetConfirm = async () => {
    if (resetCode.length !== 6) return setError('Enter the 6-digit code')
    if (newPin.length < 4) return setError('New PIN must be at least 4 digits')
    setLoading(true)
    const res = await confirmReset(resetCode, newPin)
    setLoading(false)
    if (!res.ok) setError(res.error ?? 'Invalid code')
  }

  const dots = (val: string) =>
    Array.from({ length: 6 }).map((_, i) => (
      <div key={i} style={{ width: 13, height: 13, borderRadius: '50%', background: i < val.length ? purple : '#44475a' }} />
    ))

  const numpad = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
      {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
        <button key={i} onClick={() => k === '⌫' ? del() : k ? addDigit(k) : null}
          disabled={!k}
          style={{ height: 50, borderRadius: 8, border: '1px solid #44475a', background: k ? '#383a4a' : 'transparent', color: k === '⌫' ? red : '#f8f8f2', fontSize: k === '⌫' ? 20 : 22, cursor: k ? 'pointer' : 'default', fontFamily: 'inherit' }}
        >{k}</button>
      ))}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#1e1f29', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative' }}>
      <KoiHero />
      <div style={{ background: 'rgba(40,42,54,0.92)', backdropFilter: 'blur(8px)', border: '1px solid #6272a4', borderRadius: 16, padding: '32px 24px', width: '100%', maxWidth: 320, textAlign: 'center', position: 'relative', zIndex: 1 }}>

        <div style={{ fontSize: 48, marginBottom: 10 }}>🇯🇵</div>
        <div style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: 28, color: '#f8f8f2', marginBottom: 6 }}>Japan Journal</div>
        <div style={{ fontSize: 15, color: muted, marginBottom: 28, letterSpacing: '0.03em', fontWeight: 500 }}>ISTM 440 · May 11–24, 2026</div>

        {/* Main screen */}
        {screen === 'main' && (
          <>
            <button onClick={loginAsGuest} style={{ width: '100%', padding: '16px', borderRadius: 10, border: 'none', background: purple, color: '#1e1f29', fontWeight: 700, fontSize: 17, cursor: 'pointer', fontFamily: 'Raleway, sans-serif', marginBottom: 14 }}>
              👤 Continue as Guest →
            </button>
            <div style={{ fontSize: 15, color: muted, marginBottom: 22, lineHeight: 1.7, fontWeight: 500 }}>
              Fill the template · export PDF · submit to Canvas<br />No login needed · saves in your browser
            </div>
            <button onClick={() => { setScreen('admin'); setError('') }}
              style={{ background: 'none', border: 'none', color: muted, fontSize: 14, cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}>
              Admin login
            </button>
          </>
        )}

        {/* Admin PIN screen */}
        {screen === 'admin' && (
          <>
            <div style={{ fontSize: 16, color: purple, fontWeight: 700, marginBottom: 18 }}>
              {!pinIsSet ? (confirming ? 'Confirm PIN' : 'Set admin PIN') : 'Admin PIN'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>{dots(activePin)}</div>
            {numpad}
            {error && <div style={{ color: red, fontSize: 14, marginBottom: 10, fontWeight: 600 }}>{error}</div>}
            <button onClick={handleAdminSubmit} disabled={loading || activePin.length < 4}
              style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: activePin.length >= 4 ? purple : '#383a4a', color: activePin.length >= 4 ? '#1e1f29' : muted, fontWeight: 700, fontSize: 16, cursor: activePin.length >= 4 ? 'pointer' : 'default', fontFamily: 'Raleway, sans-serif', marginBottom: 12 }}>
              {loading ? 'Checking…' : !pinIsSet ? (confirming ? 'Confirm →' : 'Next →') : 'Unlock →'}
            </button>
            {pinIsSet && (
              <button onClick={() => { setScreen('reset-request'); setError('') }}
                style={{ background: 'none', border: 'none', color: muted, fontSize: 14, cursor: 'pointer', marginBottom: 10, display: 'block', width: '100%', fontWeight: 500 }}>
                Forgot PIN?
              </button>
            )}
            <button onClick={() => { setScreen('main'); setPin(''); setConfirmPin(''); setConfirming(false); setError('') }}
              style={{ background: 'none', border: 'none', color: muted, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
              ← Back
            </button>
          </>
        )}

        {/* Reset request */}
        {screen === 'reset-request' && (
          <>
            <div style={{ fontSize: 16, color: purple, fontWeight: 700, marginBottom: 12 }}>Reset PIN</div>
            <div style={{ fontSize: 15, color: muted, marginBottom: 24, lineHeight: 1.7, fontWeight: 500 }}>A 6-digit code will be sent to your WhatsApp.</div>
            {error && <div style={{ color: red, fontSize: 14, marginBottom: 10, fontWeight: 600 }}>{error}</div>}
            <button onClick={handleResetRequest} disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: purple, color: '#1e1f29', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'Raleway, sans-serif', marginBottom: 12 }}>
              {loading ? 'Sending…' : 'Send code via WhatsApp'}
            </button>
            <button onClick={() => { setScreen('admin'); setError('') }}
              style={{ background: 'none', border: 'none', color: muted, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>← Back</button>
          </>
        )}

        {/* Reset confirm */}
        {screen === 'reset-confirm' && (
          <>
            <div style={{ fontSize: 16, color: purple, fontWeight: 700, marginBottom: 10 }}>Enter reset code</div>
            {resetSent && <div style={{ fontSize: 14, color: green, marginBottom: 14, fontWeight: 600 }}>Code sent to WhatsApp ✓</div>}
            <input value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code" inputMode="numeric"
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #6272a4', background: '#21222c', color: '#f8f8f2', fontSize: 22, textAlign: 'center', letterSpacing: 8, marginBottom: 18, boxSizing: 'border-box' }} />
            <div style={{ fontSize: 15, color: muted, marginBottom: 12, fontWeight: 500 }}>New PIN</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 18 }}>{dots(newPin)}</div>
            {numpad}
            {error && <div style={{ color: red, fontSize: 14, marginBottom: 10, fontWeight: 600 }}>{error}</div>}
            <button onClick={handleResetConfirm} disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: purple, color: '#1e1f29', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'Raleway, sans-serif', marginBottom: 12 }}>
              {loading ? 'Verifying…' : 'Set new PIN →'}
            </button>
            <button onClick={() => { setScreen('admin'); setError('') }}
              style={{ background: 'none', border: 'none', color: muted, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>← Back</button>
          </>
        )}

      </div>
    </div>
  )
}
