import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // The audit log page performs its own client-side role check because the
  // browser session is established by Supabase Auth on the client.
  if (pathname === "/admin/logs") {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // getUser validates the access token with Supabase instead of trusting a
  // client-controlled session payload.
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: appUserById, error: roleErrorById } = await supabase
    .from("app_users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  let appUser = appUserById;
  let roleError = roleErrorById;
  if (!appUser && user.email) {
    const { data, error } = await supabase
      .from("app_users")
      .select("role")
      .ilike("auth_email", user.email)
      .maybeSingle();
    appUser = data;
    roleError = error;
  }

  if (roleError || appUser?.role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
