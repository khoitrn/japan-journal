import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

type Screen = 'login' | 'reset-request' | 'reset-confirm'

export default function AuthGate() {
  const { loginAsAdmin, loginAsGuest, requestReset, confirmReset, pinIsSet } = useAuth()
  const [screen, setScreen] = useState<Screen>('login')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [resetCode, setResetCode] = useState('')
  const [newPin, setNewPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const addDigit = (d: string) => {
    if (screen === 'login') {
      if (!pinIsSet && confirming) {
        if (confirmPin.length < 6) setConfirmPin(p => p + d)
      } else {
        if (pin.length < 6) setPin(p => p + d)
      }
    }
    if (screen === 'reset-confirm') {
      if (!newPin || newPin.length >= 6) return
      setNewPin(p => p + d)
    }
  }

  const del = () => {
    if (screen === 'login') {
      if (!pinIsSet && confirming) setConfirmPin(p => p.slice(0, -1))
      else setPin(p => p.slice(0, -1))
    }
    if (screen === 'reset-confirm') setNewPin(p => p.slice(0, -1))
  }

  const handleSubmit = async () => {
    setError('')
    if (!pinIsSet && !confirming) {
      if (pin.length < 4) return setError('PIN must be at least 4 digits')
      setConfirming(true)
      return
    }
    if (!pinIsSet && confirming) {
      if (confirmPin !== pin) { setError('PINs do not match'); setConfirmPin(''); return }
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
    else setError(res.error ?? 'Failed to send code')
  }

  const handleResetConfirm = async () => {
    if (resetCode.length !== 6) return setError('Enter the 6-digit code')
    if (newPin.length < 4) return setError('New PIN must be at least 4 digits')
    setLoading(true)
    const res = await confirmReset(resetCode, newPin)
    setLoading(false)
    if (!res.ok) setError(res.error ?? 'Invalid code')
  }

  const activePin = !pinIsSet && confirming ? confirmPin : pin
  const dots = (val: string, max = 6) =>
    Array.from({ length: max }).map((_, i) => (
      <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: i < val.length ? '#bd93f9' : '#44475a', transition: 'background 0.1s' }} />
    ))

  return (
    <div style={{ minHeight: '100vh', background: '#1e1f29', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#282a36', border: '1px solid #44475a', borderRadius: 16, padding: '32px 28px', width: '100%', maxWidth: 340, textAlign: 'center' }}>

        {/* Logo */}
        <div style={{ fontSize: 40, marginBottom: 8 }}>🇯🇵</div>
        <div style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 700, fontSize: 20, color: '#f8f8f2', marginBottom: 4 }}>Japan Journal</div>
        <div style={{ fontSize: 12, color: '#6272a4', marginBottom: 28 }}>ISTM 440 · May 11–24, 2026</div>

        {/* Login screen */}
        {screen === 'login' && (
          <>
            <div style={{ fontSize: 13, color: '#bd93f9', fontWeight: 600, marginBottom: 20 }}>
              {!pinIsSet ? (confirming ? 'Confirm your PIN' : 'Set your admin PIN') : 'Enter admin PIN'}
            </div>

            {/* PIN dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
              {dots(activePin)}
            </div>

            {/* Numpad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
                <button key={i} onClick={() => k === '⌫' ? del() : k ? addDigit(k) : null}
                  disabled={!k}
                  style={{ height: 52, borderRadius: 10, border: '1px solid #44475a', background: k ? '#383a4a' : 'transparent', color: k === '⌫' ? '#ff5555' : '#f8f8f2', fontSize: k === '⌫' ? 20 : 22, cursor: k ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'background 0.1s' }}
                >
                  {k}
                </button>
              ))}
            </div>

            {error && <div style={{ color: '#ff5555', fontSize: 12, marginBottom: 12 }}>{error}</div>}

            <button onClick={handleSubmit} disabled={loading || activePin.length < 4}
              style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: activePin.length >= 4 ? '#bd93f9' : '#383a4a', color: activePin.length >= 4 ? '#1e1f29' : '#6272a4', fontWeight: 700, fontSize: 15, cursor: activePin.length >= 4 ? 'pointer' : 'default', fontFamily: 'Raleway, sans-serif', marginBottom: 12 }}>
              {loading ? 'Checking…' : !pinIsSet ? (confirming ? 'Confirm PIN' : 'Set PIN →') : 'Unlock →'}
            </button>

            {pinIsSet && (
              <button onClick={() => { setScreen('reset-request'); setError('') }}
                style={{ background: 'none', border: 'none', color: '#6272a4', fontSize: 12, cursor: 'pointer', marginBottom: 16 }}>
                Forgot PIN?
              </button>
            )}

            <div style={{ borderTop: '1px solid #44475a', paddingTop: 16 }}>
              <div style={{ fontSize: 11, color: '#6272a4', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>ISTM 440 classmates</div>
              <button onClick={loginAsGuest}
                style={{ background: '#383a4a', border: '1px solid #6272a4', borderRadius: 10, color: '#f8f8f2', fontSize: 14, fontWeight: 600, padding: '12px 20px', cursor: 'pointer', width: '100%', fontFamily: 'Raleway, sans-serif' }}>
                👤 Continue as Guest →
              </button>
              <div style={{ fontSize: 11, color: '#6272a4', marginTop: 8, lineHeight: 1.5 }}>
                Fill out the 9-section template, export PDF, submit to Canvas.<br />No login · your data stays in your browser.
              </div>
            </div>
          </>
        )}

        {/* Reset request screen */}
        {screen === 'reset-request' && (
          <>
            <div style={{ fontSize: 13, color: '#bd93f9', fontWeight: 600, marginBottom: 12 }}>Reset PIN</div>
            <div style={{ fontSize: 13, color: '#6272a4', marginBottom: 24, lineHeight: 1.6 }}>
              A 6-digit reset code will be sent to your WhatsApp number.
            </div>
            {error && <div style={{ color: '#ff5555', fontSize: 12, marginBottom: 12 }}>{error}</div>}
            <button onClick={handleResetRequest} disabled={loading}
              style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#bd93f9', color: '#1e1f29', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Raleway, sans-serif', marginBottom: 12 }}>
              {loading ? 'Sending…' : 'Send code via WhatsApp'}
            </button>
            <button onClick={() => { setScreen('login'); setError('') }}
              style={{ background: 'none', border: 'none', color: '#6272a4', fontSize: 12, cursor: 'pointer' }}>
              ← Back
            </button>
          </>
        )}

        {/* Reset confirm screen */}
        {screen === 'reset-confirm' && (
          <>
            <div style={{ fontSize: 13, color: '#bd93f9', fontWeight: 600, marginBottom: 8 }}>Enter reset code</div>
            {resetSent && <div style={{ fontSize: 12, color: '#50fa7b', marginBottom: 16 }}>Code sent to your WhatsApp ✓</div>}

            <input value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code" inputMode="numeric"
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #6272a4', background: '#21222c', color: '#f8f8f2', fontSize: 20, textAlign: 'center', letterSpacing: 6, marginBottom: 16, boxSizing: 'border-box' }} />

            <div style={{ fontSize: 12, color: '#6272a4', marginBottom: 8 }}>New PIN</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
              {dots(newPin)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
                <button key={i} onClick={() => k === '⌫' ? del() : k ? addDigit(k) : null}
                  disabled={!k}
                  style={{ height: 48, borderRadius: 10, border: '1px solid #44475a', background: k ? '#383a4a' : 'transparent', color: k === '⌫' ? '#ff5555' : '#f8f8f2', fontSize: k === '⌫' ? 18 : 20, cursor: k ? 'pointer' : 'default', fontFamily: 'inherit' }}
                >
                  {k}
                </button>
              ))}
            </div>

            {error && <div style={{ color: '#ff5555', fontSize: 12, marginBottom: 12 }}>{error}</div>}
            <button onClick={handleResetConfirm} disabled={loading}
              style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#bd93f9', color: '#1e1f29', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Raleway, sans-serif', marginBottom: 12 }}>
              {loading ? 'Verifying…' : 'Set new PIN →'}
            </button>
            <button onClick={() => { setScreen('login'); setError('') }}
              style={{ background: 'none', border: 'none', color: '#6272a4', fontSize: 12, cursor: 'pointer' }}>
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  )
}
