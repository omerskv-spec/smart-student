import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tvckyeplbdemdpnzxhni.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Y2t5ZXBsYmRlbWRwbnp4aG5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk1NTk3MCwiZXhwIjoyMDkwNTMxOTcwfQ.9taeVXMWyiqa_koKoI_qXzhNO4ittHJG9dPOxh1pMas';

let _db: SupabaseClient | null = null;

export function getDb(): SupabaseClient {
      if (!_db) {
              _db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      }
      return _db;
}

// Browser client for client-side queries (uses anon key via env)
export function createBrowserClient() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = typeof window !== 'undefined'
  ? createBrowserClient()
      : null as unknown as ReturnType<typeof createClient>;
