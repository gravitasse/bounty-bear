'use client'

import { useState } from 'react'
import CreateBountyModal from './CreateBountyModal'

type Bounty = {
  id: string
  location_name: string
  reward_points: number
  difficulty: number
  created_at: string
  creator_id: string
  clues: { text: string; unlock_distance: number | null }[]
}

type User = {
  id: string
  username: string
  points: number
  reputation_level: number
}

export default function BountyBoard({ user, bounties }: { user: User; bounties: Bounty[] }) {
  const [showCreate, setShowCreate] = useState(false)

  const difficultyLabel = (d: number) => ['', '★☆☆☆☆', '★★☆☆☆', '★★★☆☆', '★★★★☆', '★★★★★'][d] ?? '???'

  return (
    <main className="min-h-screen bg-black text-green-400 font-mono p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="border border-green-700 p-4 mb-4 flex items-center justify-between">
        <div>
          <span className="text-green-600 text-xs uppercase tracking-widest">Hunter</span>
          <div className="text-green-300 font-bold">{user.username ?? 'Unknown'}</div>
        </div>
        <div className="text-center">
          <div className="text-3xl">🐻</div>
        </div>
        <div className="text-right">
          <span className="text-green-600 text-xs uppercase tracking-widest">Balance</span>
          <div className="text-green-300 font-bold">{user.points?.toLocaleString() ?? 1000} pts</div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setShowCreate(true)}
          className="border border-green-600 text-green-400 py-3 hover:bg-green-900 transition-colors text-sm uppercase tracking-widest"
        >
          ► POST BOUNTY
        </button>
        <button className="border border-green-700 text-green-600 py-3 hover:bg-green-900 transition-colors text-sm uppercase tracking-widest">
          🏆 LEADERBOARD
        </button>
      </div>

      {/* Bounty List */}
      <div className="border border-green-700 p-3 mb-2">
        <div className="text-green-600 text-xs uppercase tracking-widest mb-3">
          Active Bounties [{bounties.length}]
        </div>

        {bounties.length === 0 ? (
          <div className="text-green-800 text-sm text-center py-8">
            No active bounties. Be the first to post one.
          </div>
        ) : (
          <div className="space-y-2">
            {bounties.map(b => (
              <div
                key={b.id}
                className="border border-green-900 hover:border-green-600 p-3 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-green-300 font-bold text-sm">{b.location_name ?? 'Unknown Location'}</div>
                    <div className="text-green-700 text-xs mt-1">{b.clues?.[0]?.text ?? 'No clue available'}</div>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <div className="text-green-400 font-bold">{b.reward_points.toLocaleString()} pts</div>
                    <div className="text-green-700 text-xs">{difficultyLabel(b.difficulty)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateBountyModal userId={user.id} onClose={() => setShowCreate(false)} />}
    </main>
  )
}
