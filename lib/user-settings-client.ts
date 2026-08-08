import { createClient } from "@/lib/supabase/client";

export async function getClientCloudId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("user_settings")
      .select("cloud_id")
      .eq("user_id", user.id)
      .single();

    return data?.cloud_id || null;
  } catch (err) {
    console.error("[getClientCloudId] Error:", err);
    return null;
  }
}
