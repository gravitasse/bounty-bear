export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: hunters } = await supabase
    .from('users')
    .select('id, username, points, total_earned, reputation_level')
    .order('points', { ascending: false })
    .limit(50)

  const medal = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`

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

      <main style={{ display: 'flex', flexDirection: 'column', padding: 0, maxHeight: 'calc(100vh - 60px)', overflow: 'hidden' }}>
        <div className="terminal" style={{ flex: 1, minHeight: 0 }}>
          <div className="terminal-header">
            <span>BOUNTY_BEAR_LEADERBOARD</span>
            <span>{new Date().toLocaleString('en-US', { hour12: false })}</span>
          </div>

          <div className="terminal-output" style={{ flex: 1 }}>
            <div className="terminal-line system">TOP HUNTERS — ALL TIME RANKINGS</div>
            <div className="terminal-line">──────────────────────────────────────</div>

            {(hunters ?? []).length === 0 ? (
              <div className="terminal-line">NO HUNTERS YET. BE THE FIRST.</div>
            ) : (
              (hunters ?? []).map((h, i) => (
                <div
                  key={h.id}
                  className="terminal-line"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 16,
                    color: i === 0 ? 'var(--amber)' : i < 3 ? 'var(--green)' : 'var(--text)',
                    borderBottom: '1px dashed rgba(0,255,65,0.08)',
                    paddingBottom: 4,
                    marginBottom: 4,
                    animationDelay: `${i * 0.03}s`,
                  }}
                >
                  <span style={{ width: 36, flexShrink: 0, fontSize: i < 3 ? '1.4rem' : '1.2rem' }}>
                    {medal(i)}
                  </span>
                  <span style={{ flex: 1, fontWeight: i < 3 ? 'bold' : 'normal' }}>
                    {h.username.toUpperCase()}
                    {h.id === user.id && (
                      <span style={{ color: 'var(--amber)', marginLeft: 8, fontSize: '1rem' }}>◄ YOU</span>
                    )}
                  </span>
                  <span style={{ color: 'var(--border)', fontSize: '1rem' }}>LV{h.reputation_level}</span>
                  <span style={{ color: 'var(--amber)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    {h.points.toLocaleString()} PTS
                  </span>
                  <span style={{ color: 'var(--border)', fontSize: '1rem', whiteSpace: 'nowrap' }}>
                    {h.total_earned.toLocaleString()} EARNED
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  )
}
