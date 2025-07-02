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
      schedule,
      "instructor-email": instructorEmail,
      "co-instructor-email": coInstructorEmail,
      influencer
    } = await req.json()

    console.log('Payload recebido:', { eventType, eventCode, schedule, instructorEmail, coInstructorEmail, influencer })

    if (!eventType || !eventCode || !schedule || !instructorEmail) {
      throw new Error('Campos obrigatórios ausentes: event-type, event-code, schedule, instructor-email')
    }

    const validEventTypes = ['training', 'course']
    if (!validEventTypes.includes(eventType)) {
      throw new Error(`Tipo de evento inválido: ${eventType}. Deve ser 'training' ou 'course'.`)
    }

    // Buscar instrutor
    const { data: instructorData, error: instructorError } = await supabaseClient
      .from('instructors')
      .select('id')
      .eq('email', instructorEmail)
      .single()

    if (instructorError || !instructorData) {
      console.error('Instrutor não encontrado:', instructorError)
      throw new Error(`Instrutor com e-mail ${instructorEmail} não encontrado`)
    }

    const instructorId = instructorData.id

    // Co-instructor (apenas logado, não utilizado ainda)
    if (coInstructorEmail) {
      console.log(`Co-instructor informado: ${coInstructorEmail} (não será vinculado ainda)`)
    }

    // Buscar influencer (opcional)
    let influencerId = null
    if (influencer) {
      const { data: influencerData, error: influencerError } = await supabaseClient
        .from('influencers')
        .select('id')
        .eq('email', influencer)
        .single()

      if (influencerError || !influencerData) {
        console.warn(`Influencer com e-mail ${influencer} não encontrado. Continuar sem vincular.`)
      } else {
        influencerId = influencerData.id
      }
    }

    // Calcular start_date e end_date com base no schedule
    let startDate = null
    let endDate = null

    if (Array.isArray(schedule) && schedule.length > 0) {
      const sortedSchedule = [...schedule].sort((a: any, b: any) =>
        new Date(a['initial-time']).getTime() - new Date(b['initial-time']).getTime()
      )
      startDate = sortedSchedule[0]['initial-time']
      endDate = sortedSchedule[sortedSchedule.length - 1]['end-time']
    }

    // Upsert da turma
    const { data: classData, error: classError } = await supabaseClient
      .from('classes')
      .upsert({
        code: eventCode,
        event_type: eventType,
        schedule: schedule,
        instructor_id: instructorId,
        influencer_id: influencerId,
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

    console.log('Turma criada/atualizada:', classData)

    return new Response(
      JSON.stringify({
        success: true,
        class: classData,
        message: 'Turma criada/atualizada com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Webhook error:', JSON.stringify(error, null, 2))
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
