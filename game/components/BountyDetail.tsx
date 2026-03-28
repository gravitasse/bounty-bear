'use client'

import { useState } from 'react'

type Clue = { text: string; unlock_distance: number | null }
type Bounty = {
  id: string
  location_name: string
  reward_points: number
  difficulty: number
  clues: Clue[]
  creator_id: string
  verification_data: { passcode_hash: string; hint: string }
}

export default function BountyDetail({
  bounty,
  userId,
  onClose,
  onClaimSubmit,
  claimError,
  claimRunning,
}: {
  bounty: Bounty
  userId: string
  onClose: () => void
  onClaimSubmit: (passcode: string) => void
  claimError: string
  claimRunning: boolean
}) {
  const [passcode, setPasscode] = useState('')
  const isOwn = bounty.creator_id === userId

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!passcode.trim()) return
    onClaimSubmit(passcode.trim().toUpperCase())
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="info-title" style={{ margin: 0 }}>ACTIVE BOUNTY</div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '1.2rem' }}
        >
          ✕
        </button>
      </div>

      {/* Bounty info */}
      <div style={{ border: '1px solid var(--border)', padding: 12, marginBottom: 16 }}>
        <div style={{ color: 'var(--green)', fontSize: '1.4rem', fontWeight: 'bold' }}>
          {bounty.location_name.toUpperCase()}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ color: 'var(--border)' }}>
            {'★'.repeat(bounty.difficulty)}{'☆'.repeat(5 - bounty.difficulty)}
          </span>
          <span style={{ color: 'var(--amber)', fontWeight: 'bold' }}>
            {bounty.reward_points.toLocaleString()} PTS
          </span>
        </div>
      </div>

      {/* Clues */}
      <div style={{ marginBottom: 16 }}>
        <div className="info-title">CLUES</div>
        {bounty.clues.map((clue, i) => (
          <div key={i} style={{ border: '1px solid var(--border)', padding: '8px 12px', marginBottom: 8 }}>
            <div style={{ color: 'var(--border)', fontSize: '1rem', marginBottom: 4 }}>
              {clue.unlock_distance ? `UNLOCKS AT ${clue.unlock_distance}M` : 'VISIBLE NOW'}
            </div>
            <div style={{ color: 'var(--text)' }}>{clue.text}</div>
          </div>
        ))}
      </div>

      {/* Claim */}
      {isOwn ? (
        <div style={{ color: 'var(--border)', border: '1px solid var(--border)', padding: 12, textAlign: 'center', fontSize: '1.1rem' }}>
          THIS IS YOUR BOUNTY.<br />WAIT FOR SOMEONE ELSE TO CLAIM IT.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="info-title">ENTER PASSCODE TO CLAIM</div>
          {claimError && (
            <div style={{ color: 'var(--red)', border: '1px solid var(--red)', padding: '6px 10px', fontSize: '1.1rem' }}>
              {claimError}
            </div>
          )}
          <input
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
            placeholder="PASSCODE"
            autoComplete="off"
            disabled={claimRunning}
            style={{
              background: 'transparent',
              border: '1px solid var(--green)',
              color: 'var(--green)',
              fontFamily: 'var(--font-vt323), VT323, monospace',
              fontSize: '1.4rem',
              padding: '8px 12px',
              textTransform: 'uppercase',
              letterSpacing: 2,
              outline: 'none',
              width: '100%',
            }}
          />
          <button
            type="submit"
            disabled={!passcode.trim() || claimRunning}
            className="action-btn primary"
            style={{ width: '100%', opacity: (!passcode.trim() || claimRunning) ? 0.5 : 1 }}
          >
            {claimRunning ? 'SEARCHING...' : '► CLAIM BOUNTY'}
          </button>
        </form>
      )}
    </div>
  )
}
