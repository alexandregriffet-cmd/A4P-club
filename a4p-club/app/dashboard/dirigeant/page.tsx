'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type ClubUser = { id: string; firstname?: string|null; lastname?: string|null; role?: string|null; club_id?: string|null }
type Team = { id: string; name?: string|null; category?: string|null; season?: string|null }
type Player = { id: string; firstname?: string|null; lastname?: string|null; team_id?: string|null }
type Resultat = { id: string; player_id?: string|null; score_global?: number|null; test_type?: string|null }

export default function DashboardDirigeant() {
  const router = useRouter()
  const [clubUser, setClubUser] = useState<ClubUser|null>(null)
  const [club, setClub] = useState<{id:string;name:string}|null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [resultats, setResultats] = useState<Resultat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: cu } = await supabase.from('club_users').select('*').eq('auth_user_id', user.id).single()
      if (!cu || cu.role !== 'club_admin') { router.push('/login'); return }
      setClubUser(cu)
      if (cu.club_id) {
        const { data: cl } = await supabase.from('clubs').select('*').eq('id', cu.club_id).single()
        if (cl) setClub(cl)
        const { data: tms } = await supabase.from('teams').select('*').eq('club_id', cu.club_id).order('name')
        if (tms) setTeams(tms)
        const { data: pls } = await supabase.from('players').select('*').eq('club_id', cu.club_id)
        if (pls) {
          setPlayers(pls)
          const ids = pls.map((p: Player) => p.id)
          if (ids.length > 0) {
            const { data: res } = await supabase.from('resultats').select('*').in('player_id', ids)
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

  const name = [clubUser?.firstname, clubUser?.lastname].filter(Boolean).join(' ') || 'Dirigeant'
  const scoreClub = resultats.length > 0 ? Math.round(resultats.reduce((a, r) => a + (r.score_global || 0), 0) / resultats.length) : null

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff' }}>
      <div style={{ background: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 50, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'serif', fontSize: 20, fontWeight: 700, color: '#1B3A6B' }}>A4P · <span style={{ color: '#C9A84C' }}>Diagnostic Club</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: '#1a6a5a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>{name[0]?.toUpperCase()}</div>
          <div><div style={{ fontSize: 14, fontWeight: 700 }}>{name}</div><div style={{ fontSize: 11, color: '#6c7a99' }}>🏛️ Espace Dirigeant</div></div>
          <button onClick={logout} style={{ padding: '7px 14px', background: 'transparent', border: '1px solid rgba(27,58,107,0.2)', borderRadius: 9, color: '#6c7a99', fontSize: 12, fontWeight: 600 }}>Déconnexion</button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
        <div style={{ background: 'linear-gradient(135deg,#1a4a2a,#1a6a5a)', borderRadius: 22, padding: '28px 24px', marginBottom: 20, color: '#fff', textAlign: 'center' }}>
          <div style={{ fontFamily: 'serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>{club?.name || 'Mon club'}</div>
          <p style={{ opacity: 0.8, fontSize: 15 }}>Vue globale de toutes vos équipes</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { num: teams.length, label: 'Équipes' },
            { num: players.length, label: 'Joueurs' },
            { num: resultats.length, label: 'Tests complétés' },
            { num: scoreClub !== null ? scoreClub + '%' : '—', label: 'Score moyen club' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '18px 12px', textAlign: 'center', boxShadow: '0 3px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontFamily: 'serif', fontSize: 32, fontWeight: 700, color: '#1a6a5a', lineHeight: 1, marginBottom: 4 }}>{s.num}</div>
              <div style={{ fontSize: 11, color: '#6c7a99', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: 22, boxShadow: '0 3px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1a2a4a', marginBottom: 14 }}>🏆 Mes équipes</div>
          {teams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 28, color: '#a0aec0' }}>Aucune équipe dans ce club.</div>
          ) : teams.map(team => {
            const teamPlayers = players.filter(p => p.team_id === team.id)
            const teamRes = resultats.filter(r => teamPlayers.some(p => p.id === r.player_id))
            const teamMoy = teamRes.length > 0 ? Math.round(teamRes.reduce((a, r) => a + (r.score_global || 0), 0) / teamRes.length) : null
            return (
              <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: '#f8faff', marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#1a6a5a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>
                  {(team.name || 'E')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#1a2a4a', fontSize: 14 }}>{team.name}</div>
                  <div style={{ fontSize: 11, color: '#6c7a99' }}>{teamPlayers.length} joueur(s) · {teamRes.length} test(s) · {team.category || ''}</div>
                </div>
                {teamMoy !== null ? (
                  <>
                    <div style={{ flex: 1, minWidth: 80 }}>
                      <div style={{ height: 6, background: '#e8edf5', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#1a6a5a,#4ade80)', width: `${teamMoy}%` }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1a6a5a' }}>{teamMoy}%</div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: '#a0aec0' }}>Aucun résultat</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
