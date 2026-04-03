import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)

    if (tab === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg({ type: 'error', text: error.message })
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMsg({ type: 'error', text: error.message })
      else setMsg({ type: 'success', text: '✅ Account created! Check your email to confirm, then log in.' })
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, background: 'var(--bg)', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 80% 60% at 20% 20%, rgba(245,158,11,0.07) 0%, transparent 55%),
          radial-gradient(ellipse 60% 50% at 80% 80%, rgba(99,102,241,0.05) 0%, transparent 55%)
        `
      }} />

      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 'var(--r3)', padding: '44px 40px', width: '100%', maxWidth: 400,
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg,#f5a623,#c87a00)',
            borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 8px 28px rgba(245,166,35,.32)',
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#0a0a0f">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22" fill="none" stroke="#0a0a0f" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{
            fontSize: 32, fontWeight: 900, letterSpacing: '-0.8px',
            background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>RentFlow</div>
          <div style={{ fontSize: 14, color: 'var(--text3)', marginTop: 6 }}>
            Smart rental management for modern landlords
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', background: 'var(--bg3)', borderRadius: 10,
          padding: 3, marginBottom: 24, gap: 3,
        }}>
          {['login', 'signup'].map(t => (
            <button key={t} onClick={() => { setTab(t); setMsg(null) }} style={{
              flex: 1, textAlign: 'center', padding: '9px', borderRadius: 9,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif', transition: 'all .15s', border: '1px solid',
              background: tab === t ? 'var(--bg4)' : 'transparent',
              color: tab === t ? 'var(--gold2)' : 'var(--text3)',
              borderColor: tab === t ? 'rgba(245,166,35,.22)' : 'transparent',
            }}>
              {t === 'login' ? '🔑  Log In' : '✨  Sign Up'}
            </button>
          ))}
        </div>

        {msg && (
          <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email" className="form-input" required
              placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Password</label>
            <input
              type="password" className="form-input" required
              placeholder={tab === 'signup' ? 'Min 6 characters' : '••••••••'}
              value={password} onChange={e => setPassword(e.target.value)}
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-gold btn-full" disabled={loading}>
            {loading ? 'Please wait…' : tab === 'login' ? 'Log In →' : 'Create Account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 20 }}>
          🔒 Secured by Supabase Row Level Security · Your data is private
        </p>
      </div>
    </div>
  )
}
