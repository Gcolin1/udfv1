import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Cabeçalhos CORS para permitir requisições de qualquer origem
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- INÍCIO DA LÓGICA DE DESSERIALIZAÇÃO E CÁLCULO ---

enum ARCode {
    HOME, A, B, C, D, E, F, G, H
}

// Função de validação para garantir que um número corresponde a um ARCode válido
function isValidARCode(value: number): value is ARCode {
    return value >= ARCode.HOME && value <= ARCode.H;
}

class DeliveryManifest {
    public source: ARCode = ARCode.HOME;
    public satisfaction: boolean = false;
    public value: number = 0;

    public deserialize(serial: string): void {
        const parts = serial.split(';');
        if (parts.length < 5) return;

        const parsedSource = parseInt(parts[0], 10);
        if (!isValidARCode(parsedSource)) {
            throw new Error(`Código ARCode inválido na entrega: ${parts[0]}`);
        }
        
        this.source = parsedSource;
        this.satisfaction = parts[2].toLowerCase() === 'true';
        this.value = parseInt(parts[4], 10) || 0;
    }
}

class GameDataManifest {
    public deliveries: DeliveryManifest[] = [];
    public travelLog: ARCode[] = [];
    public bonusTarget: number = 0;

    private static pathCostGrid: Record<ARCode, Record<ARCode, number>> = {
        [ARCode.HOME]: { [ARCode.HOME]: 0, [ARCode.A]: 1000, [ARCode.B]: 1250, [ARCode.C]: 900, [ARCode.D]: 1100, [ARCode.E]: 950, [ARCode.F]: 1150, [ARCode.G]: 1050, [ARCode.H]: 1200 },
        [ARCode.A]: { [ARCode.HOME]: 1000, [ARCode.A]: 0, [ARCode.B]: 800, [ARCode.C]: 1100, [ARCode.D]: 1500, [ARCode.E]: 1750, [ARCode.F]: 1650, [ARCode.G]: 1350, [ARCode.H]: 950 },
        [ARCode.B]: { [ARCode.HOME]: 1250, [ARCode.A]: 800, [ARCode.B]: 0, [ARCode.C]: 950, [ARCode.D]: 1350, [ARCode.E]: 1100, [ARCode.F]: 1750, [ARCode.G]: 1500, [ARCode.H]: 1650 },
        [ARCode.C]: { [ARCode.HOME]: 900, [ARCode.A]: 1100, [ARCode.B]: 950, [ARCode.C]: 0, [ARCode.D]: 800, [ARCode.E]: 1350, [ARCode.F]: 1500, [ARCode.G]: 1650, [ARCode.H]: 1750 },
        [ARCode.D]: { [ARCode.HOME]: 1100, [ARCode.A]: 1500, [ARCode.B]: 1350, [ARCode.C]: 800, [ARCode.D]: 0, [ARCode.E]: 950, [ARCode.F]: 1100, [ARCode.G]: 1750, [ARCode.H]: 1650 },
        [ARCode.E]: { [ARCode.HOME]: 950, [ARCode.A]: 1750, [ARCode.B]: 1100, [ARCode.C]: 1350, [ARCode.D]: 950, [ARCode.E]: 0, [ARCode.F]: 950, [ARCode.G]: 800, [ARCode.H]: 1500 },
        [ARCode.F]: { [ARCode.HOME]: 1150, [ARCode.A]: 1650, [ARCode.B]: 1750, [ARCode.C]: 1500, [ARCode.D]: 1100, [ARCode.E]: 950, [ARCode.F]: 0, [ARCode.G]: 800, [ARCode.H]: 1100 },
        [ARCode.G]: { [ARCode.HOME]: 1050, [ARCode.A]: 1350, [ARCode.B]: 1500, [ARCode.C]: 1650, [ARCode.D]: 1750, [ARCode.E]: 800, [ARCode.F]: 800, [ARCode.G]: 0, [ARCode.H]: 950 },
        [ARCode.H]: { [ARCode.HOME]: 1200, [ARCode.A]: 950, [ARCode.B]: 1650, [ARCode.C]: 1750, [ARCode.D]: 1650, [ARCode.E]: 1500, [ARCode.F]: 1100, [ARCode.G]: 950, [ARCode.H]: 0 },
    };

    public deserialize(serial: string): void {
        const parts = serial.split('#');
        if (parts.length < 7) throw new Error("Formato de app_serial inválido.");

        this.travelLog = parts[1] ? parts[1].split(',').map(val => {
            const code = parseInt(val, 10);
            if (!isValidARCode(code)) throw new Error(`Código ARCode inválido no travelLog: ${val}`);
            return code;
        }) : [];

        this.deliveries = parts[2] ? parts[2].split('|').map(deliverySerial => {
            const manifest = new DeliveryManifest();
            if(deliverySerial) manifest.deserialize(deliverySerial);
            return manifest;
        }) : [];
        
        this.bonusTarget = parseInt(parts[3], 10) || 0;
    }

    get cost(): number {
        if (!this.travelLog?.length) return 0;
        let totalCost = 0;
        let lastLoc: ARCode = ARCode.HOME;
        for (const currentLoc of this.travelLog) {
            totalCost += GameDataManifest.pathCostGrid[lastLoc][currentLoc];
        }
        return totalCost;
    }

    get revenue(): number {
        return this.deliveries.reduce((sum, d) => sum + d.value, 0);
    }

    get profit(): number {
        return this.revenue - this.cost;
    }

    get satisfaction(): number {
        if (!this.deliveries?.length) return 0;
        const satisfiedCount = this.deliveries.filter(d => d.satisfaction).length;
        return Math.ceil(100 * satisfiedCount / this.deliveries.length);
    }

    get bonus(): number {
        if (!this.deliveries?.length || this.bonusTarget === 0) return 0;
        let totalBonus = 0;
        const allLocations: ARCode[] = [ARCode.A, ARCode.B, ARCode.C, ARCode.D, ARCode.E, ARCode.F, ARCode.G, ARCode.H];
        for (const loc of allLocations) {
            const satisfiedDeliveriesFromLoc = this.deliveries.filter(d => d.source === loc && d.satisfaction).length;
            if (satisfiedDeliveriesFromLoc > this.bonusTarget) {
                totalBonus += satisfiedDeliveriesFromLoc - this.bonusTarget;
            } else if (satisfiedDeliveriesFromLoc === this.bonusTarget) {
                totalBonus++;
            }
        }
        return totalBonus;
    }
}

interface AppSerialData {
    lucro: number;
    satisfacao: number;
    bonus: number;
}

function deserializeAppSerial(serial: string | null): AppSerialData {
    if (!serial) {
        throw new Error("app_serial não pode ser nulo.");
    }
    const manifest = new GameDataManifest();
    manifest.deserialize(serial);
    return {
        lucro: manifest.profit,
        satisfacao: manifest.satisfaction,
        bonus: manifest.bonus,
    };
}

// --- FIM DA LÓGICA DE DESSERIALIZAÇÃO ---


interface MatchResultPayload {
    'player-udf-id': string;
    'class-code': string;
    'match-number': number;
}

// Função principal do servidor da Edge Function
serve(async (req) => {
    // Trata a requisição OPTIONS para CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const payload: MatchResultPayload = await req.json();
        console.log('Payload recebido:', payload);

        const {
            'player-udf-id': playerUdfId,
            'class-code': classCode,
            'match-number': matchNumber
        } = payload;

        if (!playerUdfId || !classCode || matchNumber === undefined) {
            throw new Error('Campos obrigatórios ausentes no payload: player-udf-id, class-code, match-number');
        }

        // 1. Busca IDs do jogador e da turma
        const { data: playerData, error: playerError } = await supabaseClient
            .from('players').select('id').eq('udf_id', playerUdfId).single();
        if (playerError || !playerData) throw new Error(`Player com udf_id ${playerUdfId} não encontrado`);

        const { data: classData, error: classError } = await supabaseClient
            .from('classes').select('id').eq('code', classCode).single();
        if (classError || !classData) throw new Error(`Turma com código ${classCode} não encontrada`);

        // 2. Busca o app_serial bruto da tabela de partidas
        const { data: matchEntry, error: matchEntryError } = await supabaseClient
            .from('matches').select('app_serial').eq('player_id', playerData.id)
            .eq('class_id', classData.id).eq('match_number', matchNumber).single();
        if (matchEntryError || !matchEntry) throw new Error(`Partida não encontrada para os critérios fornecidos.`);
        
        // 3. Desserializa e Calcula os resultados
        const { lucro, satisfacao, bonus } = deserializeAppSerial(matchEntry.app_serial);

        // 4. Salva os resultados calculados
        const { data: matchResultData, error: matchResultError } = await supabaseClient
            .from('match_results').upsert({
                player_id: playerData.id,
                class_id: classData.id,
                match_number: matchNumber,
                lucro: lucro,
                satisfacao: satisfacao,
                bonus: bonus,
                updated_at: new Date().toISOString()
            }, { onConflict: 'player_id,class_id,match_number' }).select().single();

        if (matchResultError) throw matchResultError;
        
        // 5. Atualiza as estatísticas agregadas do jogador
        await updatePlayerStats(supabaseClient, playerData.id, classData.id);

        console.log('Resultado da partida salvo com sucesso:', matchResultData);

        return new Response(JSON.stringify({
            success: true,
            message: 'Resultado da partida processado e salvo com sucesso.',
            matchResult: matchResultData,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Erro no processamento do webhook:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});

async function updatePlayerStats(supabaseClient: SupabaseClient, playerId: string, classId: string) {
    try {
        const { data: results, error: resultsError } = await supabaseClient
            .from('match_results').select('lucro, satisfacao, bonus')
            .eq('player_id', playerId).eq('class_id', classId);

        if (resultsError) throw resultsError;
        if (!results?.length) return;

        const totalMatches = results.length;
        const totalScore = results.reduce((sum, result) => sum + (result.lucro || 0) + (result.satisfacao || 0) + (result.bonus || 0), 0);
        const avgScore = totalScore / totalMatches;

        const { error: updateError } = await supabaseClient
            .from('class_players').update({
                total_matches: totalMatches,
                avg_score: Math.round(avgScore)
            }).eq('player_id', playerId).eq('class_id', classId);

        if (updateError) throw updateError;
        
        console.log(`Estatísticas atualizadas para player ${playerId} na turma ${classId}`);
    } catch (error) {
        console.error('Erro na função updatePlayerStats:', error);
    }
}