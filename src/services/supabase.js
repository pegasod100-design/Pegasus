import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://gcnniuboogvrhmfqmbou.supabase.co',
  'sb_publishable_pMA05mmNJulEAnxL_hnhvg_zCMvZxWm' // ✅ ESTA SÍ
);