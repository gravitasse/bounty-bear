'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { initAudio, playChaChing, speakQueued, playImSearchingMp3 } from '@/lib/audio'
import CreateBountyModal from './CreateBountyModal'
import BountyDetail from './BountyDetail'

type Bounty = {
  id: string
  location_name: string
  reward_points: number
  difficulty: number
  created_at: string
  creator_id: string
  clues: { text: string; unlock_distance: number | null }[]
  verification_data: { passcode_hash: string; hint: string }
}

type User = {
  id: string
  username: string
  points: number
  reputation_level: number
}

type TerminalLine = { text: string; type: 'normal' | 'success' | 'system' | 'highlight' }
type BearState = 'ready' | 'searching' | 'found'
type ClaimState = 'idle' | 'running' | 'done'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

function useDateTime() {
  const [dt, setDt] = useState('')
  useEffect(() => {
    const update = () => setDt(new Date().toLocaleString('en-US', { hour12: false }))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])
  return dt
}

const diffStars = (d: number) => '★'.repeat(d) + '☆'.repeat(Math.max(0, 5 - d))

export default function BountyBoard({ user, bounties: initialBounties }: { user: User; bounties: Bounty[] }) {
  const supabase = createClient()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null)
  const [bounties, setBounties] = useState(initialBounties)
  const [points, setPoints] = useState(user.points)
  const [claimed, setClaimed] = useState(0)
  const [infoOpen, setInfoOpen] = useState(false)

  // Terminal / sequence state
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([])
  const [bearState, setBearState] = useState<BearState>('ready')
  const [bearStatusLabel, setBearStatusLabel] = useState('READY')
  const [progress, setProgress] = useState(0)
  const [claimState, setClaimState] = useState<ClaimState>('idle')
  const [claimError, setClaimError] = useState('')
  const [findersFee, setFindersFee] = useState(0)

  const outputRef = useRef<HTMLDivElement>(null)
  const datetime = useDateTime()

  function addLine(text: string, type: TerminalLine['type'] = 'normal') {
    setTerminalLines(prev => [...prev, { text, type }])
  }

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [terminalLines])

  // Open info panel when a bounty is selected (mobile)
  useEffect(() => {
    if (selectedBounty) setInfoOpen(true)
    else if (claimState === 'idle') setInfoOpen(false)
  }, [selectedBounty])

  async function handleClaim(passcode: string) {
    if (!selectedBounty) return

    // Verify passcode before starting the show
    if (passcode !== selectedBounty.verification_data.passcode_hash.toUpperCase()) {
      setClaimError('Wrong passcode. Keep hunting.')
      return
    }

    setClaimError('')
    setClaimState('running')
    setTerminalLines([])
    setProgress(0)
    setBearState('searching')
    setBearStatusLabel('SEARCHING...')
    initAudio()
    playImSearchingMp3()

    const target = selectedBounty

    addLine(`──────────────────────────────────────`, 'system')
    addLine(`VERIFYING BOUNTY: "${target.location_name.toUpperCase()}"`, 'system')

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

    // DB work
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
      .update({ status: 'claimed', claimed_at: new Date().toISOString(), claimed_by: user.id })
      .eq('id', target.id)
      .eq('status', 'active')

    if (bountyErr) {
      setClaimState('idle')
      setClaimError('Bounty already claimed or unavailable.')
      setBearState('ready')
      setBearStatusLabel('READY')
      setProgress(0)
      return
    }

    await supabase.rpc('award_points', {
      user_uuid: user.id,
      amount: target.reward_points,
      reason: `claiming bounty at ${target.location_name}`,
    })

    if (coords) {
      await supabase.from('claims').insert({
        bounty_id: target.id,
        hunter_id: user.id,
        hunt_id: target.id,
        verification_method: 'passcode',
        verification_location: `POINT(${coords.lng} ${coords.lat})`,
        verification_proof: { passcode_entered: passcode },
        distance_from_target: 0,
        is_valid: true,
      })
    }

    addLine(`I GOT HIM!`, 'success')
    speakQueued('I got him!')
    setBearState('found')
    setBearStatusLabel('TARGET FOUND')

    await sleep(2500)
    addLine(`THIS IS YOUR GUY!`, 'success')
    speakQueued('This is your guy!')

    addLine(
      `TARGET: ${target.location_name.toUpperCase()}\nSTATUS: POSITIVE IDENTIFICATION\nCONFIDENCE: ${(97 + Math.random() * 2.9).toFixed(1)}%`,
      'highlight'
    )

    await sleep(7000)

    addLine(`FINDERS FEE: ${target.reward_points.toLocaleString()} POINTS`, 'success')
    speakQueued(`Finders fee: ${target.reward_points.toLocaleString()} points!`)
    playChaChing()

    await sleep(800)
    addLine(`──────────────────────────────────────`, 'system')
    addLine(`THE BEAR ALWAYS GETS HIS MAN. 🐻`, 'system')

    setFindersFee(target.reward_points)
    setClaimState('done')
    setBounties(prev => prev.filter(b => b.id !== target.id))
    setPoints(prev => prev + target.reward_points)
    setClaimed(prev => prev + 1)
  }

  function handleCollect() {
    setClaimState('idle')
    setSelectedBounty(null)
    setTerminalLines([])
    setProgress(0)
    setBearState('ready')
    setBearStatusLabel('READY')
    setFindersFee(0)
    setInfoOpen(false)
  }

  const showingSequence = claimState === 'running' || claimState === 'done'

  return (
    <>
      <header>
        <div className="logo">
          <span className="logo-bear">🐻</span>
          <span>BOUNTY BEAR v1.991</span>
        </div>
        <div className="system-status">
          {user.username.toUpperCase()} | {points.toLocaleString()} PTS
        </div>
      </header>

      <main style={{ position: 'relative' }}>
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className={`bear-container ${bearState}`}>🐻</div>
          <div className={`bear-status ${bearState}`}>{bearStatusLabel}</div>

          <div className="stats-box">
            <div className="stat-row">
              <span>ACTIVE</span>
              <span className="stat-value">{bounties.length}</span>
            </div>
            <div className="stat-row">
              <span>CLAIMED</span>
              <span className="stat-value">{claimed}</span>
            </div>
            <div className="stat-row">
              <span>POINTS</span>
              <span className="stat-value">{points.toLocaleString()}</span>
            </div>
          </div>

          <button className="mobile-info-btn" onClick={() => setInfoOpen(v => !v)}>
            📋 {selectedBounty ? 'BOUNTY' : 'INFO'}
          </button>
        </aside>

        {/* ── Terminal ── */}
        <section className="terminal">
          <div className="terminal-header">
            <span>BOUNTY_BEAR_GAME_TERMINAL</span>
            <span>{datetime}</span>
          </div>

          <div className="terminal-output" ref={outputRef}>
            {showingSequence ? (
              <>
                {/* Progress bar */}
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>

                {terminalLines.map((line, i) => (
                  <div key={i} className={`terminal-line ${line.type}`} style={{ whiteSpace: 'pre-line' }}>
                    {line.text}
                  </div>
                ))}

                {claimState === 'done' && (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ color: 'var(--green)', fontSize: '2rem', fontWeight: 'bold', marginBottom: 12 }}>
                      +{findersFee.toLocaleString()} PTS
                    </div>
                    <button className="action-btn primary" onClick={handleCollect} style={{ fontSize: '1.4rem', padding: '12px 24px' }}>
                      ► COLLECT BOUNTY
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="terminal-line system">BOUNTY BEAR GAME SYSTEM v1.991</div>
                <div className="terminal-line system">DISTRIBUTED ASYNC GEOCACHING PROTOCOL ACTIVE</div>
                <div className="terminal-line">──────────────────────────────────────</div>

                {bounties.length === 0 ? (
                  <>
                    <div className="terminal-line">NO ACTIVE BOUNTIES DETECTED.</div>
                    <div className="terminal-line system">POST A BOUNTY TO BEGIN THE HUNT.</div>
                  </>
                ) : (
                  <>
                    <div className="terminal-line system">
                      {bounties.length} ACTIVE {bounties.length === 1 ? 'BOUNTY' : 'BOUNTIES'} AVAILABLE:
                    </div>
                    <div className="terminal-line">──────────────────────────────────────</div>
                    {bounties.map((b, i) => (
                      <div
                        key={b.id}
                        className={`bounty-row terminal-line${selectedBounty?.id === b.id ? ' selected' : ''}`}
                        style={{ animationDelay: `${i * 0.05}s` }}
                        onClick={() => setSelectedBounty(b)}
                      >
                        <span className="bounty-name">► {b.location_name.toUpperCase()}</span>
                        <span className="bounty-diff">{diffStars(b.difficulty)}</span>
                        <span className="bounty-pts">{b.reward_points.toLocaleString()} PTS</span>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          {!showingSequence && (
            <div className="terminal-input-area">
              <button className="action-btn primary" onClick={() => setShowCreate(true)}>
                ► POST BOUNTY
              </button>
              <button className="action-btn" disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}>
                🏆 LEADERBOARD
              </button>
            </div>
          )}
        </section>

        {/* ── Info Panel ── */}
        <aside className={`info-panel${infoOpen ? ' mobile-open' : ''}`}>
          {selectedBounty && claimState !== 'done' ? (
            <div style={{ padding: 0, height: '100%' }}>
              <button
                className="mobile-close-info"
                style={{ display: infoOpen ? 'block' : 'none' }}
                onClick={() => { setSelectedBounty(null); setInfoOpen(false); setClaimError('') }}
              >
                ✕ CLOSE
              </button>
              <div style={{ padding: 24 }}>
                <BountyDetail
                  bounty={selectedBounty}
                  userId={user.id}
                  onClose={() => { setSelectedBounty(null); setClaimError('') }}
                  onClaimSubmit={handleClaim}
                  claimError={claimError}
                  claimRunning={claimState === 'running'}
                />
              </div>
            </div>
          ) : !showingSequence ? (
            <>
              <button
                className="mobile-close-info"
                style={{ display: infoOpen ? 'block' : 'none' }}
                onClick={() => setInfoOpen(false)}
              >
                ✕ CLOSE INFO
              </button>

              <div className="info-section">
                <div className="info-title">THE PROPHECY</div>
                <div className="film-quote">
                  "I'm the Bear. The Bounty Bear. I find them here. I find them there.
                  I can find them anywhere."
                </div>
                <div className="film-credit">— Until the End of the World, 1991</div>
              </div>

              <div className="info-section">
                <div className="info-title">HOW TO PLAY</div>
                <ul className="instructions">
                  <li>Post a bounty at a real-world GPS location</li>
                  <li>Write clues that hint at the location</li>
                  <li>Set a passcode — hide it at the spot</li>
                  <li>Hunters find your location and enter the passcode</li>
                  <li>Winner collects the point reward</li>
                </ul>
              </div>

              <div className="info-section">
                <div className="info-title">YOUR STATUS</div>
                <div className="stats-box" style={{ background: 'transparent' }}>
                  <div className="stat-row">
                    <span>HUNTER</span>
                    <span className="stat-value">{user.username.toUpperCase()}</span>
                  </div>
                  <div className="stat-row">
                    <span>RANK</span>
                    <span className="stat-value">LV {user.reputation_level}</span>
                  </div>
                  <div className="stat-row">
                    <span>BALANCE</span>
                    <span className="stat-value">{points.toLocaleString()} PTS</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // During sequence: show the target name in info panel
            <div style={{ padding: 24 }}>
              <div className="info-title">TARGET LOCKED</div>
              <div style={{ color: 'var(--green)', fontSize: '1.6rem', fontWeight: 'bold', marginTop: 16 }}>
                {selectedBounty?.location_name.toUpperCase()}
              </div>
              <div style={{ color: 'var(--amber)', marginTop: 8, fontSize: '1.2rem' }}>
                {claimState === 'done' ? 'POSITIVE IDENTIFICATION' : 'IDENTIFYING...'}
              </div>
            </div>
          )}
        </aside>
      </main>

      {showCreate && (
        <CreateBountyModal
          userId={user.id}
          onClose={() => { setShowCreate(false); window.location.reload() }}
        />
      )}
    </>
  )
}
