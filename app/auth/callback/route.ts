import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new NextRequest(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") || "signup";
  const next = searchParams.get("next") ?? "/";

  const redirectTo = NextResponse.redirect(`${origin}${next}`);

  if (token_hash) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            request.cookies.set({ name, value, ...options });
            redirectTo.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: Record<string, unknown>) {
            request.cookies.set({ name, value: "", ...options });
            redirectTo.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "magiclink" | "recovery" | "email",
    });

    if (!error) {
      return redirectTo;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Verifikasi gagal`);
}
