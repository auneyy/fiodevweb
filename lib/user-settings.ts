import { createServerClient } from "@/lib/supabase/server";

export async function getUserCloudId(): Promise<string | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_settings")
    .select("cloud_id")
    .eq("user_id", user.id)
    .single();

  return data?.cloud_id || null;
}
