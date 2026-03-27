'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type ClubUser = { id: string; firstname?: string | null; lastname?: string | null; email?: string | null; role?: string | null; club_id?: string | null; team_id?: string | null }
type Player = { id: string; firstname?: string | null; lastname?: string | null; team_id?: string | null }
type Result = { id: string; test_type?: string | null; score_global?: number | null; profile_label?: string | null; completed_at?: string | null; player_id?: string | null }

const TESTS = [
  { key: 'PMP', label: 'PMP', desc: 'Profil Mental de Performance · 120 questions · 8 dimensions', color: '#2f4a8a' },
  { key: 'MPA', label: 'MPA', desc: "Mode Préférentiel d'Action · 100 questions · 4 axes", color: '#1a3a6a' },
  { key: 'CMP', label: 'CMP', desc: 'Compétences Mentales de Performance · 30 situations', color: '#1a4a2a' },
  { key: 'PSYCHO', label: 'PSYCHO', desc: 'Profil Psycho-émotionnel · 50 questions · Neurochimie + ITCA', color: '#4a1a6a' },
]

function topbar(name: string, role: string, onLogout: () => void) {
  return (
    <div style={{ background: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 50, gap: 12, flexWrap: 'wrap' }}>
      <div style={{ fontFamily: 'serif', fontSize: 20, fontWeight: 700, color: '#1B3A6B' }}>A4P · <span style={{ color: '#C9A84C' }}>Diagnostic Club</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: '#1B3A6B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>{name[0]?.toUpperCase()}</div>
        <div><div style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{name}</div><div style={{ fontSize: 11, color: '#6c7a99' }}>🎮 Espace Joueur</div></div>
        <button onClick={onLogout} style={{ padding: '7px 14px', background: 'transparent', border: '1px solid rgba(27,58,107,0.2)', borderRadius: 9, color: '#6c7a99', fontSize: 12, fontWeight: 600 }}>Déconnexion</button>
      </div>
    </div>
  )
}

export default function DashboardJoueur() {
  const router = useRouter()
  const [clubUser, setClubUser] = useState<ClubUser | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [resultats, setResultats] = useState<Result[]>([])
  const [equipe, setEquipe] = useState<string>('—')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: cu } = await supabase.from('club_users').select('*').eq('auth_user_id', user.id).single()
      if (!cu) { router.push('/login'); return }
      if (cu.role !== 'player') { router.push('/login'); return }
      setClubUser(cu)
      const { data: pl } = await supabase.from('players').select('*').eq('club_user_id', cu.id).single()
      if (pl) {
        setPlayer(pl)
        if (pl.team_id) {
          const { data: team } = await supabase.from('teams').select('name').eq('id', pl.team_id).single()
          if (team) setEquipe(team.name)
        }
        const { data: res } = await supabase.from('resultats').select('*').eq('player_id', pl.id).order('completed_at', { ascending: false })
        if (res) setResultats(res)
      }
      setLoading(false)
    }
    load()
  }, [router])

  const logout = async () => { await supabase.auth.signOut(); router.push('/login') }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 18, color: '#6c7a99' }}>Chargement...</div>

  const name = [clubUser?.firstname, clubUser?.lastname].filter(Boolean).join(' ') || clubUser?.email || 'Joueur'
  const done = resultats.length
  const moy = done > 0 ? Math.round(resultats.reduce((a, r) => a + (r.score_global || 0), 0) / done) : null
  const colors: Record<string, string> = { PMP: '#2f4a8a', MPA: '#1a3a6a', CMP: '#1a4a2a', PSYCHO: '#4a1a6a' }
  const doneTypes = [...new Set(resultats.map(r => r.test_type))]

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff' }}>
      {topbar(name, 'Joueur', logout)}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 20 }}>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg,#1B3A6B,#2E5BA8)', borderRadius: 22, padding: '28px 24px', marginBottom: 20, color: '#fff', textAlign: 'center' }}>
          <div style={{ fontFamily: 'serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Mon tableau de bord</div>
          <p style={{ opacity: 0.8, fontSize: 15 }}>Bonjour {clubUser?.firstname} — prêt pour tes diagnostics ?</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
          {[
            { num: done, label: 'Tests complétés' },
            { num: 4, label: 'Disponibles' },
            { num: moy !== null ? moy + '%' : '—', label: 'Score moyen' },
            { num: equipe, label: 'Mon équipe', small: true },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '18px 12px', textAlign: 'center', boxShadow: '0 3px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontFamily: 'serif', fontSize: s.small ? 13 : 32, fontWeight: 700, color: '#1B3A6B', lineHeight: 1, marginBottom: 4, paddingTop: s.small ? 6 : 0 }}>{s.num}</div>
              <div style={{ fontSize: 11, color: '#6c7a99', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tests */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 22, marginBottom: 16, boxShadow: '0 3px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1a2a4a', marginBottom: 14 }}>📊 Mes 4 diagnostics A4P</div>
          {TESTS.map(t => (
            <div key={t.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 14, marginBottom: 10, border: '1px solid #e8edf5', background: '#f8faff', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ width: 4, height: 44, borderRadius: 4, background: t.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#1a2a4a', fontSize: 15 }}>{t.label}</div>
                <div style={{ fontSize: 12, color: '#6c7a99', marginTop: 2 }}>{t.desc}</div>
              </div>
              <span style={{ background: doneTypes.includes(t.key) ? '#e0f2fe' : '#dcfce7', color: doneTypes.includes(t.key) ? '#0369a1' : '#16a34a', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>
                {doneTypes.includes(t.key) ? '✅ Complété' : '✅ Disponible'}
              </span>
              <button
                onClick={() => router.push(`/test/${t.key.toLowerCase()}${player ? '?player_id=' + player.id : ''}`)}
                style={{ padding: '9px 18px', borderRadius: 11, border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, background: t.color }}
              >
                {doneTypes.includes(t.key) ? 'Repasser →' : 'Démarrer →'}
              </button>
            </div>
          ))}
        </div>

        {/* Résultats */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 22, boxShadow: '0 3px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1a2a4a', marginBottom: 14 }}>📈 Mes résultats</div>
          {resultats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 28, color: '#a0aec0', fontSize: 14 }}>Aucun test complété pour l'instant.</div>
          ) : resultats.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderRadius: 13, background: '#f8faff', marginBottom: 8, flexWrap: 'wrap' }}>
              <div style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, color: '#fff', background: colors[r.test_type || ''] || '#1B3A6B', flexShrink: 0 }}>{r.test_type}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#1a2a4a', fontSize: 14 }}>{r.profile_label || 'Résultat'}</div>
                <div style={{ fontSize: 11, color: '#6c7a99' }}>{r.completed_at ? new Date(r.completed_at).toLocaleDateString('fr-FR') : '—'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 80, height: 6, background: '#e8edf5', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 999, background: colors[r.test_type || ''] || '#1B3A6B', width: `${r.score_global || 0}%` }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1B3A6B' }}>{r.score_global || '—'}%</div>
              </div>
              <button onClick={() => router.push(`/resultats/${r.id}`)} style={{ padding: '6px 12px', border: '1px solid #C9A84C', borderRadius: 10, background: 'transparent', color: '#C9A84C', fontSize: 12, fontWeight: 700 }}>
                Voir →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
