import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://gcnniuboogvrhmfqmbou.supabase.co', // 👈 tu URL real
  'sb_publishable_pMA05mmNJulEAnxL_hnhvg_zCMvZxWm' // 👈 tu key
);