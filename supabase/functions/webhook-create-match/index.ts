import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      "player-email": playerEmail,
      "class-code": classCode,
      "app-serial": appSerial,
      "match-number": matchNumber
    } = body

    if (!playerEmail || !classCode || !appSerial || matchNumber == null) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Campos obrigatórios ausentes: player-email, class-code, match-number, app-serial',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: players, error: playerError } = await supabase
      .from('players')
      .select('id, email')
      .eq('email', playerEmail)

    if (playerError || !players || players.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Jogador com email '${playerEmail}' não encontrado.`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    const player = players[0]

    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('code', classCode)
      .single()

    if (classError || !classData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Turma com código '${classCode}' não encontrada.`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        player_id: player.id,
        class_id: classData.id,
        match_number: matchNumber,
        app_serial: appSerial,
        match_date: new Date().toISOString(),
      })
      .select()
      .single()

    if (matchError || !match) {
      throw new Error(`Erro ao salvar match: ${matchError?.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        match_id: match.id,
        player_id: player.id,
        message: 'Partida registrada com sucesso',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (err) {
    console.error('Erro no webhook:', err)
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
