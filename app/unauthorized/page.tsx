"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="auth-shell min-h-screen flex items-center justify-center text-white p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-20 w-96 h-96 rounded-full bg-rose-600/20 blur-3xl" />
      <div className="auth-card relative max-w-md w-full rounded-[2rem] p-8 text-center">
        <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center text-4xl">🚫</div>
        <h1 className="text-3xl font-black mb-2">Truy cập bị từ chối</h1>
        <p className="text-slate-400 mb-8">
          Bạn không có quyền truy cập vào khu vực này. Vui lòng liên hệ quản trị viên để được cấp quyền.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="px-6 py-3.5 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-900/25"
        >
          Quay lại Đăng nhập
        </button>
      </div>
    </div>
  );
}
