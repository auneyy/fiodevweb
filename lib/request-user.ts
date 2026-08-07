import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export async function getRequestUserCloudId(cookies: {
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
  if (!user) return null;

  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await serviceSupabase
    .from("user_settings")
    .select("cloud_id")
    .eq("user_id", user.id)
    .single();

  return data?.cloud_id || null;
}

export async function getRequestUserCredentials(cookies: {
  get: (name: string) => { value: string } | undefined;
}): Promise<{ cloudId: string; apiKey: string } | null> {
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
  if (!user) return null;

  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await serviceSupabase
    .from("user_settings")
    .select("cloud_id, api_key")
    .eq("user_id", user.id)
    .single();

  if (!data) return null;
  return { cloudId: data.cloud_id || "", apiKey: data.api_key || "" };
}
