import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import KoiHero from './KoiHero'

type Screen = 'main' | 'admin' | 'reset-request' | 'reset-confirm'

export default function AuthGate() {
  const { loginAsAdmin, loginAsGuest, requestReset, confirmReset, pinIsSet } = useAuth()
  const [screen, setScreen] = useState<Screen>('main')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [resetCode, setResetCode] = useState('')
  const [newPin, setNewPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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
      <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: i < val.length ? '#bd93f9' : '#44475a' }} />
    ))

  const numpad = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
      {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
        <button key={i} onClick={() => k === '⌫' ? del() : k ? addDigit(k) : null}
          disabled={!k}
          style={{ height: 46, borderRadius: 8, border: '1px solid #44475a', background: k ? '#383a4a' : 'transparent', color: k === '⌫' ? '#ff5555' : '#f8f8f2', fontSize: k === '⌫' ? 18 : 20, cursor: k ? 'pointer' : 'default', fontFamily: 'inherit' }}
        >{k}</button>
      ))}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#1e1f29', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative' }}>
      <KoiHero />
      <div style={{ background: 'rgba(40,42,54,0.88)', backdropFilter: 'blur(6px)', border: '1px solid #44475a', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 320, textAlign: 'center', position: 'relative', zIndex: 1 }}>

        <div style={{ fontSize: 36, marginBottom: 6 }}>🇯🇵</div>
        <div style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: 18, color: '#f8f8f2', marginBottom: 2 }}>Japan Journal</div>
        <div style={{ fontSize: 11, color: '#6272a4', marginBottom: 22 }}>ISTM 440 · May 11–24, 2026</div>

        {/* Main screen — guest first */}
        {screen === 'main' && (
          <>
            <button onClick={loginAsGuest} style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#bd93f9', color: '#1e1f29', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Raleway, sans-serif', marginBottom: 10 }}>
              👤 Continue as Guest →
            </button>
            <div style={{ fontSize: 11, color: '#6272a4', marginBottom: 18, lineHeight: 1.5 }}>
              Fill the template · export PDF · submit to Canvas<br />No login needed · saves in your browser
            </div>
            <button onClick={() => { setScreen('admin'); setError('') }}
              style={{ background: 'none', border: 'none', color: '#6272a4', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
              Admin login
            </button>
          </>
        )}

        {/* Admin PIN screen */}
        {screen === 'admin' && (
          <>
            <div style={{ fontSize: 12, color: '#bd93f9', fontWeight: 600, marginBottom: 14 }}>
              {!pinIsSet ? (confirming ? 'Confirm PIN' : 'Set admin PIN') : 'Admin PIN'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>{dots(activePin)}</div>
            {numpad}
            {error && <div style={{ color: '#ff5555', fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <button onClick={handleAdminSubmit} disabled={loading || activePin.length < 4}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: activePin.length >= 4 ? '#bd93f9' : '#383a4a', color: activePin.length >= 4 ? '#1e1f29' : '#6272a4', fontWeight: 700, fontSize: 14, cursor: activePin.length >= 4 ? 'pointer' : 'default', fontFamily: 'Raleway, sans-serif', marginBottom: 10 }}>
              {loading ? 'Checking…' : !pinIsSet ? (confirming ? 'Confirm →' : 'Next →') : 'Unlock →'}
            </button>
            {pinIsSet && (
              <button onClick={() => { setScreen('reset-request'); setError('') }}
                style={{ background: 'none', border: 'none', color: '#6272a4', fontSize: 11, cursor: 'pointer', marginBottom: 8, display: 'block', width: '100%' }}>
                Forgot PIN?
              </button>
            )}
            <button onClick={() => { setScreen('main'); setPin(''); setConfirmPin(''); setConfirming(false); setError('') }}
              style={{ background: 'none', border: 'none', color: '#6272a4', fontSize: 11, cursor: 'pointer' }}>
              ← Back
            </button>
          </>
        )}

        {/* Reset request */}
        {screen === 'reset-request' && (
          <>
            <div style={{ fontSize: 12, color: '#bd93f9', fontWeight: 600, marginBottom: 10 }}>Reset PIN</div>
            <div style={{ fontSize: 12, color: '#6272a4', marginBottom: 20, lineHeight: 1.6 }}>A 6-digit code will be sent to your WhatsApp.</div>
            {error && <div style={{ color: '#ff5555', fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <button onClick={handleResetRequest} disabled={loading}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: '#bd93f9', color: '#1e1f29', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Raleway, sans-serif', marginBottom: 10 }}>
              {loading ? 'Sending…' : 'Send code via WhatsApp'}
            </button>
            <button onClick={() => { setScreen('admin'); setError('') }}
              style={{ background: 'none', border: 'none', color: '#6272a4', fontSize: 11, cursor: 'pointer' }}>← Back</button>
          </>
        )}

        {/* Reset confirm */}
        {screen === 'reset-confirm' && (
          <>
            <div style={{ fontSize: 12, color: '#bd93f9', fontWeight: 600, marginBottom: 8 }}>Enter reset code</div>
            {resetSent && <div style={{ fontSize: 11, color: '#50fa7b', marginBottom: 12 }}>Code sent to WhatsApp ✓</div>}
            <input value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code" inputMode="numeric"
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #6272a4', background: '#21222c', color: '#f8f8f2', fontSize: 18, textAlign: 'center', letterSpacing: 6, marginBottom: 14, boxSizing: 'border-box' }} />
            <div style={{ fontSize: 11, color: '#6272a4', marginBottom: 8 }}>New PIN</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14 }}>{dots(newPin)}</div>
            {numpad}
            {error && <div style={{ color: '#ff5555', fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <button onClick={handleResetConfirm} disabled={loading}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: '#bd93f9', color: '#1e1f29', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Raleway, sans-serif', marginBottom: 10 }}>
              {loading ? 'Verifying…' : 'Set new PIN →'}
            </button>
            <button onClick={() => { setScreen('admin'); setError('') }}
              style={{ background: 'none', border: 'none', color: '#6272a4', fontSize: 11, cursor: 'pointer' }}>← Back</button>
          </>
        )}

      </div>
    </div>
  )
}
