'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Clue = { text: string; unlock_distance: number | null }

export default function CreateBountyModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [locationName, setLocationName] = useState('')
  const [reward, setReward] = useState(100)
  const [difficulty, setDifficulty] = useState(3)
  const [clues, setClues] = useState<Clue[]>([
    { text: '', unlock_distance: null },
    { text: '', unlock_distance: 500 },
    { text: '', unlock_distance: 100 },
  ])
  const [passcode, setPasscode] = useState('')
  const [loading, setLoading] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [error, setError] = useState('')

  async function getLocation() {
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGettingLocation(false)
        setError('')
      },
      () => {
        setGettingLocation(false)
        setShowManual(true)
        setError('GPS denied — enter coordinates manually.')
      }
    )
  }

  function applyManualCoords() {
    const lat = parseFloat(manualLat)
    const lng = parseFloat(manualLng)
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return setError('Invalid coordinates.')
    }
    setCoords({ lat, lng })
    setError('')
  }

  async function handleSubmit() {
    if (!coords) return setError('Location required.')
    if (clues.some(c => !c.text.trim())) return setError('All 3 clues required.')
    if (!passcode.trim()) return setError('Passcode required.')

    setLoading(true)
    setError('')

    const { error: err } = await supabase.from('bounties').insert({
      creator_id: userId,
      location: `POINT(${coords.lng} ${coords.lat})`,
      location_name: locationName || 'Unknown Location',
      reward_points: reward,
      difficulty,
      clues,
      verification_method: 'passcode',
      verification_data: { passcode_hash: passcode, hint: clues[2].text },
    })

    setLoading(false)
    if (err) return setError(err.message)
    onClose()
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md border border-green-600 bg-black p-6 font-mono">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-green-300 uppercase tracking-widest text-sm">
            Post Bounty [{step}/3]
          </h2>
          <button onClick={onClose} className="text-green-700 hover:text-green-400">✕</button>
        </div>

        {error && <div className="text-red-500 text-xs mb-4 border border-red-900 p-2">{error}</div>}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-green-600 text-xs uppercase tracking-widest block mb-1">Location Name</label>
              <input
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
                placeholder="e.g. Central Park North Gate"
                className="w-full bg-black border border-green-700 text-green-300 p-2 focus:outline-none focus:border-green-400 placeholder-green-900 text-sm"
              />
            </div>
            <div>
              <label className="text-green-600 text-xs uppercase tracking-widest block mb-1">Reward Points (min 100)</label>
              <input
                type="number"
                value={reward}
                min={100}
                max={10000}
                onChange={e => setReward(Number(e.target.value))}
                className="w-full bg-black border border-green-700 text-green-300 p-2 focus:outline-none focus:border-green-400 text-sm"
              />
            </div>
            <div>
              <label className="text-green-600 text-xs uppercase tracking-widest block mb-1">Difficulty (1-5)</label>
              <input
                type="range"
                min={1}
                max={5}
                value={difficulty}
                onChange={e => setDifficulty(Number(e.target.value))}
                className="w-full accent-green-500"
              />
              <div className="text-green-400 text-xs text-center mt-1">{'★'.repeat(difficulty)}{'☆'.repeat(5 - difficulty)}</div>
            </div>
            <div>
              <label className="text-green-600 text-xs uppercase tracking-widest block mb-2">GPS Location</label>
              {coords ? (
                <div className="text-green-400 text-xs border border-green-800 p-2">
                  ✓ {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  <button onClick={() => setCoords(null)} className="ml-2 text-green-700 hover:text-green-500">change</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={getLocation}
                    disabled={gettingLocation}
                    className="w-full border border-green-700 text-green-600 py-2 hover:bg-green-900 transition-colors text-xs uppercase tracking-widest disabled:opacity-50"
                  >
                    {gettingLocation ? 'ACQUIRING...' : '► GET MY LOCATION'}
                  </button>
                  {showManual && (
                    <div className="space-y-2">
                      <div className="text-green-700 text-xs text-center">— or enter manually —</div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="any"
                          value={manualLat}
                          onChange={e => setManualLat(e.target.value)}
                          placeholder="Latitude"
                          className="bg-black border border-green-800 text-green-300 p-2 text-xs focus:outline-none focus:border-green-600 placeholder-green-900"
                        />
                        <input
                          type="number"
                          step="any"
                          value={manualLng}
                          onChange={e => setManualLng(e.target.value)}
                          placeholder="Longitude"
                          className="bg-black border border-green-800 text-green-300 p-2 text-xs focus:outline-none focus:border-green-600 placeholder-green-900"
                        />
                      </div>
                      <button
                        onClick={applyManualCoords}
                        className="w-full border border-green-700 text-green-600 py-2 hover:bg-green-900 transition-colors text-xs uppercase tracking-widest"
                      >
                        ► SET LOCATION
                      </button>
                    </div>
                  )}
                  {!showManual && (
                    <button onClick={() => setShowManual(true)} className="w-full text-green-800 text-xs hover:text-green-600 uppercase tracking-widest">
                      enter coordinates manually
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!coords || !locationName}
              className="w-full border border-green-500 text-green-400 py-2 hover:bg-green-900 transition-colors text-xs uppercase tracking-widest disabled:opacity-50"
            >
              NEXT: SET CLUES ►
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {clues.map((clue, i) => (
              <div key={i}>
                <label className="text-green-600 text-xs uppercase tracking-widest block mb-1">
                  Clue {i + 1} {clue.unlock_distance ? `(unlocks at ${clue.unlock_distance}m)` : '(visible immediately)'}
                </label>
                <input
                  value={clue.text}
                  onChange={e => {
                    const updated = [...clues]
                    updated[i] = { ...updated[i], text: e.target.value }
                    setClues(updated)
                  }}
                  placeholder={i === 0 ? 'General hint...' : i === 1 ? 'More specific...' : 'Very precise...'}
                  className="w-full bg-black border border-green-700 text-green-300 p-2 focus:outline-none focus:border-green-400 placeholder-green-900 text-sm"
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setStep(1)} className="border border-green-800 text-green-700 py-2 text-xs uppercase tracking-widest hover:bg-green-900">
                ◄ BACK
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={clues.some(c => !c.text.trim())}
                className="border border-green-500 text-green-400 py-2 hover:bg-green-900 transition-colors text-xs uppercase tracking-widest disabled:opacity-50"
              >
                NEXT ►
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-green-600 text-xs">Set a passcode hunters must find at your location to claim the bounty.</p>
            <div>
              <label className="text-green-600 text-xs uppercase tracking-widest block mb-1">Passcode</label>
              <input
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                placeholder="e.g. BEAR2026"
                className="w-full bg-black border border-green-700 text-green-300 p-2 focus:outline-none focus:border-green-400 placeholder-green-900 text-sm uppercase"
              />
            </div>
            <div className="border border-green-900 p-3 text-xs text-green-700 space-y-1">
              <div>Reward: <span className="text-green-400">{reward.toLocaleString()} pts</span></div>
              <div>Location: <span className="text-green-400">{locationName}</span></div>
              <div>Difficulty: <span className="text-green-400">{'★'.repeat(difficulty)}{'☆'.repeat(5-difficulty)}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setStep(2)} className="border border-green-800 text-green-700 py-2 text-xs uppercase tracking-widest hover:bg-green-900">
                ◄ BACK
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !passcode.trim()}
                className="border border-green-500 text-green-400 py-2 hover:bg-green-900 transition-colors text-xs uppercase tracking-widest disabled:opacity-50"
              >
                {loading ? 'POSTING...' : '► POST BOUNTY'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
