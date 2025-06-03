import { createSupabaseClient } from '@/lib/supabaseClient'

export async function POST(req) {
      const body = await req.json()
      const { user_id, date } = body

      if (!user_id || !date) {
            return Response.json({ error: 'Missing user_id or date' }, { status: 400 })
      }

      const supabase = createSupabaseClient(user_id)

      const { data, error } = await supabase
            .from('game_progress')
            .select('date')
            .eq('user_id', user_id)
            .eq('date', date)
            .limit(1)


      if (error) {
            console.error('Supabase error:', error)
            return Response.json({ error: error.message }, { status: 500 })
      }

      return Response.json({ data })
}
