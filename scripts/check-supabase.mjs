import { createClient } from "@supabase/supabase-js";

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const serviceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!url) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}
if (!serviceRole) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.storage.listBuckets();

if (error) {
  console.error("Supabase connection failed:", error.message);
  process.exit(2);
}

console.log(
  JSON.stringify(
    { ok: true, bucketCount: (data ?? []).length, buckets: (data ?? []).map((b) => b.name) },
    null,
    2
  )
);

