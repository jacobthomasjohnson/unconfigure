import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST (req) {
  try {
    const body = await req.json()

    if (!body?.user_id || !body?.date || !body?.guesses) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400
        }
      )
    }

    const { error } = await supabase
      .from('game_progress')
      .upsert(body, { onConflict: ['user_id', 'date'] })

    if (error) {
      console.error('Supabase error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500
      })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500
    })
  }
}
