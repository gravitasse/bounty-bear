'use client'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/play` },
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-green-700 p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🐻</div>
          <h1 className="text-2xl font-bold text-green-300">BOUNTY BEAR</h1>
          <p className="text-green-600 text-sm mt-1">&quot;I can find them anywhere!&quot;</p>
        </div>

        {sent ? (
          <div className="text-center">
            <p className="text-green-400">► CHECK YOUR EMAIL</p>
            <p className="text-green-600 text-sm mt-2">Magic link sent to {email}</p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-green-600 text-xs mb-1 uppercase tracking-widest">
                Enter Email to Begin Hunt
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="hunter@example.com"
                className="w-full bg-black border border-green-700 text-green-300 p-3 focus:outline-none focus:border-green-400 placeholder-green-900"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full border border-green-500 text-green-400 py-3 hover:bg-green-900 transition-colors disabled:opacity-50 uppercase tracking-widest"
            >
              {loading ? 'SENDING...' : '► ENTER THE HUNT'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
