import React from "react";
import Link from "next/link";
import VibeLogo from "@/components/VibeLogo";
import { DocItem, TabType, UserAccount } from "@/types";

export interface TrackerSidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  counts: { tw: number; tu: number; phuong: number };
  institutionalBottlenecksCount: number;
  uncompletedTargetsCount: number;
  currentUser: UserAccount | null;
  users: UserAccount[];
  canEdit: boolean;
  canAdmin: boolean;
  realtimeStatus: "connecting" | "live" | "off";
  isSupabaseConfigured: boolean;
  onClearSearch: () => void;
  onLoginRequired: () => void;
  onLogout: () => void;
}

export function TrackerSidebar({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  counts,
  institutionalBottlenecksCount,
  uncompletedTargetsCount,
  currentUser,
  users,
  canEdit,
  canAdmin,
  realtimeStatus,
  isSupabaseConfigured,
  onClearSearch,
  onLoginRequired,
  onLogout,
}: TrackerSidebarProps) {
  return (
      <aside className={`tracker-sidebar fixed inset-y-0 left-0 z-50 w-64 md:w-72 bg-[var(--palette-deep)] text-white backdrop-blur-xl border-r border-white/10 flex flex-col shrink-0 shadow-2xl shadow-slate-950/20 transition-transform duration-300 md:translate-x-0 md:static ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <VibeLogo />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="p-4 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.16em]">
          Theo dõi và điều hành
        </div>

        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => { setActiveTab("tong_quan"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === "tong_quan"
                ? "palette-sidebar-primary shadow-lg shadow-slate-950/20 border"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>📊</span>
              <span>Tổng quan tiến độ</span>
            </div>
            {(institutionalBottlenecksCount > 0 || uncompletedTargetsCount > 0) && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                {institutionalBottlenecksCount + uncompletedTargetsCount}
              </span>
            )}
          </button>

          <div className="pt-3 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Văn bản và nghị quyết
          </div>

          <button
            onClick={() => { setActiveTab("trung_uong"); onClearSearch(); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
              activeTab === "trung_uong"
                ? "palette-tab-active border font-semibold"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>🏛️</span>
              <span>Văn bản Trung ương</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.2 rounded font-bold bg-white/10 text-slate-300">
              {counts.tw}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab("thanh_uy"); onClearSearch(); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
              activeTab === "thanh_uy"
                ? "palette-tab-active border font-semibold"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>🏢</span>
              <span>Văn bản Thành ủy</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.2 rounded font-bold bg-white/10 text-slate-300">
              {counts.tu}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab("phuong"); onClearSearch(); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
              activeTab === "phuong"
                ? "palette-tab-active border font-semibold"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>🚩</span>
              <span>Văn bản Đảng ủy phường</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.2 rounded font-bold bg-white/10 text-slate-300">
              {counts.phuong}
            </span>
          </button>

          <div className="pt-4 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Khu vực nghiệp vụ</span>
            {!currentUser && <span className="text-[10px] text-amber-500 font-semibold">Khóa</span>}
          </div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (canEdit) setActiveTab("admin_docs");
              else onLoginRequired();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
              activeTab === "admin_docs"
                ? "palette-admin-active border font-bold"
                : canEdit
                ? "text-slate-300 hover:bg-white/10 hover:text-white"
                : "text-slate-600 hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>📝</span>
              <span>Tiếp nhận và quản lý văn bản</span>
            </div>
            {!canEdit && <span className="text-[10px]">🔒</span>}
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (canEdit) setActiveTab("admin_targets");
              else onLoginRequired();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
              activeTab === "admin_targets"
                ? "palette-admin-active border font-bold"
                : canEdit
                ? "text-slate-300 hover:bg-white/10 hover:text-white"
                : "text-slate-600 hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>🎯</span>
              <span>Thiết lập chỉ tiêu kế hoạch</span>
            </div>
            {!canEdit && <span className="text-[10px]">🔒</span>}
          </button>

          {canAdmin && (
            <>
              <button
                onClick={() => { setActiveTab("admin_users"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                  activeTab === "admin_users"
                    ? "palette-admin-active border font-bold"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span>👥</span>
                  <span>Quản lý người dùng</span>
                </div>
                <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold">
                  {users.length}
                </span>
              </button>
              <Link
                href="/admin/logs"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <span>🧾</span>
                <span>Nhật ký hệ thống</span>
              </Link>
            </>
          )}
        </nav>

        {currentUser && (
          <div className="p-3 border-t border-slate-100">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <span>🚪</span>
              <span>Đăng xuất ({currentUser.username})</span>
            </button>
          </div>
        )}

        <div className="p-3 border-t border-white/10 bg-white/[0.03] text-xs space-y-2">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              realtimeStatus === "live" ? "bg-emerald-500 animate-pulse" : 
              isSupabaseConfigured ? "bg-emerald-500" : "bg-amber-400"
            }`} />
            <span className="font-semibold text-slate-400 text-[11px]">
              {realtimeStatus === "live" ? "Đồng bộ thời gian thực" : 
               isSupabaseConfigured ? "Đám mây Supabase" : "Bộ nhớ cục bộ"}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-white/10 text-[11px] text-slate-500">
            <span className="w-5 h-5 rounded bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black text-[9px] flex items-center justify-center">
              TNQ
            </span>
            <span className="font-semibold text-slate-300">TNQ ® TM</span>
            <span className="text-[10px] text-slate-500 ml-auto">Bản quyền nội bộ</span>
          </div>
        </div>
      </aside>
  );
}
