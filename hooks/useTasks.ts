import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DocItem, TaskRow, SubTarget } from '@/types';
import { toast } from 'sonner';

export function normalizeTasks(data: TaskRow[]): DocItem[] {
  return data.map((item) => {
    let subTargets: SubTarget[] = [];
    if (item.sub_targets) {
      try {
        const parsed = typeof item.sub_targets === "string" ? JSON.parse(item.sub_targets) : item.sub_targets;
        subTargets = Array.isArray(parsed)
          ? parsed.map((target, index) => ({
              id: String(target.id ?? `st-${String(item.id ?? index)}-${index}`),
              name: String(target.name ?? ""),
              percent: Math.max(0, Math.min(100, Number(target.percent) || 0)),
              deadline: target.deadline,
              bottleneck_reason: target.bottleneck_reason,
              proposed_solution: target.proposed_solution,
              assignee: target.assignee,
            }))
          : [];
      } catch {
        subTargets = [];
      }
    }
    if (subTargets.length === 0 && item.target_name) {
      subTargets = [{
        id: "st-default",
        name: item.target_name,
        percent: Math.max(0, Math.min(100, Number(item.target_percent) || 0)),
        deadline: item.deadline || "2026-12-31",
      }];
    }

    const completedPercent = subTargets.length
      ? Math.round((subTargets.filter((target) => target.percent === 100).length / subTargets.length) * 100)
      : 0;
    const level = item.level === "Thành ủy" || item.level === "Phường" || item.level === "Trung ương"
      ? item.level
      : "Trung ương";
    const status = item.status || (completedPercent === 100
      ? "Hoàn thành"
      : completedPercent > 0 ? "Đang thực hiện" : "Chưa thực hiện");
    const rawTitle = item.title || "Không có tên văn bản";
    const titleParts = rawTitle.split(":");

    return {
      id: item.id ?? "",
      doc_number: item.doc_number || (titleParts.length > 1 ? titleParts.shift()!.trim() : `VB-${String(item.id ?? "")}`),
      title: titleParts.length > 0 ? titleParts.join(":").trim() : rawTitle,
      issue_date: item.issue_date || item.deadline || "2026-01-01",
      issuer: item.issuer || (level === "Trung ương"
        ? "Ban Chấp hành Trung ương"
        : level === "Thành ủy" ? "Ban Thường vụ Thành ủy" : "Đảng ủy phường"),
      level,
      file_url: item.file_url || undefined,
      doc_url: item.doc_url || undefined,
      file_name: item.file_name || undefined,
      is_concretized: item.is_concretized ?? (status === "Hoàn thành" || level === "Phường"),
      concretized_by: item.concretized_by || undefined,
      assignee: item.assignee || "Văn phòng Đảng ủy",
      sub_targets: subTargets,
      target_name: item.target_name || undefined,
      target_percent: level === "Phường" ? completedPercent : (item.is_concretized ? 100 : 0),
      status,
    };
  });
}

export function useTasks() {
  const queryClient = useQueryClient();
  const [statusNotice, setStatusNotice] = useState<string>("");
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "live" | "off">(() => (isSupabaseConfigured && supabase ? "connecting" : "off"));
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  const { data: rawDocs, isLoading, error: queryError, isFetched } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return [] as TaskRow[];
      }
      const { data, error } = await supabase.from('tasks').select('*').order("id", { ascending: false });
      if (error) throw error;
      return data as TaskRow[];
    },
  });

  const docs = useMemo(() => normalizeTasks(rawDocs || []), [rawDocs]);

  useEffect(() => {
    if (queryError) {
      setStatusNotice(`Lỗi kết nối: ${(queryError as Error).message}`);
      setRealtimeStatus("off");
    } else if (isFetched) {
      setLastSyncTime(new Date().toLocaleTimeString());
      if (isSupabaseConfigured) setRealtimeStatus("live");
    }
  }, [queryError, isFetched]);

  useEffect(() => {
    const client = supabase;
    if (isSupabaseConfigured && client) {
      const channel = client
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        })
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, [queryClient]);

  const refreshDocs = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    toast.success("Đã cập nhật dữ liệu mới nhất");
  }, [queryClient]);

  return {
    docs,
    loading: isLoading,
    statusNotice,
    setStatusNotice,
    realtimeStatus,
    lastSyncTime,
    isFetched,
    refreshDocs,
    queryError,
  };
}
