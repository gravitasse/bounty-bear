export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BountyBoard from '@/components/BountyBoard'

export default async function PlayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('username, points, reputation_level')
    .eq('id', user.id)
    .single()

  const { data: bounties } = await supabase
    .from('bounties')
    .select('id, location_name, reward_points, difficulty, created_at, creator_id, clues')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <BountyBoard
      user={{
        id: user.id,
        username: profile?.username ?? '',
        points: profile?.points ?? 1000,
        reputation_level: profile?.reputation_level ?? 1,
      }}
      bounties={bounties ?? []}
    />
  )
}
