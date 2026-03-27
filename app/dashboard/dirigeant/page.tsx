'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type User = { id: string; prenom?: string|null; nom?: string|null; role?: string|null; club_id?: string|null }
type Equipe = { id: string; nom?: string|null }
type Resultat = { id: string; utilisateur_id?: string|null; score_global?: number|null; test_type?: string|null }

export default function DirigeantPage() {
  const router = useRouter()
  const [user, setUser] = useState<User|null>(null)
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [joueurs, setJoueurs] = useState<User[]>([])
  const [resultats, setResultats] = useState<Resultat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('a4p_club_user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    if (u.role !== 'dirigeant') { router.push('/login'); return }
    setUser(u)
    Promise.all([
      supabase.from('equipes').select('*').eq('club_id', u.club_id),
      supabase.from('utilisateurs').select('*').eq('club_id', u.club_id).eq('role', 'joueur'),
      supabase.from('resultats').select('*').eq('club_id', u.club_id),
    ]).then(([eRes, jRes, rRes]) => {
      setEquipes(eRes.data || [])
      setJoueurs(jRes.data || [])
      setResultats(rRes.data || [])
      setLoading(false)
    })
  }, [router])

  const logout = () => { localStorage.removeItem('a4p_club_user'); router.push('/login') }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', color:'#6c7a99', fontSize:18 }}>Chargement...</div>

  const name = [user?.prenom, user?.nom].filter(Boolean).join(' ') || 'Dirigeant'
  const moy = resultats.length > 0 ? Math.round(resultats.reduce((a,r) => a+(r.score_global||0),0)/resultats.length) : null

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4ff' }}>
      <div style={{ background:'#fff', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', position:'sticky', top:0, zIndex:50, gap:12, flexWrap:'wrap' }}>
        <div style={{ fontFamily:'serif', fontSize:20, fontWeight:700, color:'#1B3A6B' }}>A4P · <span style={{ color:'#C9A84C' }}>Mental Club</span></div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:11, background:'#1a6a5a', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800 }}>{name[0]?.toUpperCase()}</div>
          <div><div style={{ fontSize:14, fontWeight:700 }}>{name}</div><div style={{ fontSize:11, color:'#6c7a99' }}>🏛️ Dirigeant</div></div>
          <button onClick={logout} style={{ padding:'7px 14px', background:'transparent', border:'1px solid rgba(27,58,107,0.2)', borderRadius:9, color:'#6c7a99', fontSize:12, fontWeight:600 }}>Déconnexion</button>
        </div>
      </div>
      <div style={{ maxWidth:900, margin:'0 auto', padding:20 }}>
        <div style={{ background:'linear-gradient(135deg,#1a4a2a,#1a6a5a)', borderRadius:22, padding:'28px 24px', marginBottom:20, color:'#fff', textAlign:'center' }}>
          <div style={{ fontFamily:'serif', fontSize:28, fontWeight:700, marginBottom:6 }}>Mon club</div>
          <p style={{ opacity:0.8, fontSize:15 }}>Vue globale de toutes vos équipes</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
          {[
            { num:equipes.length, label:'Équipes' },
            { num:joueurs.length, label:'Joueurs' },
            { num:resultats.length, label:'Tests passés' },
            { num: moy !== null ? moy+'%' : '—', label:'Score moyen' },
          ].map((s,i) => (
            <div key={i} style={{ background:'#fff', borderRadius:16, padding:'18px 12px', textAlign:'center', boxShadow:'0 3px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontFamily:'serif', fontSize:32, fontWeight:700, color:'#1a6a5a', lineHeight:1, marginBottom:4 }}>{s.num}</div>
              <div style={{ fontSize:11, color:'#6c7a99', fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ background:'#fff', borderRadius:20, padding:22, boxShadow:'0 3px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:15, fontWeight:800, color:'#1a2a4a', marginBottom:14 }}>🏆 Mes équipes</div>
          {equipes.length === 0 ? <div style={{ textAlign:'center', padding:28, color:'#a0aec0' }}>Aucune équipe.</div> : equipes.map(e => {
            const eJoueurs = joueurs.filter(j => j.club_id === user?.club_id)
            const eRes = resultats.filter(r => eJoueurs.some(j => j.id === r.utilisateur_id))
            const eMoy = eRes.length > 0 ? Math.round(eRes.reduce((a,r) => a+(r.score_global||0),0)/eRes.length) : null
            return (
              <div key={e.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:14, background:'#f8faff', marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'#1a6a5a', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:14 }}>{(e.nom||'E')[0].toUpperCase()}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, color:'#1a2a4a', fontSize:14 }}>{e.nom}</div>
                  <div style={{ fontSize:11, color:'#6c7a99' }}>{eRes.length} test(s)</div>
                </div>
                <div style={{ fontSize:13, fontWeight:800, color:'#1a6a5a' }}>{eMoy !== null ? eMoy+'%' : '—'}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
