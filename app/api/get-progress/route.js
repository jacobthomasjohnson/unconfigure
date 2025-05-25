export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET (req) {
  try {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')
    const date = searchParams.get('date')

    console.log('[get-progress] user_id:', user_id, 'date:', date)

    if (!user_id || !date) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or date' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data, error } = await supabase
      .from('game_progress')
      .select('*')
      .eq('user_id', user_id)
      .eq('date', date)
      .maybeSingle()

    if (error) {
      console.error('[Supabase error]:', error)
      return new Response(
        JSON.stringify({
          error: 'Supabase query failed',
          detail: error.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('[API] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Unexpected server error', detail: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
