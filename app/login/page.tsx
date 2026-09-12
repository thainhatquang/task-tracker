"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!supabase) throw new Error("Supabase chưa được cấu hình.");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = (await response.json()) as {
        access_token?: string;
        refresh_token?: string;
        error?: string;
      };
      if (!response.ok || !result.access_token || !result.refresh_token) {
        throw new Error(result.error || "Đăng nhập thất bại.");
      }
      const { error } = await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      });
      if (error) throw error;

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen flex items-center justify-center text-white p-4 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-rose-600/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-20 w-[30rem] h-[30rem] rounded-full bg-blue-600/20 blur-3xl" />
      <div className="auth-card relative max-w-md w-full rounded-[2rem] p-7 md:p-9">
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-400 flex items-center justify-center text-2xl shadow-lg shadow-rose-900/30">✦</div>
          <h1 className="text-3xl font-black mb-2 tracking-tight">Chào mừng trở lại</h1>
          <p className="text-slate-300 text-sm">Đăng nhập vào hệ thống theo dõi nghị quyết</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Email hoặc tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="auth-input w-full px-4 py-3 rounded-xl transition-all"
              placeholder="thainhatquang@gmail.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input w-full px-4 py-3 pr-16 rounded-xl transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-3 text-xs font-semibold text-slate-300 hover:text-white"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-900/25"
          >
            {loading ? "Đang xác thực..." : "Đăng nhập"}
          </button>

          <div className="flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="text-blue-300 hover:text-blue-200 underline">
              Quên mật khẩu?
            </Link>
            <Link href="/" className="text-slate-300 hover:text-white underline">
              Trang chủ
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
