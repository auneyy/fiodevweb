import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

async function getUserId(cookies: {
  get: (name: string) => { value: string } | undefined;
}): Promise<string | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

const serviceSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function getRequestUserCloudId(cookies: {
  get: (name: string) => { value: string } | undefined;
}): Promise<string | null> {
  const userId = await getUserId(cookies);
  if (!userId) return null;

  const sb = serviceSupabase();
  const { data } = await sb
    .from("user_settings")
    .select("cloud_id")
    .eq("user_id", userId)
    .single();

  if (data?.cloud_id) return data.cloud_id;

  // Fallback to global settings
  const { data: settings } = await sb
    .from("settings")
    .select("key, value")
    .in("key", ["cloud_id"]);

  return settings?.find((s) => s.key === "cloud_id")?.value || null;
}

export async function getRequestUserCredentials(cookies: {
  get: (name: string) => { value: string } | undefined;
}): Promise<{ cloudId: string; apiKey: string } | null> {
  const userId = await getUserId(cookies);
  if (!userId) return null;

  const sb = serviceSupabase();
  const { data } = await sb
    .from("user_settings")
    .select("cloud_id, api_key")
    .eq("user_id", userId)
    .single();

  if (data?.cloud_id && data?.api_key) {
    return { cloudId: data.cloud_id, apiKey: data.api_key };
  }

  // Fallback to global settings
  const { data: settings } = await sb
    .from("settings")
    .select("key, value")
    .in("key", ["api_key", "cloud_id"]);

  return {
    cloudId: data?.cloud_id || settings?.find((s) => s.key === "cloud_id")?.value || "",
    apiKey: data?.api_key || settings?.find((s) => s.key === "api_key")?.value || "",
  };
}
