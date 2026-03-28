'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  onClaimed,
}: {
  bounty: Bounty
  userId: string
  onClose: () => void
  onClaimed: (points: number) => void
}) {
  const supabase = createClient()
  const [passcode, setPasscode] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')
  const [error, setError] = useState('')
  const [claimed, setClaimed] = useState(false)
  const isOwn = bounty.creator_id === userId

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault()
    if (isOwn) return setError("Can't claim your own bounty.")
    setLoading(true)
    setError('')

    // Cinematic progress sequence
    const steps = [
      [10, "I'm the bear — the bounty bear!"],
      [30, 'I can find them anywhere!'],
      [55, "I'm searching..."],
      [75, 'I am identifying...'],
      [90, 'Verifying passcode...'],
    ]
    for (const [pct, msg] of steps) {
      setProgress(pct as number)
      setStatusMsg(msg as string)
      await new Promise(r => setTimeout(r, 400))
    }

    // Verify passcode (case-insensitive)
    if (passcode.trim().toUpperCase() !== bounty.verification_data.passcode_hash.toUpperCase()) {
      setProgress(0)
      setStatusMsg('')
      setError('Wrong passcode. Keep hunting.')
      setLoading(false)
      return
    }

    // Get current GPS for the claim record
    const getCoords = (): Promise<{ lat: number; lng: number } | null> =>
      new Promise(resolve =>
        navigator.geolocation.getCurrentPosition(
          p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve(null)
        )
      )
    const coords = await getCoords()

    // Mark bounty as claimed
    const { error: bountyErr } = await supabase
      .from('bounties')
      .update({ status: 'claimed', claimed_at: new Date().toISOString(), claimed_by: userId })
      .eq('id', bounty.id)
      .eq('status', 'active') // prevent double-claim race condition

    if (bountyErr) {
      setError('Bounty already claimed or unavailable.')
      setLoading(false)
      return
    }

    // Award points
    await supabase.rpc('award_points', {
      user_uuid: userId,
      amount: bounty.reward_points,
      reason: `claiming bounty at ${bounty.location_name}`,
    })

    // Record claim
    if (coords) {
      await supabase.from('claims').insert({
        bounty_id: bounty.id,
        hunter_id: userId,
        hunt_id: bounty.id, // simplified: no active hunt record needed for passcode flow
        verification_method: 'passcode',
        verification_location: `POINT(${coords.lng} ${coords.lat})`,
        verification_proof: { passcode_entered: passcode.trim().toUpperCase() },
        distance_from_target: 0,
        is_valid: true,
      })
    }

    setClaimed(true)
    setLoading(false)
    onClaimed(bounty.reward_points)
  }

  if (claimed) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-md border-2 border-green-500 bg-black p-8 text-center animate-fade-in"
             style={{boxShadow: '0 0 40px rgba(0,255,65,0.3)'}}>
          <div className="text-8xl mb-4 pulse-ready inline-block">🐻</div>
          <div className="text-4xl text-green-300 font-bold mb-2" style={{fontFamily: "'Press Start 2P', cursive", fontSize: '1.2rem'}}>
            I GOT HIM!
          </div>
          <div className="text-2xl text-green-400 mb-1">THIS IS YOUR GUY!</div>
          <div className="text-green-600 mb-4">{bounty.location_name}</div>
          <div className="progress-bar mb-4">
            <div className="progress-bar-fill" style={{width: '100%'}} />
          </div>
          <div className="text-3xl text-green-300 font-bold mb-6">
            FINDERS FEE: +{bounty.reward_points.toLocaleString()} PTS
          </div>
          <button
            onClick={onClose}
            className="border border-green-500 text-green-400 px-8 py-3 hover:bg-green-900 transition-colors uppercase tracking-widest text-xl"
          >
            ► COLLECT BOUNTY
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md border border-green-700 bg-black p-6 font-mono">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-green-300 uppercase tracking-widest text-sm">Active Bounty</h2>
          <button onClick={onClose} className="text-green-700 hover:text-green-400">✕</button>
        </div>

        {/* Bounty info */}
        <div className="border border-green-900 p-3 mb-4 space-y-1">
          <div className="text-green-300 font-bold">{bounty.location_name}</div>
          <div className="flex justify-between text-xs">
            <span className="text-green-600">{'★'.repeat(bounty.difficulty)}{'☆'.repeat(5 - bounty.difficulty)}</span>
            <span className="text-green-400 font-bold">{bounty.reward_points.toLocaleString()} pts</span>
          </div>
        </div>

        {/* Clues */}
        <div className="mb-4 space-y-2">
          <div className="text-green-600 text-xs uppercase tracking-widest">Clues</div>
          {bounty.clues.map((clue, i) => (
            <div key={i} className="border border-green-900 p-2">
              <div className="text-green-700 text-xs mb-1">
                {clue.unlock_distance ? `Unlocks at ${clue.unlock_distance}m` : 'Visible now'}
              </div>
              <div className="text-green-300 text-sm">{clue.text}</div>
            </div>
          ))}
        </div>

        {/* Claim */}
        {isOwn ? (
          <div className="text-green-800 text-xs text-center border border-green-900 p-3">
            This is your bounty. Wait for someone else to claim it.
          </div>
        ) : (
          <form onSubmit={handleClaim} className="space-y-3">
            <div className="text-green-600 text-xs uppercase tracking-widest">Enter Passcode to Claim</div>
            {error && <div className="text-red-500 text-xs border border-red-900 p-2">{error}</div>}
            <input
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              placeholder="PASSCODE"
              className="w-full bg-black border border-green-700 text-green-300 p-3 focus:outline-none focus:border-green-400 placeholder-green-900 uppercase tracking-widest"
            />
            {loading && (
              <div className="space-y-2">
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{width: `${progress}%`}} />
                </div>
                <div className="text-green-600 text-sm text-center blink">{statusMsg}</div>
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !passcode.trim()}
              className="w-full border border-green-500 text-green-400 py-3 hover:bg-green-900 transition-colors uppercase tracking-widest disabled:opacity-50 text-xl"
            >
              {loading ? '...' : '► CLAIM BOUNTY'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
