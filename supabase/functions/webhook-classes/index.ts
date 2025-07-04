import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const {
      "event-type": eventType,
      "event-code": eventCode,
      "event-name": eventName,
      schedule,
      "instructor-email": instructorEmail,
      "co-instructor-email": coInstructorEmail,
      influencer
    } = await req.json()

    console.log('Payload recebido:', { eventType, eventCode, eventName, schedule, instructorEmail, coInstructorEmail, influencer })

    if (!eventType || !eventCode || !schedule || !instructorEmail) {
      throw new Error('Campos obrigatórios ausentes: event-type, event-code, schedule, instructor-email')
    }

    const validEventTypes = ['training', 'group']
    if (!validEventTypes.includes(eventType)) {
      throw new Error(`Tipo de evento inválido: ${eventType}. Deve ser 'training' ou 'group'.`)
    }

    const { data: instructorData, error: instructorError } = await supabaseClient
      .from('instructors')
      .select('id')
      .eq('email', instructorEmail)
      .single()

    if (instructorError || !instructorData) {
      throw new Error(`Instrutor com e-mail ${instructorEmail} não encontrado`)
    }

    const instructorId = instructorData.id

    if (coInstructorEmail) {
      console.log(`Co-instructor informado (não vinculado ainda): ${coInstructorEmail}`)
    }

    let influencerId = null
    if (influencer) {
      const { data: influencerData } = await supabaseClient
        .from('influencers')
        .select('id')
        .eq('email', influencer)
        .single()

      if (influencerData) {
        influencerId = influencerData.id
      } else {
        console.warn(`Influencer com e-mail ${influencer} não encontrado. Ignorando.`)
      }
    }

    let startDate = null
    let endDate = null
    if (Array.isArray(schedule) && schedule.length > 0) {
      const sorted = [...schedule].sort((a, b) =>
        new Date(a['initial-time']).getTime() - new Date(b['initial-time']).getTime()
      )
      startDate = sorted[0]['initial-time']
      endDate = sorted[sorted.length - 1]['end-time']
    }

    const { data: eventData, error: eventError } = await supabaseClient
      .from('events')
      .upsert({
        code: eventCode,
        name: eventName || eventCode,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'code'
      })
      .select()
      .single()

    if (eventError || !eventData) {
      console.error('Erro ao criar/atualizar evento:', eventError)
      throw new Error('Erro ao criar ou atualizar evento')
    }

    const eventId = eventData.id

    const { data: classData, error: classError } = await supabaseClient
      .from('classes')
      .upsert({
        code: eventCode,
        event_type: eventType,
        description: eventName || eventCode,
        schedule,
        instructor_id: instructorId,
        influencer_id: influencerId,
        event_id: eventId,
        start_date: startDate,
        end_date: endDate,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'code'
      })
      .select()
      .single()

    if (classError || !classData) {
      console.error('Erro ao criar/atualizar turma:', classError)
      throw new Error('Erro ao criar ou atualizar turma')
    }

    console.log('Turma criada/atualizada com sucesso:', classData)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Turma criada/atualizada com sucesso',
        class: classData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Erro no webhook:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
