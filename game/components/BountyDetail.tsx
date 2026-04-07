'use client'

import { useState, useEffect, useMemo } from 'react'

type Clue = { text: string; unlock_distance: number | null }
type Bounty = {
  id: string
  location_name: string
  reward_points: number
  difficulty: number
  clues: Clue[]
  creator_id: string
  expires_at?: string
  verification_data: { passcode_hash: string; hint: string; lat?: number; lng?: number }
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function timeRemaining(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'EXPIRED'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
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
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const isOwn = bounty.creator_id === userId
  const bountyCoords = useMemo(() => bounty.verification_data?.lat != null
    ? { lat: bounty.verification_data.lat!, lng: bounty.verification_data.lng! }
    : null, [bounty.verification_data])

  // GPS polling for proximity unlocking
  useEffect(() => {
    if (!bountyCoords) return
    const watchId = navigator.geolocation.watchPosition(
      pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [bounty.id, bountyCoords])

  const distanceToTarget = userCoords && bountyCoords
    ? haversineMeters(userCoords.lat, userCoords.lng, bountyCoords.lat, bountyCoords.lng)
    : null

  function isClueUnlocked(clue: Clue) {
    if (!clue.unlock_distance) return true
    if (!distanceToTarget) return false
    return distanceToTarget <= clue.unlock_distance
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!passcode.trim()) return
    onClaimSubmit(passcode.trim().toUpperCase())
  }

  const inputStyle: React.CSSProperties = {
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
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="info-title" style={{ margin: 0 }}>ACTIVE BOUNTY</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
      </div>

      {/* Bounty info */}
      <div style={{ border: '1px solid var(--border)', padding: 12 }}>
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
        {bounty.expires_at && (
          <div style={{ color: 'var(--border)', fontSize: '1rem', marginTop: 4 }}>
            EXPIRES: <span style={{ color: timeRemaining(bounty.expires_at) === 'EXPIRED' ? 'var(--red)' : 'var(--amber)' }}>
              {timeRemaining(bounty.expires_at)}
            </span>
          </div>
        )}
      </div>

      {/* Distance indicator */}
      {bountyCoords && (
        <div style={{
          border: `1px solid ${distanceToTarget == null ? 'var(--border)' : distanceToTarget < 100 ? 'var(--green)' : 'var(--amber)'}`,
          padding: '8px 12px',
          fontSize: '1.1rem',
          color: distanceToTarget == null ? 'var(--border)' : distanceToTarget < 100 ? 'var(--green)' : 'var(--amber)',
        }}>
          {distanceToTarget == null
            ? '📍 ACQUIRING GPS...'
            : distanceToTarget < 1000
            ? `📍 ${Math.round(distanceToTarget)}M FROM TARGET`
            : `📍 ${(distanceToTarget / 1000).toFixed(1)}KM FROM TARGET`}
        </div>
      )}

      {/* Clues */}
      <div>
        <div className="info-title">CLUES</div>
        {bounty.clues.map((clue, i) => {
          const unlocked = isClueUnlocked(clue)
          const dist = clue.unlock_distance
          return (
            <div key={i} style={{
              border: `1px solid ${unlocked ? 'var(--border)' : 'rgba(0,0,0,0.3)'}`,
              padding: '8px 12px',
              marginBottom: 8,
              opacity: unlocked ? 1 : 0.5,
            }}>
              <div style={{ color: 'var(--border)', fontSize: '0.95rem', marginBottom: 4 }}>
                CLUE {i + 1} — {dist ? `UNLOCKS AT ${dist}M` : 'VISIBLE NOW'}
              </div>
              {unlocked ? (
                <div style={{ color: 'var(--text)' }}>{clue.text}</div>
              ) : (
                <div style={{ color: 'var(--border)' }}>
                  🔒 GET WITHIN {dist}M TO UNLOCK
                  {distanceToTarget != null && (
                    <span style={{ color: 'var(--amber)', marginLeft: 8 }}>
                      ({Math.round(distanceToTarget - dist!)}M TO GO)
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
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
            style={inputStyle}
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
