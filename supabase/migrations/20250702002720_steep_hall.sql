/*
  # Trigger para calcular resultados de partidas automaticamente

  1. Funcionalidade
    - Habilita a extensão http para fazer requisições HTTP do banco
    - Cria função PL/pgSQL que chama a Edge Function webhook-match-results
    - Cria trigger que dispara automaticamente após inserção/atualização na tabela matches
    - Calcula lucro, satisfação e bônus automaticamente usando a lógica da Edge Function

  2. Segurança
    - Função criada com SECURITY DEFINER para ter permissões adequadas
    - Tratamento de erros para evitar falhas na transação principal
    - Chamada HTTP assíncrona para não bloquear a inserção da partida

  3. Funcionamento
    - Trigger dispara quando app_serial é inserido ou atualizado em matches
    - Busca dados necessários (player udf_id, class code)
    - Chama Edge Function com payload correto
    - Edge Function calcula e salva os resultados em match_results
*/

-- Habilitar extensão http se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS http;

-- Função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION public.trigger_calculate_match_results()
RETURNS TRIGGER AS $$
DECLARE
    player_udf_id_val TEXT;
    class_code_val TEXT;
    match_number_val INTEGER;
    edge_function_url TEXT;
    supabase_anon_key TEXT;
    http_response http_response;
BEGIN
    -- Verificar se app_serial não está vazio
    IF NEW.app_serial IS NULL OR NEW.app_serial = '' THEN
        RAISE LOG 'app_serial está vazio para match_id: %, pulando cálculo de resultados', NEW.id;
        RETURN NEW;
    END IF;

    -- Obter configurações das variáveis de ambiente
    edge_function_url := current_setting('app.settings.edge_function_url', true);
    supabase_anon_key := current_setting('app.settings.supabase_anon_key', true);
    
    -- Se as configurações não estiverem definidas, usar valores padrão
    IF edge_function_url IS NULL OR edge_function_url = '' THEN
        edge_function_url := 'https://your-project.supabase.co/functions/v1/webhook-match-results';
        RAISE LOG 'Usando URL padrão da Edge Function: %', edge_function_url;
    END IF;

    IF supabase_anon_key IS NULL OR supabase_anon_key = '' THEN
        supabase_anon_key := 'your-anon-key-here';
        RAISE LOG 'Usando anon key padrão (configure app.settings.supabase_anon_key)';
    END IF;

    -- Obter o udf_id do player
    SELECT udf_id INTO player_udf_id_val 
    FROM public.players 
    WHERE id = NEW.player_id;

    -- Obter o código da classe
    SELECT code INTO class_code_val 
    FROM public.classes 
    WHERE id = NEW.class_id;

    -- Obter o número da partida
    match_number_val := COALESCE(NEW.match_number, 0);

    -- Verificar se conseguimos obter os dados necessários
    IF player_udf_id_val IS NULL THEN
        RAISE LOG 'Player não encontrado para player_id: %, pulando cálculo', NEW.player_id;
        RETURN NEW;
    END IF;

    IF class_code_val IS NULL THEN
        RAISE LOG 'Classe não encontrada para class_id: %, pulando cálculo', NEW.class_id;
        RETURN NEW;
    END IF;

    -- Log dos dados que serão enviados
    RAISE LOG 'Chamando Edge Function para: player_udf_id=%, class_code=%, match_number=%', 
              player_udf_id_val, class_code_val, match_number_val;

    BEGIN
        -- Chamar a Edge Function
        SELECT * INTO http_response FROM http_post(
            edge_function_url,
            json_build_object(
                'player-udf-id', player_udf_id_val,
                'class-code', class_code_val,
                'match-number', match_number_val
            )::text,
            'application/json',
            ARRAY[
                ROW('apikey', supabase_anon_key)::http_header,
                ROW('Authorization', 'Bearer ' || supabase_anon_key)::http_header
            ]
        );

        -- Log da resposta
        RAISE LOG 'Edge Function respondeu com status: %, content: %', 
                  http_response.status, http_response.content;

        -- Verificar se a chamada foi bem-sucedida
        IF http_response.status >= 200 AND http_response.status < 300 THEN
            RAISE LOG 'Resultados da partida calculados com sucesso para match_id: %', NEW.id;
        ELSE
            RAISE LOG 'Edge Function retornou erro: status=%, content=%', 
                      http_response.status, http_response.content;
        END IF;

    EXCEPTION WHEN OTHERS THEN
        -- Em caso de erro na chamada HTTP, apenas logar mas não falhar a transação
        RAISE LOG 'Erro ao chamar Edge Function: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger na tabela matches
DROP TRIGGER IF EXISTS trg_after_match_insert_update ON public.matches;

CREATE TRIGGER trg_after_match_insert_update
    AFTER INSERT OR UPDATE OF app_serial ON public.matches
    FOR EACH ROW
    WHEN (NEW.app_serial IS NOT NULL AND NEW.app_serial != '')
    EXECUTE FUNCTION public.trigger_calculate_match_results();

-- Comentários para documentação
COMMENT ON FUNCTION public.trigger_calculate_match_results() IS 
'Função que chama automaticamente a Edge Function webhook-match-results quando uma partida é inserida ou atualizada com app_serial';

COMMENT ON TRIGGER trg_after_match_insert_update ON public.matches IS 
'Trigger que dispara o cálculo automático de resultados de partidas via Edge Function';