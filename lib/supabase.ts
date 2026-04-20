import { createClient } from '@supabase/supabase-js';
export function createBrowserClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(supabaseUrl, supabaseAnonKey);
}
export const supabase = typeof window !== 'undefined'
  ? createBrowserClient()
    : null as unknown as ReturnType<typeof createClient>;
export function createServiceClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(supabaseUrl, serviceRoleKey, {
          auth: {
                  autoRefreshToken: false,
                  persistSession: false,
          },
    });
}
