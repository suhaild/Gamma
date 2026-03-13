import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseAdminSingleton: SupabaseClient | null = null;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return { url, serviceRoleKey };
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig());
}

export function getSupabaseAdminClient() {
  if (supabaseAdminSingleton) {
    return supabaseAdminSingleton;
  }

  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  supabaseAdminSingleton = createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseAdminSingleton;
}
