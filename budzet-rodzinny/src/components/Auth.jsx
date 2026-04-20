import { useState } from 'react'
import { sb } from '../supabase'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setError(''); setLoading(true)
    if (mode === 'login') {
      const { error } = await sb.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await sb.auth.signUp({ email, password, options: { data: { name } } })
      if (error) setError(error.message)
      else setError('Sprawdź email i kliknij link potwierdzający.')
    }
    setLoading(false)
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="logo" style={{ fontSize:22, marginBottom:8 }}>budżet<span>.</span>rodzinny</div>
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
          {mode === 'login'
            ? <span>Nie masz konta? <a style={{ color:'var(--accent)', cursor:'pointer' }} onClick={() => setMode('register')}>Zarejestruj się</a></span>
            : <span>Masz konto? <a style={{ color:'var(--accent)', cursor:'pointer' }} onClick={() => setMode('login')}>Zaloguj się</a></span>}
        </div>
      </div>
    </div>
  )
}
