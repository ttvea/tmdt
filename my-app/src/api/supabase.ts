import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[supabase] URL:', supabaseUrl);
console.log('[supabase] Key starts with:', supabaseKey?.substring(0, 20) + '...');

export const supabase = createClient(supabaseUrl, supabaseKey);