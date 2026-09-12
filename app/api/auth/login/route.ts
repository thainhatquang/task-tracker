import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface LoginBody {
  username?: string;
  password?: string;
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  user?: unknown;
  error?: string;
  error_description?: string;
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Server chưa được cấu hình xác thực." }, { status: 500 });
  }

  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Dữ liệu đăng nhập không hợp lệ." }, { status: 400 });
  }

  const username = body.username?.trim().toLowerCase();
  const password = body.password ?? "";
  if (!username || username.length > 100 || !password) {
    return NextResponse.json({ error: "Vui lòng nhập tên đăng nhập và mật khẩu." }, { status: 400 });
  }

  const resolver = createClient(supabaseUrl, serviceRoleKey || anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  let email: string | null = username.includes("@") ? username : null;

  if (!email && serviceRoleKey) {
    const accountQuery = resolver
      .from("app_users")
      .select("id, auth_email");
    const { data: account, error: accountError } = await (username.includes("@")
      ? accountQuery.ilike("auth_email", username)
      : accountQuery.ilike("username", username)
    ).maybeSingle();
    if (accountError || !account) {
      return NextResponse.json({ error: "Tên đăng nhập hoặc mật khẩu không chính xác." }, { status: 401 });
    }
    email = account.auth_email || null;
  }

  if (!email) {
    const { data, error } = await resolver.rpc("resolve_login_email", { login_username: username });
    if (!error && typeof data === "string" && data) email = data;
  }

  if (!email) {
    return NextResponse.json(
      { error: "Supabase Auth chưa có tài khoản cho username này. Hãy tạo user trong Authentication → Users trước khi đăng nhập." },
      { status: 401 },
    );
  }

  const tokenResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  const token = (await tokenResponse.json()) as TokenResponse;

  if (!tokenResponse.ok || !token.access_token || !token.refresh_token) {
    return NextResponse.json(
      { error: "Username đúng nhưng mật khẩu Supabase Auth không khớp. Hãy đặt lại mật khẩu tài khoản Auth thành mật khẩu bạn đang sử dụng." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expires_in: token.expires_in,
    expires_at: token.expires_at,
    token_type: token.token_type,
  });
}
