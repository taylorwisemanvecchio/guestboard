import { createClient } from "@supabase/supabase-js";

// Server-side client with service role key (for uploads)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const BUCKET_NAME = "images";

export function getPublicUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${path}`;
}
