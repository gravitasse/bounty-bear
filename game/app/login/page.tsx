'use client'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
    }

    router.push('/play')
  }

  return (
    <main className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-green-700 p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🐻</div>
          <h1 className="text-2xl font-bold text-green-300">BOUNTY BEAR</h1>
          <p className="text-green-600 text-sm mt-1">&quot;I can find them anywhere!&quot;</p>
        </div>

        {error && <div className="text-red-500 text-xs mb-4 border border-red-900 p-2">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-green-600 text-xs mb-1 uppercase tracking-widest">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="hunter@example.com"
              className="w-full bg-black border border-green-700 text-green-300 p-3 focus:outline-none focus:border-green-400 placeholder-green-900"
            />
          </div>
          <div>
            <label className="block text-green-600 text-xs mb-1 uppercase tracking-widest">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full bg-black border border-green-700 text-green-300 p-3 focus:outline-none focus:border-green-400 placeholder-green-900"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full border border-green-500 text-green-400 py-3 hover:bg-green-900 transition-colors disabled:opacity-50 uppercase tracking-widest"
          >
            {loading ? 'LOADING...' : isSignUp ? '► CREATE ACCOUNT' : '► ENTER THE HUNT'}
          </button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError('') }}
          className="w-full text-green-700 text-xs mt-4 hover:text-green-500 uppercase tracking-widest"
        >
          {isSignUp ? 'Already have an account? Sign in' : 'New hunter? Create account'}
        </button>
      </div>
    </main>
  )
}
