import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL! || 'https://zjwglclsolonpbuvrevq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY! || 'sb_publishable_dZTD0DAWXUcMyg9p99NtOw_liItZUKt';

export const SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);