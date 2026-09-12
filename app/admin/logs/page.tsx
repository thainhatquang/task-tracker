"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  old_value: any;
  new_value: any;
  user_id: string;
  changed_at: string;
}

export default function AuditLogsPage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const verifyAdmin = async () => {
      if (!supabase) {
        router.replace("/login");
        return;
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data: byId, error: byIdError } = await supabase
        .from("app_users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      let profile = byId;
      if (byIdError || !profile) {
        const { data: byEmail } = await supabase
          .from("app_users")
          .select("role")
          .ilike("auth_email", user.email || "")
          .maybeSingle();
        profile = byEmail;
      }

      if (cancelled) return;
      if (profile?.role !== "admin") {
        router.replace("/unauthorized");
        return;
      }
      setAuthorized(true);
      setAuthReady(true);
    };

    void verifyAdmin();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit_logs"],
    enabled: authReady && authorized,
    queryFn: async () => {
      if (!supabase) throw new Error("Supabase chưa được cấu hình.");
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("changed_at", { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
  });

  const handleExportLogs = () => {
    if (!logs) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Thời gian,Người thực hiện,Hành động,Bảng,ID Bản ghi,Giá trị cũ,Giá trị mới\\n"
      + logs.map(log => 
        `"${log.changed_at}","${log.app_users?.full_name || log.user_id}","${log.action}","${log.table_name}","${log.record_id}","${JSON.stringify(log.old_value)}","${JSON.stringify(log.new_value)}"`
      ).join("\\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất lịch sử thay đổi ra file CSV");
  };

  if (!authReady || !authorized || isLoading) return (
    <div className="min-h-screen bg-slate-900 text-white p-8 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="app-shell min-h-screen text-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-xs font-bold mb-3">● Khu vực quản trị</div>
            <h1 className="text-3xl font-black mb-2 tracking-tight text-slate-950">Nhật ký hệ thống</h1>
            <p className="text-slate-500">Theo dõi chi tiết mọi thay đổi dữ liệu trong hệ thống</p>
          </div>
          <button 
            onClick={handleExportLogs}
            className="palette-primary-button px-4 py-2.5 rounded-xl font-bold transition shadow-lg shadow-teal-900/15"
          >
            Xuất CSV
          </button>
        </div>

        <div className="modern-surface overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-700/50 text-slate-300 text-sm uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Người thực hiện</th>
                <th className="px-6 py-4">Hành động</th>
                <th className="px-6 py-4">Bảng</th>
                <th className="px-6 py-4">Chi tiết thay đổi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {logs && logs.length > 0 ? (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-700/30 transition">
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(log.changed_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {log.user_id || "Hệ thống"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        log.action === 'INSERT' ? 'bg-green-900/30 text-green-400 border border-green-500/50' :
                        log.action === 'UPDATE' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/50' :
                        'bg-red-900/30 text-red-400 border border-red-500/50'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {log.table_name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {log.old_value && (
                          <div className="text-xs text-slate-500 line-through">
                            {JSON.stringify(log.old_value)}
                          </div>
                        )}
                        {log.new_value && (
                          <div className="text-xs text-slate-200 font-medium">
                            {JSON.stringify(log.new_value)}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Chưa có dữ liệu nhật ký thay đổi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
