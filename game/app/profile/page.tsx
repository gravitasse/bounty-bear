export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, createdRes, claimedRes] = await Promise.all([
    supabase
      .from('users')
      .select('username, points, total_earned, reputation_level, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('bounties')
      .select('id, location_name, reward_points, difficulty, status, created_at, claimed_at')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('bounties')
      .select('id, location_name, reward_points, claimed_at')
      .eq('claimed_by', user.id)
      .order('claimed_at', { ascending: false })
      .limit(20),
  ])

  const profile = profileRes.data
  const created = createdRes.data ?? []
  const claimed = claimedRes.data ?? []

  const joined = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    : '—'

  const diffStars = (d: number) => '★'.repeat(d) + '☆'.repeat(5 - d)

  return (
    <>
      <header>
        <div className="logo">
          <span className="logo-bear">🐻</span>
          <span>BOUNTY BEAR v1.991</span>
        </div>
        <div className="system-status">
          <Link href="/play" style={{ color: 'var(--amber)', textDecoration: 'none', fontSize: '1.1rem' }}>
            ◄ BACK TO HUNT
          </Link>
        </div>
      </header>

      <main style={{ display: 'grid', gridTemplateColumns: '300px 1fr', maxHeight: 'calc(100vh - 60px)', overflow: 'hidden' }}>
        {/* Sidebar — hunter card */}
        <aside className="sidebar" style={{ borderRight: '2px solid var(--green)' }}>
          <div className="bear-container ready">🐻</div>
          <div className="bear-status ready">{profile?.username?.toUpperCase() ?? 'HUNTER'}</div>

          <div className="stats-box">
            <div className="stat-row">
              <span>BALANCE</span>
              <span className="stat-value">{(profile?.points ?? 0).toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span>TOTAL EARNED</span>
              <span className="stat-value">{(profile?.total_earned ?? 0).toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span>RANK</span>
              <span className="stat-value">LV {profile?.reputation_level ?? 1}</span>
            </div>
            <div className="stat-row">
              <span>POSTED</span>
              <span className="stat-value">{created.length}</span>
            </div>
            <div className="stat-row">
              <span>CLAIMED</span>
              <span className="stat-value">{claimed.length}</span>
            </div>
            <div className="stat-row">
              <span>JOINED</span>
              <span className="stat-value" style={{ fontSize: '1rem' }}>{joined}</span>
            </div>
          </div>

          <Link
            href="/play"
            className="action-btn primary"
            style={{ width: '100%', textAlign: 'center', display: 'block', textDecoration: 'none', marginTop: 8 }}
          >
            ► BACK TO HUNT
          </Link>
        </aside>

        {/* Terminal — history */}
        <section className="terminal">
          <div className="terminal-header">
            <span>HUNTER_DOSSIER — {profile?.username?.toUpperCase()}</span>
          </div>

          <div className="terminal-output">
            {/* Claimed bounties */}
            <div className="terminal-line system">BOUNTIES CLAIMED ({claimed.length})</div>
            <div className="terminal-line">──────────────────────────────────────</div>

            {claimed.length === 0 ? (
              <div className="terminal-line" style={{ color: 'var(--border)' }}>NO CLAIMS YET. GET HUNTING.</div>
            ) : (
              claimed.map((b, i) => (
                <div
                  key={b.id}
                  className="terminal-line"
                  style={{
                    display: 'flex', justifyContent: 'space-between', gap: 12,
                    animationDelay: `${i * 0.04}s`,
                    borderBottom: '1px dashed rgba(0,255,65,0.08)',
                    paddingBottom: 4, marginBottom: 4,
                  }}
                >
                  <span style={{ flex: 1, color: 'var(--green)' }}>► {b.location_name?.toUpperCase()}</span>
                  <span style={{ color: 'var(--amber)', whiteSpace: 'nowrap' }}>+{b.reward_points.toLocaleString()} PTS</span>
                  <span style={{ color: 'var(--border)', fontSize: '1rem', whiteSpace: 'nowrap' }}>
                    {b.claimed_at ? new Date(b.claimed_at).toLocaleDateString() : '—'}
                  </span>
                </div>
              ))
            )}

            {/* Posted bounties */}
            <div className="terminal-line system" style={{ marginTop: 24 }}>BOUNTIES POSTED ({created.length})</div>
            <div className="terminal-line">──────────────────────────────────────</div>

            {created.length === 0 ? (
              <div className="terminal-line" style={{ color: 'var(--border)' }}>NO BOUNTIES POSTED YET.</div>
            ) : (
              created.map((b, i) => (
                <div
                  key={b.id}
                  className="terminal-line"
                  style={{
                    display: 'flex', justifyContent: 'space-between', gap: 12,
                    animationDelay: `${i * 0.04}s`,
                    borderBottom: '1px dashed rgba(0,255,65,0.08)',
                    paddingBottom: 4, marginBottom: 4,
                  }}
                >
                  <span style={{ flex: 1, color: b.status === 'claimed' ? 'var(--border)' : 'var(--green)' }}>
                    {b.status === 'claimed' ? '✓' : '►'} {b.location_name?.toUpperCase()}
                  </span>
                  <span style={{ color: 'var(--border)', fontSize: '1rem' }}>{diffStars(b.difficulty)}</span>
                  <span style={{ color: b.status === 'claimed' ? 'var(--border)' : 'var(--amber)', whiteSpace: 'nowrap' }}>
                    {b.reward_points.toLocaleString()} PTS
                  </span>
                  <span style={{
                    fontSize: '0.95rem', whiteSpace: 'nowrap',
                    color: b.status === 'claimed' ? 'var(--border)' : 'var(--green)',
                  }}>
                    {b.status?.toUpperCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </>
  )
}
