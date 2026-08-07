import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const publicPaths = ["/login", "/register", "/api/webhook", "/auth/callback", "/2fa/setup"];
  const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith("/auth/");

  // Not logged in → redirect to login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in but on auth pages → redirect to dashboard
  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Check 2FA: if user has verified TOTP factor but AAL is only aal1
  if (user && !isPublicPath) {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const hasVerifiedTotp = factors?.totp?.some((f) => f.status === "verified");

    if (hasVerifiedTotp) {
      const { data: aalData } = await supabase.auth.getAuthenticatorAssuranceLevel();
      const currentLevel = aalData?.currentLevel;
      const nextLevel = aalData?.nextLevel;

      // User needs to verify 2FA
      if (currentLevel === "aal1" && nextLevel === "aal2" && pathname !== "/2fa/verify") {
        const url = request.nextUrl.clone();
        url.pathname = "/2fa/verify";
        return NextResponse.redirect(url);
      }

      // User already at aal2 but trying to access 2FA pages
      if (currentLevel === "aal2" && pathname.startsWith("/2fa/verify")) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
