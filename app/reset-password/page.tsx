"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setError("Supabase chưa được cấu hình.");
      return;
    }
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirmation) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!supabase) {
      setError("Supabase chưa được cấu hình.");
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage("Mật khẩu đã được cập nhật. Bạn sẽ được chuyển về trang chủ.");
    setTimeout(() => router.push("/"), 1200);
  };

  return (
    <div className="auth-shell min-h-screen flex items-center justify-center text-white p-4 relative overflow-hidden">
      <div className="absolute -bottom-40 -left-24 w-[30rem] h-[30rem] rounded-full bg-emerald-600/15 blur-3xl" />
      <div className="auth-card relative max-w-md w-full rounded-[2rem] p-7 md:p-9">
        <div className="mb-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-400 flex items-center justify-center text-2xl shadow-lg shadow-rose-900/30">✓</div>
        <h1 className="text-2xl font-black mb-2">Tạo mật khẩu mới</h1>
        <p className="text-slate-400 text-sm mb-6">Mật khẩu mới được lưu và mã hóa bởi Supabase Auth.</p>
        {!ready && !error && <p className="text-sm text-slate-300 mb-4">Đang xác thực liên kết đặt lại mật khẩu...</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type={showPassword ? "text" : "password"} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mật khẩu mới" className="auth-input w-full px-4 py-3 rounded-xl" />
          <input type={showPassword ? "text" : "password"} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Nhập lại mật khẩu mới" className="auth-input w-full px-4 py-3 rounded-xl" />
          <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="text-sm text-blue-300 hover:text-blue-200">
            {showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          </button>
          {message && <div className="p-3 rounded-lg bg-emerald-900/30 border border-emerald-500/50 text-emerald-300 text-sm">{message}</div>}
          {error && <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-300 text-sm">{error}</div>}
          <button type="submit" disabled={!ready} className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 disabled:opacity-50 rounded-xl font-bold shadow-lg shadow-rose-900/25">
            Cập nhật mật khẩu
          </button>
          <Link href="/" className="block text-center text-sm text-slate-300 hover:text-white underline">
            Trang chủ
          </Link>
        </form>
      </div>
    </div>
  );
}
