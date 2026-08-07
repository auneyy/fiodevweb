import { createClient } from "@/lib/supabase/server";

export async function getUserCloudId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Try per-user settings first
  const { data } = await supabase
    .from("user_settings")
    .select("cloud_id")
    .eq("user_id", user.id)
    .single();

  if (data?.cloud_id) return data.cloud_id;

  // Fallback to global settings
  const { data: settings } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["cloud_id"]);

  return settings?.find((s) => s.key === "cloud_id")?.value || null;
}
