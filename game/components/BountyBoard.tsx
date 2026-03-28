'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { initAudio, playChaChing, speakQueued, playImSearchingMp3, playBlip, setVoiceMuted, getVoiceMuted, stopAllAudio } from '@/lib/audio'
import CreateBountyModal from './CreateBountyModal'
import BountyDetail from './BountyDetail'
import LeaderboardModal from './LeaderboardModal'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const MapModal = dynamic(() => import('./MapModal'), { ssr: false })

type Bounty = {
  id: string
  location_name: string
  reward_points: number
  difficulty: number
  created_at: string
  expires_at: string
  status?: string
  creator_id: string
  clues: { text: string; unlock_distance: number | null }[]
  verification_data: { passcode_hash: string; hint: string; lat?: number; lng?: number }
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

function timeLeft(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return null
  const h = Math.floor(ms / 3600000)
  if (h > 48) return null // don't clutter list with far-future expiry
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 0) return `${h}h`
  return `${m}m`
}

const diffStars = (d: number) => '★'.repeat(d) + '☆'.repeat(Math.max(0, 5 - d))

export default function BountyBoard({ user, bounties: initialBounties }: { user: User; bounties: Bounty[] }) {
  const supabase = createClient()
  const [showCreate, setShowCreate] = useState(false)

  const [showMap, setShowMap] = useState(false)
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null)
  const [bounties, setBounties] = useState(initialBounties)
  const [newBountyIds, setNewBountyIds] = useState<Set<string>>(new Set())
  const [points, setPoints] = useState(user.points)
  const [claimed, setClaimed] = useState(0)
  const [infoOpen, setInfoOpen] = useState(false)

  // Claim sequence state
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([])
  const [bearState, setBearState] = useState<BearState>('ready')
  const [bearStatusLabel, setBearStatusLabel] = useState('READY')
  const [progress, setProgress] = useState(0)
  const [claimState, setClaimState] = useState<ClaimState>('idle')
  const [claimError, setClaimError] = useState('')
  const [findersFee, setFindersFee] = useState(0)

  // Boot intro state
  const [started, setStarted] = useState(false)
  const [introLines, setIntroLines] = useState<TerminalLine[]>([])
  const [introComplete, setIntroComplete] = useState(false)

  const outputRef = useRef<HTMLDivElement>(null)
  const [voiceMuted, setVoiceMutedState] = useState(false)
  const datetime = useDateTime()

  // Auto-scroll terminal whenever lines change
  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight
  }, [introLines, terminalLines])

  // Single entry point — user clicks once, everything starts together
  function handleStart() {
    if (started) return
    setStarted(true)
    initAudio()
    runBoot()
  }

  function runBoot() {
    const addIntro = (text: string, type: TerminalLine['type'] = 'normal') =>
      setIntroLines(prev => [...prev, { text, type }])

    async function boot() {
      await sleep(300)
      addIntro('BOUNTY BEAR TRACKING SYSTEM v1.991', 'system')
      await sleep(400)
      addIntro('INSPIRED BY "UNTIL THE END OF THE WORLD" (1991)', 'system')
      await sleep(400)
      addIntro('──────────────────────────────────────')
      await sleep(700)
      // Audio context has had ~1400ms to settle — safe to start speaking
      playImSearchingMp3()
      addIntro("I'M THE BEAR. THE BOUNTY BEAR.")
      speakQueued("I'm the Bear. The Bounty Bear.")
      await sleep(1000)
      addIntro("I FIND THEM HERE. I FIND THEM THERE.")
      speakQueued("I find them here. I find them there.")
      await sleep(900)
      addIntro("I CAN FIND THEM ANYWHERE.")
      speakQueued("I can find them anywhere.")
      await sleep(800)
      addIntro("THE BEAR — ADVANCED BOUNTY BEAR PROGRAMMING.")
      speakQueued("The Bear. Advanced Bounty Bear programming.")
      await sleep(600)
      addIntro('──────────────────────────────────────')
      await sleep(500)
      setIntroComplete(true)
    }

    boot()
  }

  function toggleVoice() {
    const next = !voiceMuted
    setVoiceMutedState(next)
    setVoiceMuted(next)
  }

  // activateAudio is now just used to init audio on claim (already started by then)
  function activateAudio() {
    initAudio()
  }

  // Open info panel when bounty selected
  useEffect(() => {
    if (selectedBounty) setInfoOpen(true)
    else if (claimState === 'idle') setInfoOpen(false)
  }, [selectedBounty])

  // Supabase Realtime — live bounty updates
  useEffect(() => {
    const channel = supabase
      .channel('bounties-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bounties' },
        (payload) => {
          const b = payload.new as Bounty
          if (b.creator_id === user.id) return // we just posted it, page reload handles it
          setBounties(prev => {
            if (prev.find(x => x.id === b.id)) return prev
            setNewBountyIds(ids => new Set([...ids, b.id]))
            setTimeout(() => setNewBountyIds(ids => { const n = new Set(ids); n.delete(b.id); return n }), 1500)
            return [b, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bounties' },
        (payload) => {
          const b = payload.new as Bounty
          if (b.status !== 'active') {
            setBounties(prev => prev.filter(x => x.id !== b.id))
            if (selectedBounty?.id === b.id) setSelectedBounty(null)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user.id])

  function addLine(text: string, type: TerminalLine['type'] = 'normal') {
    setTerminalLines(prev => [...prev, { text, type }])
  }

  function selectBounty(b: Bounty) {
    activateAudio()
    playBlip()
    setSelectedBounty(b)
  }

  async function handleClaim(passcode: string) {
    if (!selectedBounty) return

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
    activateAudio()
    stopAllAudio()
    playImSearchingMp3()

    const target = selectedBounty

    addLine(`──────────────────────────────────────`, 'system')
    addLine(`VERIFYING BOUNTY: "${target.location_name.toUpperCase()}"`, 'system')

    const searchingCount = Math.random() < 0.5 ? 2 : 3
    const hasGiveMeAMinute = Math.random() < 0.6

    await sleep(1500)
    addLine(`SEARCHING.`)
    speakQueued('Searching.')

    for (let i = 0; i < searchingCount; i++) {
      await sleep(2000 + Math.random() * 500)
      addLine(`I'M SEARCHING.`)
      speakQueued("I'm searching.")
    }

    if (hasGiveMeAMinute) {
      await sleep(2200 + Math.random() * 600)
      addLine(`GIVE ME A MINUTE.`)
      speakQueued('Give me a minute.')
    }

    await sleep(2000 + Math.random() * 500)
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
        hunt_id: null,
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
        <div className="system-status" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link href="/profile" style={{ color: 'var(--amber)', textDecoration: 'none' }}>
            {user.username.toUpperCase()} | {points.toLocaleString()} PTS
          </Link>
          <Link href="/leaderboard" style={{ color: 'var(--green)', textDecoration: 'none', fontSize: '1rem' }}>
            🏆
          </Link>
        </div>
      </header>

      <main style={{ position: 'relative' }}>
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div
            className={`bear-container ${bearState}`}
            onClick={activateAudio}
            title="Click to activate bear voice"
          >🐻</div>
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
                {/* Pre-start: click to begin */}
                {!started && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 200 }}>
                    <button
                      onClick={handleStart}
                      style={{
                        background: 'none',
                        border: '2px solid var(--amber)',
                        color: 'var(--amber)',
                        fontFamily: 'inherit',
                        fontSize: '1.6rem',
                        padding: '16px 40px',
                        cursor: 'pointer',
                        letterSpacing: 4,
                        animation: 'pulse-amber 1.5s ease-in-out infinite',
                      }}
                    >
                      ► CLICK TO START
                    </button>
                  </div>
                )}

                {/* Boot intro lines — appear one by one after start */}
                {started && introLines.map((line, i) => (
                  <div key={`intro-${i}`} className={`terminal-line ${line.type}`}>
                    {line.text}
                  </div>
                ))}

                {/* Blinking cursor while booting */}
                {started && !introComplete && (
                  <div className="terminal-line" style={{ color: 'var(--amber)' }}>
                    <span className="cursor" style={{ background: 'var(--amber)' }} />
                  </div>
                )}

                {introComplete && bounties.length === 0 && (
                  <>
                    <div className="terminal-line">NO ACTIVE BOUNTIES DETECTED.</div>
                    <div className="terminal-line system">POST A BOUNTY TO BEGIN THE HUNT.</div>
                  </>
                )}

                {introComplete && bounties.length > 0 && (
                  <>
                    <div className="terminal-line system">
                      {bounties.length} ACTIVE {bounties.length === 1 ? 'BOUNTY' : 'BOUNTIES'} AVAILABLE:
                    </div>
                    <div className="terminal-line">──────────────────────────────────────</div>
                    {bounties.map((b, i) => {
                      const expiry = b.expires_at ? timeLeft(b.expires_at) : null
                      const isNew = newBountyIds.has(b.id)
                      return (
                        <div
                          key={b.id}
                          className={`bounty-row terminal-line${selectedBounty?.id === b.id ? ' selected' : ''}${isNew ? ' new-bounty' : ''}`}
                          style={{ flexDirection: 'column', alignItems: 'flex-start', animationDelay: `${i * 0.04}s` }}
                          onClick={() => selectBounty(b)}
                        >
                          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                            <span className="bounty-name">► {b.location_name.toUpperCase()}</span>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexShrink: 0 }}>
                              {expiry && (
                                <span style={{ color: 'var(--red)', fontSize: '0.95rem' }}>⏱{expiry}</span>
                              )}
                              <span className="bounty-diff">{diffStars(b.difficulty)}</span>
                              <span className="bounty-pts">{b.reward_points.toLocaleString()} PTS</span>
                            </div>
                          </div>
                          {b.clues?.[0]?.text && (
                            <div className="bounty-clue" style={{ marginTop: 2, paddingLeft: 16 }}>
                              {b.clues[0].text}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </>
                )}
              </>
            )}
          </div>

          {!showingSequence && started && (
            <div className="terminal-input-area">
              <button className="action-btn primary" onClick={() => setShowCreate(true)}>
                ► POST BOUNTY
              </button>
              <Link href="/leaderboard" className="action-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>
                🏆 LEADERBOARD
              </Link>
              <button className="action-btn" onClick={() => setShowMap(true)}>
                🗺️ MAP
              </button>
              <button
                className={`voice-btn ${voiceMuted ? 'muted' : 'active'}`}
                onClick={toggleVoice}
                title={voiceMuted ? 'Unmute voice' : 'Mute voice'}
                style={{ marginLeft: 'auto' }}
              >
                {voiceMuted ? '🔇' : '🔊'}
              </button>
            </div>
          )}
        </section>

        {/* ── Info Panel ── */}
        <aside className={`info-panel${infoOpen ? ' mobile-open' : ''}`}>
          {selectedBounty && claimState !== 'done' ? (
            <div style={{ height: '100%', overflowY: 'auto' }}>
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

      {showMap && (
        <MapModal
          bounties={bounties}
          onClose={() => setShowMap(false)}
          onSelect={(b) => { setShowMap(false); selectBounty(b) }}
        />
      )}
    </>
  )
}
