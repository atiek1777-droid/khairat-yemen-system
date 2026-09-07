import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Service-role Supabase client. NEVER import this file from a Client
 * Component or expose it to the browser — it bypasses Row Level Security.
 * Use only inside Server Actions / Route Handlers that have already
 * verified the caller is an authenticated admin.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY غير مُعرَّف في متغيرات البيئة. أضِفه في .env.local لتفعيل إدارة المستخدمين."
    );
  }
  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
