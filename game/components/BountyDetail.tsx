'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { initAudio, playChaChing, speakQueued, playImSearchingMp3 } from '@/lib/audio'

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

type TerminalLine = { text: string; type: 'normal' | 'success' | 'system' | 'highlight' }

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

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
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [error, setError] = useState('')
  const [claimed, setClaimed] = useState(false)
  const [findersFee, setFindersFee] = useState(0)
  const isOwn = bounty.creator_id === userId

  function addLine(text: string, type: TerminalLine['type'] = 'normal') {
    setLines(prev => [...prev, { text, type }])
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault()
    if (isOwn) return setError("Can't claim your own bounty.")

    // Verify passcode first — before starting the show
    if (passcode.trim().toUpperCase() !== bounty.verification_data.passcode_hash.toUpperCase()) {
      return setError('Wrong passcode. Keep hunting.')
    }

    setLoading(true)
    setError('')
    setLines([])
    initAudio()

    // Play im-searching MP3 in background (like the demo)
    playImSearchingMp3()

    addLine(`──────────────────────────────────────`, 'system')
    addLine(`VERIFYING BOUNTY: "${bounty.location_name.toUpperCase()}"`, 'system')

    await sleep(1500)
    addLine(`SEARCHING.`)
    speakQueued('Searching.')

    await sleep(2000)
    addLine(`I'M SEARCHING.`)
    speakQueued("I'm searching.")

    await sleep(2000)
    addLine(`I'M SEARCHING.`)
    speakQueued("I'm searching.")

    await sleep(2500)
    addLine(`GIVE ME A MINUTE.`)
    speakQueued('Give me a minute.')

    await sleep(2500)
    addLine(`I AM IDENTIFYING...`)
    speakQueued('I am identifying.')

    await sleep(1800)
    setProgress(30)

    await sleep(2400)
    addLine(`CROSS-REFERENCING DATABASES...`)

    await sleep(1500)
    setProgress(60)

    await sleep(2100)
    addLine(`MATCHING BIOMETRICS...`)

    await sleep(1800)
    setProgress(90)

    await sleep(1500)
    setProgress(100)

    await sleep(1200)

    // Now do the DB work
    const getCoords = (): Promise<{ lat: number; lng: number } | null> =>
      new Promise(resolve =>
        navigator.geolocation.getCurrentPosition(
          p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve(null)
        )
      )
    const coords = await getCoords()

    const { error: bountyErr } = await supabase
      .from('bounties')
      .update({ status: 'claimed', claimed_at: new Date().toISOString(), claimed_by: userId })
      .eq('id', bounty.id)
      .eq('status', 'active')

    if (bountyErr) {
      setLoading(false)
      setLines([])
      setProgress(0)
      return setError('Bounty already claimed or unavailable.')
    }

    await supabase.rpc('award_points', {
      user_uuid: userId,
      amount: bounty.reward_points,
      reason: `claiming bounty at ${bounty.location_name}`,
    })

    if (coords) {
      await supabase.from('claims').insert({
        bounty_id: bounty.id,
        hunter_id: userId,
        hunt_id: bounty.id,
        verification_method: 'passcode',
        verification_location: `POINT(${coords.lng} ${coords.lat})`,
        verification_proof: { passcode_entered: passcode.trim().toUpperCase() },
        distance_from_target: 0,
        is_valid: true,
      })
    }

    addLine(`I GOT HIM!`, 'success')
    speakQueued('I got him!')

    await sleep(2500)
    addLine(`THIS IS YOUR GUY!`, 'success')
    speakQueued('This is your guy!')

    addLine(
      `TARGET: ${bounty.location_name.toUpperCase()}
STATUS: POSITIVE IDENTIFICATION
CONFIDENCE: ${(97 + Math.random() * 2.9).toFixed(1)}%`,
      'highlight'
    )

    await sleep(7000) // same dramatic pause as demo

    addLine(`FINDERS FEE: ${bounty.reward_points.toLocaleString()} POINTS`, 'success')
    speakQueued(`Finders fee: ${bounty.reward_points.toLocaleString()} points!`)
    playChaChing()

    await sleep(800)
    addLine(`──────────────────────────────────────`, 'system')
    addLine(`THE BEAR ALWAYS GETS HIS MAN. 🐻`, 'system')

    setFindersFee(bounty.reward_points)
    setClaimed(true)
    setLoading(false)
    onClaimed(bounty.reward_points)
  }

  const lineColors: Record<TerminalLine['type'], string> = {
    normal: 'text-green-300',
    success: 'text-green-400 font-bold',
    system: 'text-green-700',
    highlight: 'text-green-300 border border-green-900 p-2 my-1',
  }

  // During the cinematic sequence, show the terminal full-screen
  if (loading || claimed) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50 p-4" style={{fontFamily: 'inherit'}}>
        {/* Bear header */}
        <div className="text-center mb-4">
          <div className={`text-6xl inline-block ${claimed ? 'pulse-ready' : 'animate-pulse'}`}>🐻</div>
          <div className="text-green-600 text-sm mt-1">
            {claimed ? 'TARGET FOUND' : 'SEARCHING...'}
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-bar mb-4">
          <div className="progress-bar-fill transition-all duration-500" style={{width: `${progress}%`}} />
        </div>

        {/* Terminal output */}
        <div className="flex-1 overflow-y-auto space-y-1 text-lg mb-4">
          {lines.map((line, i) => (
            <div key={i} className={`${lineColors[line.type]} animate-slide-in whitespace-pre-line`}>
              {line.text}
            </div>
          ))}
        </div>

        {/* Collect button — only after claimed */}
        {claimed && (
          <div className="text-center animate-fade-in">
            <div className="text-3xl text-green-300 font-bold mb-4">
              +{findersFee.toLocaleString()} PTS
            </div>
            <button
              onClick={onClose}
              className="border-2 border-green-500 text-green-400 px-8 py-4 hover:bg-green-900 transition-colors uppercase tracking-widest text-xl"
              style={{boxShadow: '0 0 20px rgba(0,255,65,0.3)'}}
            >
              ► COLLECT BOUNTY
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md border border-green-700 bg-black p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="text-green-300 uppercase tracking-widest">Active Bounty</div>
          <button onClick={onClose} className="text-green-700 hover:text-green-400 text-xl">✕</button>
        </div>

        {/* Bounty info */}
        <div className="border border-green-900 p-3 mb-4">
          <div className="text-green-300 font-bold text-xl">{bounty.location_name}</div>
          <div className="flex justify-between mt-1">
            <span className="text-green-700">{'★'.repeat(bounty.difficulty)}{'☆'.repeat(5 - bounty.difficulty)}</span>
            <span className="text-green-400 font-bold">{bounty.reward_points.toLocaleString()} pts</span>
          </div>
        </div>

        {/* Clues */}
        <div className="mb-4 space-y-2">
          <div className="text-green-700 uppercase tracking-widest text-sm">Clues</div>
          {bounty.clues.map((clue, i) => (
            <div key={i} className="border border-green-900 p-2">
              <div className="text-green-800 text-sm mb-1">
                {clue.unlock_distance ? `Unlocks at ${clue.unlock_distance}m` : 'Visible now'}
              </div>
              <div className="text-green-300">{clue.text}</div>
            </div>
          ))}
        </div>

        {/* Claim */}
        {isOwn ? (
          <div className="text-green-800 text-center border border-green-900 p-3">
            This is your bounty. Wait for someone else to claim it.
          </div>
        ) : (
          <form onSubmit={handleClaim} className="space-y-3">
            <div className="text-green-700 uppercase tracking-widest text-sm">Enter Passcode to Claim</div>
            {error && <div className="text-red-500 border border-red-900 p-2">{error}</div>}
            <input
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              placeholder="PASSCODE"
              autoComplete="off"
              className="w-full bg-black border border-green-700 text-green-300 p-3 focus:outline-none focus:border-green-400 placeholder-green-900 uppercase tracking-widest text-xl"
            />
            <button
              type="submit"
              disabled={!passcode.trim()}
              className="w-full border border-green-500 text-green-400 py-3 hover:bg-green-900 transition-colors uppercase tracking-widest text-xl disabled:opacity-50"
            >
              ► CLAIM BOUNTY
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
