/*
  # Configuração das variáveis para o trigger

  1. Configurações
    - Define URL da Edge Function
    - Define chave de API do Supabase
    - Permite fácil atualização sem modificar o código do trigger

  2. Uso
    - Execute este script após criar o trigger
    - Substitua os valores pelos seus dados reais do projeto
    - As configurações ficam persistidas no banco de dados
*/

-- Configurar URL da Edge Function
-- SUBSTITUA pela URL real do seu projeto Supabase
SELECT set_config('app.settings.edge_function_url', 
                  'https://your-project-id.supabase.co/functions/v1/webhook-match-results', 
                  false);

-- Configurar chave anônima do Supabase
-- SUBSTITUA pela sua chave anônima real
SELECT set_config('app.settings.supabase_anon_key', 
                  'your-anon-key-here', 
                  false);

-- Verificar se as configurações foram aplicadas
SELECT 
    current_setting('app.settings.edge_function_url', true) as edge_function_url,
    current_setting('app.settings.supabase_anon_key', true) as supabase_anon_key;