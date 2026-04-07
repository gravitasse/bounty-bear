'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Row = { username: string; points: number; total_earned: number; reputation_level: number }

export default function LeaderboardModal({ onClose }: { onClose: () => void }) {
  const supabase = createClient()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('users')
      .select('username, points, total_earned, reputation_level')
      .order('points', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setRows(data ?? [])
        setLoading(false)
      })
  }, [supabase])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 16,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 560,
        border: '2px solid var(--green)',
        background: 'var(--terminal-bg)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '80vh',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-press-start), "Press Start 2P", cursive', fontSize: '0.65rem', color: 'var(--amber)' }}>
            🏆 LEADERBOARD
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '1.2rem' }}
          >✕</button>
        </div>

        {/* Terminal output */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', fontSize: '1.3rem' }}>
          <div className="terminal-line system">TOP HUNTERS — ALL TIME</div>
          <div className="terminal-line">──────────────────────────────────────</div>

          {loading ? (
            <div className="terminal-line" style={{ color: 'var(--amber)' }}>LOADING...<span className="cursor" /></div>
          ) : rows.length === 0 ? (
            <div className="terminal-line">NO HUNTERS YET. BE THE FIRST.</div>
          ) : (
            rows.map((row, i) => (
              <div
                key={row.username}
                className="terminal-line"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 12,
                  color: i === 0 ? 'var(--amber)' : i < 3 ? 'var(--green)' : 'var(--text)',
                  animationDelay: `${i * 0.04}s`,
                  borderBottom: '1px dashed rgba(0,255,65,0.1)',
                  paddingBottom: 4,
                  marginBottom: 4,
                }}
              >
                <span style={{ width: 28, flexShrink: 0 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <span style={{ flex: 1 }}>{row.username.toUpperCase()}</span>
                <span style={{ color: 'var(--border)', fontSize: '1rem' }}>LV{row.reputation_level}</span>
                <span style={{ color: 'var(--amber)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  {row.points.toLocaleString()} PTS
                </span>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '2px solid var(--green)' }}>
          <button className="action-btn" onClick={onClose} style={{ width: '100%' }}>
            ◄ BACK TO HUNT
          </button>
        </div>
      </div>
    </div>
  )
}
