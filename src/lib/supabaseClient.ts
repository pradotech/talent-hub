// Configuração do Supabase Client
// TODO: Quando o banco Supabase for provisionado, instalar @supabase/supabase-js
// e carregar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY de variáveis de ambiente.

export const isSupabaseConfigured = false;

/*
// Exemplo de integração futura:
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
*/

export const supabase = null;
