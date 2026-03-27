'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) { setError('Veuillez remplir tous les champs.'); return }
    setLoading(true); setError('')
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(), password
      })
      if (authError || !data.user) { setError('Email ou mot de passe incorrect.'); setLoading(false); return }
      const { data: clubUser, error: clubError } = await supabase
        .from('club_users').select('role').eq('auth_user_id', data.user.id).eq('is_active', true).single()
      if (clubError || !clubUser) {
        await supabase.auth.signOut()
        setError("Aucun accès club associé. Contactez votre administrateur.")
        setLoading(false); return
      }
      if (clubUser.role === 'player') router.push('/dashboard/joueur')
      else if (clubUser.role === 'coach') router.push('/dashboard/coach')
      else if (clubUser.role === 'club_admin') router.push('/dashboard/dirigeant')
      else if (clubUser.role === 'a4p_admin') router.push('/dashboard/admin')
      else router.push('/dashboard/joueur')
    } catch (e: any) { setError(e?.message || 'Erreur inconnue.'); setLoading(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 12, color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box'
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1628 0%, #0f2244 40%, #1a3560 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 28, padding: '44px 36px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo-a4p.png" alt="A4P" style={{
            width: 80, height: 80, borderRadius: 18, objectFit: 'cover',
            display: 'block', margin: '0 auto 14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }} />
          <div style={{ fontFamily: 'serif', fontSize: 12, letterSpacing: '0.4em', color: '#4A90D9', textTransform: 'uppercase', marginBottom: 6 }}>
            Académie de Performances
          </div>
          <div style={{ fontFamily: 'serif', fontSize: 24, fontWeight: 700, color: '#fff' }}>
            A4P · <span style={{ color: '#C9A84C' }}>Diagnostic Club</span>
          </div>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', marginBottom: 28 }} />

        <div style={{ fontFamily: 'serif', fontSize: 20, fontWeight: 600, color: '#fff', textAlign: 'center', marginBottom: 24 }}>
          Connexion à votre espace
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 7 }}>
            Adresse email
          </label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="votre@email.com" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 7 }}>
            Mot de passe
          </label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••" style={inputStyle} />
        </div>

        <button onClick={handleLogin} disabled={loading} style={{
          width: '100%', padding: 15,
          background: loading ? 'rgba(46,91,168,0.6)' : 'linear-gradient(135deg, #2E5BA8, #4A90D9)',
          color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', borderRadius: 13,
          opacity: loading ? 0.7 : 1
        }}>
          {loading ? 'Connexion en cours...' : 'Se connecter →'}
        </button>

        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: 11, padding: '11px 15px', color: '#fca5a5', fontSize: 13, textAlign: 'center', marginTop: 12
          }}>
            {error}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 28, fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>
          ACADÉMIE DE PERFORMANCES · A4P · Plateforme Club Sécurisée
        </div>
      </div>
    </main>
  )
}
