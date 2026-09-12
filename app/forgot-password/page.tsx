"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (!supabase) throw new Error("Supabase chưa được cấu hình.");
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setMessage("Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi. Hãy kiểm tra hộp thư và thư rác.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Không thể gửi email đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen flex items-center justify-center text-white p-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="auth-card relative max-w-md w-full rounded-[2rem] p-7 md:p-9">
        <div className="mb-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-400 flex items-center justify-center text-2xl shadow-lg shadow-rose-900/30">↻</div>
        <h1 className="text-2xl font-black mb-2">Khôi phục mật khẩu</h1>
        <p className="text-slate-400 text-sm mb-6">
          Nhập email đăng nhập. Supabase sẽ gửi liên kết bảo mật để tạo mật khẩu mới.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="thainhatquang@gmail.com"
            className="auth-input w-full px-4 py-3 rounded-xl"
          />
          {message && <div className="p-3 rounded-lg bg-emerald-900/30 border border-emerald-500/50 text-emerald-300 text-sm">{message}</div>}
          {error && <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-300 text-sm">{error}</div>}
          <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 disabled:opacity-50 rounded-xl font-bold shadow-lg shadow-rose-900/25">
            {loading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
          </button>
          <div className="flex items-center justify-between text-sm">
            <Link href="/login" className="text-blue-300 hover:text-blue-200 underline">Quay lại đăng nhập</Link>
            <Link href="/" className="text-slate-300 hover:text-white underline">Trang chủ</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
