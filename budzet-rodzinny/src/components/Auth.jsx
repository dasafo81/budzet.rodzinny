import { useState, useEffect } from 'react'
import { sb } from '../supabase'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRecovery, setIsRecovery] = useState(false)

  useEffect(() => {
    // Sprawdź czy użytkownik kliknął w link resetowania hasła
    const hash = window.location.hash
    if (hash.includes('type=recovery') || hash.includes('type=magiclink')) {
      setIsRecovery(true)
      setError('Ustaw nowe hasło dla swojego konta')
    }
  }, [])

  const handle = async () => {
    setError(''); setLoading(true)
    if (mode === 'login') {
      const { error } = await sb.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else if (mode === 'register') {
      const { error } = await sb.auth.signUp({ email, password, options: { data: { name } } })
      if (error) setError(error.message)
      else setError('Sprawdź email i kliknij link potwierdzający.')
    } else if (mode === 'forgot') {
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      })
      if (error) setError(error.message)
      else {
        setError('Link do resetowania hasła został wysłany na email!')
        setTimeout(() => setMode('login'), 3000)
      }
    }
    setLoading(false)
  }

  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      setError('Hasła nie są identyczne')
      return
    }
    if (newPassword.length < 6) {
      setError('Hasło musi mieć minimum 6 znaków')
      return
    }
    setLoading(true)
    const { error } = await sb.auth.updateUser({ password: newPassword })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setError('Hasło zostało zmienione! Za chwilę zostaniesz zalogowany.')
      setTimeout(() => window.location.href = '/', 2000)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="logo" style={{ fontSize:22, marginBottom:8 }}>budżet<span>.</span>rodzinny</div>
        
        {isRecovery ? (
          // Formularz resetowania hasła
          <>
            <div style={{ fontSize:14, color:'var(--text2)', marginBottom:24 }}>
              Ustaw nowe hasło
            </div>
            <div className="ff" style={{ marginBottom:12 }}>
              <label>Nowe hasło</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="minimum 6 znaków" />
            </div>
            <div className="ff" style={{ marginBottom:16 }}>
              <label>Powtórz hasło</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="powtórz hasło" onKeyDown={e => e.key === 'Enter' && handlePasswordReset()} />
            </div>
            <button className="btn-primary" onClick={handlePasswordReset} disabled={loading}>
              {loading ? 'Zapisywanie...' : 'Zmień hasło'}
            </button>
            {error && <div className="auth-err" style={{ color: error.includes('zostało') ? '#22c55e' : '#ef4444' }}>{error}</div>}
          </>
        ) : mode === 'forgot' ? (
          // Formularz przypomnienia hasła
          <>
            <div style={{ fontSize:14, color:'var(--text2)', marginBottom:24 }}>
              Resetowanie hasła
            </div>
            <div className="ff" style={{ marginBottom:16 }}>
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="twoj@email.pl" onKeyDown={e => e.key === 'Enter' && handle()} />
            </div>
            <button className="btn-primary" onClick={handle} disabled={loading}>
              {loading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
            </button>
            {error && <div className="auth-err" style={{ color: error.includes('wysłany') ? '#22c55e' : '#ef4444' }}>{error}</div>}
            <div style={{ textAlign:'center', marginTop:12, fontSize:13, color:'var(--text2)' }}>
              <span><a style={{ color:'var(--accent)', cursor:'pointer' }} onClick={() => setMode('login')}>Wróć do logowania</a></span>
            </div>
          </>
        ) : (
          // Normalny login/register
          <>
            <div style={{ fontSize:14, color:'var(--text2)', marginBottom:24 }}>
              {mode === 'login' ? 'Zaloguj się' : 'Utwórz konto'}
            </div>
            {mode === 'register' && (
              <div className="ff" style={{ marginBottom:12 }}>
                <label>Imię</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="np. Damian" />
              </div>
            )}
            <div className="ff" style={{ marginBottom:12 }}>
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="twoj@email.pl" />
            </div>
            <div className="ff" style={{ marginBottom:16 }}>
              <label>Hasło</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handle()} />
            </div>
            <button className="btn-primary" onClick={handle} disabled={loading}>
              {loading ? 'Proszę czekać...' : mode === 'login' ? 'Zaloguj się' : 'Utwórz konto'}
            </button>
            {error && <div className="auth-err">{error}</div>}
            <div style={{ textAlign:'center', marginTop:12, fontSize:13, color:'var(--text2)' }}>
              {mode === 'login' ? (
                <>
                  <div style={{ marginBottom:8 }}>
                    <a style={{ color:'var(--accent)', cursor:'pointer' }} onClick={() => setMode('forgot')}>Zapomniałeś hasła?</a>
                  </div>
                  <span>Nie masz konta? <a style={{ color:'var(--accent)', cursor:'pointer' }} onClick={() => setMode('register')}>Zarejestruj się</a></span>
                </>
              ) : (
                <span>Masz konto? <a style={{ color:'var(--accent)', cursor:'pointer' }} onClick={() => setMode('login')}>Zaloguj się</a></span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
