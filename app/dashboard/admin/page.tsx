'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Resultat = { id: string; player_id?: string|null; test_type?: string|null; score_global?: number|null; profile_label?: string|null; profile_code?: string|null; completed_at?: string|null }
type Player = { id: string; firstname?: string|null; lastname?: string|null; email?: string|null; team_id?: string|null; club_id?: string|null }
type ClubUser = { id: string; firstname?: string|null; lastname?: string|null; email?: string|null; role?: string|null }

export default function DashboardAdmin() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clubs, setClubs] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [resultats, setResultats] = useState<Resultat[]>([])
  const [users, setUsers] = useState<ClubUser[]>([])
  const [tab, setTab] = useState<'overview'|'resultats'|'users'>('overview')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: cu } = await supabase.from('club_users').select('*').eq('auth_user_id', user.id).single()
      if (!cu || cu.role !== 'a4p_admin') { router.push('/login'); return }
      const [clRes, tmRes, plRes, reRes, usRes] = await Promise.all([
        supabase.from('clubs').select('*').order('created_at', { ascending: false }),
        supabase.from('teams').select('*').order('created_at', { ascending: false }),
        supabase.from('players').select('*').order('created_at', { ascending: false }),
        supabase.from('resultats').select('*').order('completed_at', { ascending: false }),
        supabase.from('club_users').select('*').order('created_at', { ascending: false }),
      ])
      setClubs(clRes.data || [])
      setTeams(tmRes.data || [])
      setPlayers(plRes.data || [])
      setResultats(reRes.data || [])
      setUsers(usRes.data || [])
      setLoading(false)
    }
    load()
  }, [router])

  const logout = async () => { await supabase.auth.signOut(); router.push('/login') }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 18, color: '#6c7a99' }}>Chargement...</div>

  const colors: Record<string,string> = { PMP:'#2f4a8a', MPA:'#1a3a6a', CMP:'#1a4a2a', PSYCHO:'#4a1a6a' }
  const roleColors: Record<string,string> = { a4p_admin:'#C9A84C', club_admin:'#1a6a5a', coach:'#2E5BA8', player:'#5a3a8a' }
  const roleEmojis: Record<string,string> = { a4p_admin:'👑', club_admin:'🏛️', coach:'👨‍💼', player:'🎮' }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff' }}>
      <div style={{ background: 'linear-gradient(135deg,#0f2244,#1B3A6B)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 20px rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 50, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'serif', fontSize: 20, fontWeight: 700, color: '#fff' }}>A4P · <span style={{ color: '#C9A84C' }}>Admin</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#C9A84C,#E8C56A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f2244', fontWeight: 800 }}>A</div>
          <div><div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Alexandre Griffet</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>👑 Administrateur A4P</div></div>
          <button onClick={logout} style={{ padding: '7px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 9, color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>Déconnexion</button>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
        <div style={{ background: 'linear-gradient(135deg,#0f2244,#1B3A6B)', borderRadius: 22, padding: '28px 24px', marginBottom: 20, color: '#fff', textAlign: 'center', border: '1px solid rgba(201,168,76,0.3)' }}>
          <div style={{ fontSize: 13, letterSpacing: '0.3em', color: '#C9A84C', marginBottom: 8 }}>TABLEAU DE BORD ADMINISTRATEUR</div>
          <div style={{ fontFamily: 'serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Vue globale A4P</div>
          <p style={{ opacity: 0.8, fontSize: 15 }}>Tous les clubs · Toutes les équipes · Tous les joueurs</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { num: clubs.length, label: 'Clubs' },
            { num: teams.length, label: 'Équipes' },
            { num: players.length, label: 'Joueurs' },
            { num: resultats.length, label: 'Tests passés' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '18px 12px', textAlign: 'center', boxShadow: '0 3px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontFamily: 'serif', fontSize: 32, fontWeight: 700, color: '#C9A84C', lineHeight: 1, marginBottom: 4 }}>{s.num}</div>
              <div style={{ fontSize: 11, color: '#6c7a99', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['overview','Vue clubs'],['resultats','Tous les résultats'],['users','Utilisateurs']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key as any)} style={{ padding: '10px 18px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 13, background: tab === key ? '#1B3A6B' : '#fff', color: tab === key ? '#fff' : '#6c7a99', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 22, boxShadow: '0 3px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1a2a4a', marginBottom: 14 }}>🏆 Clubs & Équipes</div>
            {clubs.map(club => {
              const clubTeams = teams.filter(t => t.club_id === club.id)
              const clubPlayers = players.filter(p => p.club_id === club.id)
              const clubRes = resultats.filter(r => clubPlayers.some(p => p.id === r.player_id))
              const clubMoy = clubRes.length > 0 ? Math.round(clubRes.reduce((a, r) => a + (r.score_global || 0), 0) / clubRes.length) : null
              return (
                <div key={club.id} style={{ border: '1px solid #e8edf5', borderRadius: 14, padding: 16, marginBottom: 12, background: '#f8faff' }}>
                  <div style={{ fontWeight: 800, color: '#1a2a4a', fontSize: 16, marginBottom: 6 }}>{club.name}</div>
                  <div style={{ fontSize: 12, color: '#6c7a99', marginBottom: 10 }}>{clubTeams.length} équipe(s) · {clubPlayers.length} joueur(s) · {clubRes.length} test(s) · Moy: {clubMoy !== null ? clubMoy + '%' : '—'}</div>
                  {clubTeams.map(team => {
                    const tp = players.filter(p => p.team_id === team.id)
                    const tr = resultats.filter(r => tp.some(p => p.id === r.player_id))
                    const tm = tr.length > 0 ? Math.round(tr.reduce((a, r) => a + (r.score_global || 0), 0) / tr.length) : null
                    return (
                      <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: '#fff', marginBottom: 6, border: '1px solid #e8edf5' }}>
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#1a2a4a' }}>{team.name} <span style={{ color: '#6c7a99', fontWeight: 400 }}>({team.category || ''})</span></div>
                        <div style={{ fontSize: 12, color: '#6c7a99' }}>{tp.length} joueurs · {tr.length} tests</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1B3A6B' }}>{tm !== null ? tm + '%' : '—'}</div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'resultats' && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 22, boxShadow: '0 3px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1a2a4a', marginBottom: 14 }}>📋 Tous les résultats — Export PDF</div>
            {resultats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 28, color: '#a0aec0' }}>Aucun résultat pour l'instant.</div>
            ) : resultats.map(r => {
              const player = players.find(p => p.id === r.player_id)
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderRadius: 13, background: '#f8faff', marginBottom: 8, flexWrap: 'wrap' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f2244', fontWeight: 800, fontSize: 14 }}>
                    {(player?.firstname || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#1a2a4a', fontSize: 14 }}>{[player?.firstname, player?.lastname].filter(Boolean).join(' ') || 'Joueur inconnu'}</div>
                    <div style={{ fontSize: 11, color: '#6c7a99' }}>{r.test_type} · {r.profile_label || '—'} · {r.completed_at ? new Date(r.completed_at).toLocaleDateString('fr-FR') : '—'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 80, height: 6, background: '#e8edf5', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#C9A84C,#E8C56A)', width: `${r.score_global || 0}%` }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#C9A84C' }}>{r.score_global || '—'}%</div>
                  </div>
                  <button onClick={() => router.push(`/resultats/${r.id}`)} style={{ padding: '6px 12px', border: '1px solid #C9A84C', borderRadius: 10, background: 'transparent', color: '#C9A84C', fontSize: 12, fontWeight: 700 }}>
                    📄 Voir
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'users' && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 22, boxShadow: '0 3px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1a2a4a', marginBottom: 14 }}>👥 Tous les utilisateurs</div>
            {users.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', borderRadius: 13, background: '#f8faff', marginBottom: 8, flexWrap: 'wrap' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: roleColors[u.role || ''] || '#1B3A6B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>
                  {(u.firstname || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#1a2a4a', fontSize: 14 }}>{[u.firstname, u.lastname].filter(Boolean).join(' ') || 'Utilisateur'}</div>
                  <div style={{ fontSize: 11, color: '#6c7a99' }}>{roleEmojis[u.role || '']} {u.role} · {u.email}</div>
                </div>
                <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: (roleColors[u.role || ''] || '#1B3A6B') + '22', color: roleColors[u.role || ''] || '#1B3A6B', fontWeight: 700 }}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
