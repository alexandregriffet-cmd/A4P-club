'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type ClubUser = { id: string; firstname?: string|null; lastname?: string|null; email?: string|null; role?: string|null; club_id?: string|null; team_id?: string|null }
type Player = { id: string; firstname?: string|null; lastname?: string|null; email?: string|null; team_id?: string|null }
type Resultat = { id: string; player_id?: string|null; test_type?: string|null; score_global?: number|null; profile_label?: string|null; completed_at?: string|null }

export default function DashboardCoach() {
  const router = useRouter()
  const [clubUser, setClubUser] = useState<ClubUser|null>(null)
  const [equipe, setEquipe] = useState<{id:string;name:string}|null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [resultats, setResultats] = useState<Resultat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: cu } = await supabase.from('club_users').select('*').eq('auth_user_id', user.id).single()
      if (!cu || cu.role !== 'coach') { router.push('/login'); return }
      setClubUser(cu)
      if (cu.team_id) {
        const { data: team } = await supabase.from('teams').select('*').eq('id', cu.team_id).single()
        if (team) setEquipe(team)
        const { data: pls } = await supabase.from('players').select('*').eq('team_id', cu.team_id).order('lastname')
        if (pls) {
          setPlayers(pls)
          const ids = pls.map((p: Player) => p.id)
          if (ids.length > 0) {
            const { data: res } = await supabase.from('resultats').select('*').in('player_id', ids).order('completed_at', { ascending: false })
            if (res) setResultats(res)
          }
        }
      }
      setLoading(false)
    }
    load()
  }, [router])

  const logout = async () => { await supabase.auth.signOut(); router.push('/login') }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 18, color: '#6c7a99' }}>Chargement...</div>

  const name = [clubUser?.firstname, clubUser?.lastname].filter(Boolean).join(' ') || 'Coach'
  const colors: Record<string,string> = { PMP:'#2f4a8a', MPA:'#1a3a6a', CMP:'#1a4a2a', PSYCHO:'#4a1a6a' }

  const playerStats = players.map(p => {
    const res = resultats.filter(r => r.player_id === p.id)
    const moy = res.length > 0 ? Math.round(res.reduce((a, r) => a + (r.score_global || 0), 0) / res.length) : null
    return { player: p, res, moy }
  })

  const teamMoy = playerStats.filter(p => p.moy !== null).length > 0
    ? Math.round(playerStats.filter(p => p.moy !== null).reduce((a, p) => a + (p.moy || 0), 0) / playerStats.filter(p => p.moy !== null).length)
    : null

  const completion = players.length > 0 ? Math.round((playerStats.filter(p => p.res.length > 0).length / players.length) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff' }}>
      <div style={{ background: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 50, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'serif', fontSize: 20, fontWeight: 700, color: '#1B3A6B' }}>A4P · <span style={{ color: '#C9A84C' }}>Diagnostic Club</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: '#2E5BA8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>{name[0]?.toUpperCase()}</div>
          <div><div style={{ fontSize: 14, fontWeight: 700, color: '#1a2a4a' }}>{name}</div><div style={{ fontSize: 11, color: '#6c7a99' }}>👨‍💼 Espace Coach</div></div>
          <button onClick={logout} style={{ padding: '7px 14px', background: 'transparent', border: '1px solid rgba(27,58,107,0.2)', borderRadius: 9, color: '#6c7a99', fontSize: 12, fontWeight: 600 }}>Déconnexion</button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
        <div style={{ background: 'linear-gradient(135deg,#2E5BA8,#4A90D9)', borderRadius: 22, padding: '28px 24px', marginBottom: 20, color: '#fff', textAlign: 'center' }}>
          <div style={{ fontFamily: 'serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>{equipe?.name || 'Mon équipe'}</div>
          <p style={{ opacity: 0.8, fontSize: 15 }}>Suivi des diagnostics mentaux de vos joueurs</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { num: players.length, label: 'Joueurs' },
            { num: resultats.length, label: 'Tests passés' },
            { num: teamMoy !== null ? teamMoy + '%' : '—', label: 'Score moyen équipe' },
            { num: completion + '%', label: 'Taux de complétion' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '18px 12px', textAlign: 'center', boxShadow: '0 3px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontFamily: 'serif', fontSize: 32, fontWeight: 700, color: '#1B3A6B', lineHeight: 1, marginBottom: 4 }}>{s.num}</div>
              <div style={{ fontSize: 11, color: '#6c7a99', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: 22, marginBottom: 16, boxShadow: '0 3px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1a2a4a', marginBottom: 14 }}>👥 Mes joueurs — Résultats individuels</div>
          {playerStats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 28, color: '#a0aec0', fontSize: 14 }}>Aucun joueur dans cette équipe.</div>
          ) : playerStats.map(({ player, res, moy }) => (
            <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: '#f8faff', marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#1B3A6B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                {(player.firstname || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontWeight: 700, color: '#1a2a4a', fontSize: 14 }}>{[player.firstname, player.lastname].filter(Boolean).join(' ') || 'Joueur'}</div>
                <div style={{ fontSize: 11, color: '#6c7a99' }}>{res.length} test(s) · {res.map(r => r.test_type).join(', ') || 'Aucun'}</div>
              </div>
              {moy !== null ? (
                <>
                  <div style={{ flex: 1, minWidth: 80 }}>
                    <div style={{ height: 6, background: '#e8edf5', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#2E5BA8,#4A90D9)', width: `${moy}%` }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1B3A6B', minWidth: 40, textAlign: 'right' }}>{moy}%</div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: '#a0aec0' }}>Pas encore de test</div>
              )}
              <button onClick={() => router.push(`/joueur/${player.id}`)} style={{ padding: '7px 14px', border: '1px solid #C9A84C', borderRadius: 10, background: 'transparent', color: '#C9A84C', fontSize: 12, fontWeight: 700 }}>
                Voir →
              </button>
            </div>
          ))}
        </div>

        {/* Moyenne équipe par test */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 22, boxShadow: '0 3px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1a2a4a', marginBottom: 14 }}>📊 Moyenne équipe par test</div>
          {['PMP', 'MPA', 'CMP', 'PSYCHO'].map(type => {
            const vals = resultats.filter(r => r.test_type === type && r.score_global !== null).map(r => r.score_global as number)
            const avg = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
            return (
              <div key={type} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontWeight: 700, color: '#22366c', fontSize: 13 }}>{type}</span>
                  <span style={{ fontWeight: 800, color: colors[type] }}>{avg !== null ? avg + '%' : '—'}</span>
                </div>
                <div style={{ height: 8, background: '#e8edf5', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 999, background: colors[type], width: avg !== null ? `${avg}%` : '0%', transition: 'width 0.8s ease' }} />
                </div>
                <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 3 }}>{vals.length} joueur(s) ont passé ce test</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
