import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
    return NextResponse.json({ error: "Server chưa được cấu hình xác thực." }, { status: 500 });
  }

  const body = (await request.json()) as { username?: string };
  const username = body.username?.trim().toLowerCase();
  if (!username || username.length > 100) {
    return NextResponse.json({ error: "Tên đăng nhập không hợp lệ." }, { status: 400 });
  }

  if (username.includes("@")) {
    return NextResponse.json({ email: username });
  }

  const client = createClient(supabaseUrl, serviceRoleKey || anonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  if (serviceRoleKey) {
    const accountQuery = client
      .from("app_users")
      .select("id, auth_email");
    const { data: account, error: accountError } = await (username.includes("@")
      ? accountQuery.ilike("auth_email", username)
      : accountQuery.ilike("username", username)
    ).maybeSingle();
    if (accountError || !account) {
      return NextResponse.json({ error: "Tên đăng nhập hoặc mật khẩu không chính xác." }, { status: 401 });
    }
    if (account.auth_email) {
      return NextResponse.json({ email: account.auth_email });
    }
    const { data: email, error: resolverError } = await client.rpc("resolve_login_email", {
      login_username: username,
    });
    if (!resolverError && typeof email === "string" && email) {
      return NextResponse.json({ email });
    }
    return NextResponse.json(
      { error: "Tài khoản chưa được liên kết với Supabase Auth. Hãy cập nhật auth_email hoặc metadata username trong Supabase." },
      { status: 401 },
    );
  }

  const { data: email, error } = await client.rpc("resolve_login_email", { login_username: username });
  if (error || typeof email !== "string" || !email) {
    return NextResponse.json(
      { error: "Supabase Auth chưa có tài khoản cho username này. Hãy tạo user trong Authentication → Users, sau đó liên kết email Auth vào app_users.auth_email." },
      { status: 401 },
    );
  }
  return NextResponse.json({ email });
}
