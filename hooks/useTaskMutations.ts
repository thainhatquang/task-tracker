import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { DocItem, DocLevel, DocStatus, SubTarget } from "@/types";

export interface CreateDocumentInput {
  canEdit: boolean;
  docNumber: string;
  title: string;
  issueDate: string;
  issuer: string;
  level: DocLevel;
  assignee: string;
  docUrl: string;
  file: File | null;
  isConcretized: boolean;
  concretizedBy: string;
  subTargets: {
    name: string;
    percent: number;
    deadline?: string;
    bottleneck_reason?: string;
    proposed_solution?: string;
  }[];
}

interface TaskMutationOptions {
  docs: DocItem[];
  setDocs: Dispatch<SetStateAction<DocItem[]>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setLastSyncTime: Dispatch<SetStateAction<string>>;
  setFormSuccessMsg: Dispatch<SetStateAction<string>>;
  setSelectedPlanId?: Dispatch<SetStateAction<string>>;
  reload: () => Promise<void>;
}

const syncTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

const taskPayload = (doc: DocItem): Record<string, string | number | boolean | null> => ({
  title: `${doc.doc_number}: ${doc.title}`,
  level: doc.level,
  deadline: doc.issue_date,
  assignee: doc.assignee || "Văn phòng Đảng ủy",
  status: doc.status,
  doc_number: doc.doc_number,
  issuer: doc.issuer,
  file_url: doc.file_url || null,
  doc_url: doc.doc_url || null,
  file_name: doc.file_name || null,
  is_concretized: doc.is_concretized,
  concretized_by: doc.concretized_by || null,
  target_name: doc.target_name || null,
  target_percent: doc.target_percent,
  sub_targets: JSON.stringify(doc.sub_targets || []),
});

const documentUpdatePayload = (doc: DocItem): Record<string, string | number | boolean | null> => ({
  title: `${doc.doc_number}: ${doc.title}`,
  level: doc.level,
  deadline: doc.issue_date,
  assignee: doc.assignee || "Văn phòng Đảng ủy",
  status: doc.status,
  doc_number: doc.doc_number,
  issuer: doc.issuer,
  file_url: doc.file_url || null,
  doc_url: doc.doc_url || null,
  file_name: doc.file_name || null,
  is_concretized: doc.is_concretized,
  concretized_by: doc.concretized_by || null,
});

export function calcPlanCompletedPercent(subTargets: SubTarget[]): number {
  if (!subTargets.length) return 0;
  return Math.round((subTargets.filter((target) => target.percent === 100).length / subTargets.length) * 100);
}

export function useTaskMutations({
  docs,
  setDocs,
  setLoading,
  setLastSyncTime,
  setFormSuccessMsg,
  setSelectedPlanId,
  reload,
}: TaskMutationOptions) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    if (!isSupabaseConfigured || !supabase) return URL.createObjectURL(file);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `documents/${fileName}`;
      const { error } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });
      if (error) {
        console.warn("Lỗi upload Supabase Storage:", error.message);
        return URL.createObjectURL(file);
      }
      const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(filePath);
      return publicUrl || URL.createObjectURL(file);
    } catch (error) {
      console.warn("Lỗi lưu trữ Storage:", error);
      return URL.createObjectURL(file);
    }
  }, []);

  const createDocument = useCallback(async (input: CreateDocumentInput): Promise<DocItem | null> => {
    if (!input.canEdit) {
      alert("Đồng chí cần đăng nhập với quyền cán bộ nhập liệu hoặc quản trị viên.");
      return null;
    }
    if (!input.docNumber.trim() || !input.title.trim()) {
      alert("Vui lòng nhập đầy đủ số văn bản và trích yếu nội dung.");
      return null;
    }

    setIsUploading(true);
    let uploadedFileUrl = "";
    let uploadedFileName = "";
    if (input.file) {
      uploadedFileName = input.file.name;
      uploadedFileUrl = await uploadFile(input.file);
    }

    const validSubTargets: SubTarget[] = input.subTargets
      .filter((target) => target.name.trim() !== "")
      .map((target, index) => {
        const percent = Math.min(100, Math.max(0, Number(target.percent) || 0));
        return {
          id: `st-${Date.now()}-${index}`,
          name: target.name.trim(),
          percent,
          deadline: target.deadline || "2026-12-31",
          bottleneck_reason: target.bottleneck_reason || (percent < 100 ? "Đang trong lộ trình thực hiện" : "Đã hoàn thành"),
          proposed_solution: target.proposed_solution || "Tiếp tục đôn đốc theo tiến độ",
          assignee: input.assignee.trim() || "Văn phòng Đảng ủy",
        };
      });
    const completedPercent = calcPlanCompletedPercent(validSubTargets);
    const newDoc: DocItem = {
      id: Date.now().toString(),
      doc_number: input.docNumber.trim(),
      title: input.title.trim(),
      issue_date: input.issueDate || new Date().toISOString().slice(0, 10),
      issuer: input.issuer.trim() || (input.level === "Trung ương"
        ? "Ban Chấp hành Trung ương"
        : input.level === "Thành ủy" ? "Thành ủy Cần Thơ" : "Đảng ủy phường"),
      level: input.level,
      file_url: uploadedFileUrl || undefined,
      doc_url: input.docUrl.trim() || undefined,
      file_name: uploadedFileName || undefined,
      is_concretized: input.level === "Phường" ? true : input.isConcretized,
      concretized_by: input.level === "Phường" ? "" : input.concretizedBy.trim(),
      assignee: input.assignee.trim() || "Văn phòng Đảng ủy",
      sub_targets: input.level === "Phường" ? validSubTargets : undefined,
      target_name: validSubTargets.map((target) => target.name).join("; "),
      target_percent: input.level === "Phường" ? completedPercent : (input.isConcretized ? 100 : 0),
      status: input.level === "Phường"
        ? (completedPercent === 100 ? "Hoàn thành" : completedPercent > 0 ? "Đang thực hiện" : "Chưa thực hiện")
        : (input.isConcretized ? "Hoàn thành" : "Chưa thực hiện"),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from("tasks").insert([taskPayload(newDoc)]).select();
      if (error) {
        alert("⚠️ Lỗi Supabase không ghi được dữ liệu: " + error.message + "\nVui lòng chạy file SQL supabase_schema_fix.sql trong Supabase SQL Editor!");
      } else if (data && data.length > 0) {
        newDoc.id = data[0].id;
        alert(`✓ Đã lưu thành công văn bản ${newDoc.doc_number} lên Supabase! Mở trên điện thoại sẽ thấy ngay.`);
      }
    } else {
      alert("⚠️ Lưu ý: Chưa kết nối Supabase (thiếu biến môi trường NEXT_PUBLIC_SUPABASE_URL). Dữ liệu chỉ đang lưu tạm trên máy này!");
    }

    setDocs((current) => [newDoc, ...current]);
    setLastSyncTime(syncTime());
    setFormSuccessMsg(`Đã tiếp nhận thành công văn bản ${newDoc.doc_number}!`);
    window.setTimeout(() => setFormSuccessMsg(""), 4000);
    setIsUploading(false);
    return newDoc;
  }, [setDocs, setFormSuccessMsg, setLastSyncTime, uploadFile]);

  const updateDocument = useCallback(async (editingDoc: DocItem, file: File | null): Promise<DocItem> => {
    let fileUrl = editingDoc.file_url;
    let fileName = editingDoc.file_name;
    if (file) {
      setIsUploading(true);
      fileName = file.name;
      fileUrl = await uploadFile(file);
      setIsUploading(false);
    }
    const updatedDoc = { ...editingDoc, file_url: fileUrl, file_name: fileName };
    setDocs((current) => current.map((doc) => doc.id === updatedDoc.id ? updatedDoc : doc));

    if (isSupabaseConfigured && supabase) {
      const payload = documentUpdatePayload(updatedDoc);
      if (typeof updatedDoc.id === "number" || !isNaN(Number(updatedDoc.id))) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", Number(updatedDoc.id));
        if (error) alert("Lỗi cập nhật trên Supabase: " + error.message);
        else alert(`✓ Đã cập nhật văn bản ${updatedDoc.doc_number} lên Supabase thành công!`);
      } else {
        const { data, error } = await supabase.from("tasks").insert([payload]).select();
        if (!error && data && data.length > 0) {
          updatedDoc.id = data[0].id;
          alert(`✓ Đã lưu văn bản ${updatedDoc.doc_number} lên CSDL Supabase thành công!`);
        }
      }
    }
    setLastSyncTime(syncTime());
    return updatedDoc;
  }, [setDocs, setLastSyncTime, uploadFile]);

  const deleteDocument = useCallback(async (id: string | number, canAdmin: boolean) => {
    if (!canAdmin) {
      alert("Chỉ quản trị viên mới có quyền xóa văn bản.");
      return;
    }
    if (!confirm("Đồng chí có chắc chắn muốn xóa văn bản này khỏi hệ thống?")) return;
    setDocs((current) => current.filter((doc) => doc.id !== id));
    if (isSupabaseConfigured && supabase && (typeof id === "number" || !isNaN(Number(id)))) {
      const { error } = await supabase.from("tasks").delete().eq("id", Number(id));
      if (error) alert("Lỗi xóa trên Supabase: " + error.message);
    }
    setLastSyncTime(syncTime());
  }, [setDocs, setLastSyncTime]);

  const updatePlanTargets = useCallback(async (docId: string | number, newSubTargets: SubTarget[], canEdit: boolean) => {
    if (!canEdit) return;
    const targetDoc = docs.find((doc) => String(doc.id) === String(docId));
    if (!targetDoc) return;
    const completedPercent = calcPlanCompletedPercent(newSubTargets);
    const status: DocStatus = completedPercent === 100 ? "Hoàn thành" : completedPercent > 0 ? "Đang thực hiện" : "Chưa thực hiện";
    const updated = {
      ...targetDoc,
      sub_targets: newSubTargets,
      target_percent: completedPercent,
      target_name: newSubTargets.map((target) => target.name).join("; "),
      status,
    };
    setDocs((current) => current.map((doc) => String(doc.id) === String(docId) ? updated : doc));

    if (isSupabaseConfigured && supabase) {
      const payload = {
        sub_targets: JSON.stringify(newSubTargets),
        target_name: updated.target_name,
        target_percent: completedPercent,
        status,
      };
      if (typeof docId === "number" || !isNaN(Number(docId))) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", Number(docId));
        if (error) alert("Lỗi lưu chỉ tiêu lên Supabase: " + error.message);
        else {
          setFormSuccessMsg("✓ Đã lưu chỉ tiêu lên Supabase (Điện thoại sẽ thấy ngay)");
          window.setTimeout(() => setFormSuccessMsg(""), 3000);
        }
      } else {
        const { data, error } = await supabase.from("tasks").insert([{
          title: `${targetDoc.doc_number}: ${targetDoc.title}`,
          level: targetDoc.level,
          deadline: targetDoc.issue_date,
          assignee: targetDoc.assignee || "Văn phòng Đảng ủy",
          doc_number: targetDoc.doc_number,
          issuer: targetDoc.issuer,
          is_concretized: true,
          target_name: updated.target_name,
          target_percent: completedPercent,
          status,
          sub_targets: JSON.stringify(newSubTargets),
        }]).select();
        if (error) alert("Lỗi lưu chỉ tiêu lên Supabase: " + error.message);
        else if (data && data.length > 0) {
          updated.id = data[0].id;
          setSelectedPlanId?.(String(data[0].id));
          setDocs((current) => current.map((doc) => String(doc.id) === String(docId) ? updated : doc));
          alert("✓ Kế hoạch và các chỉ tiêu đã được lưu vĩnh viễn vào Supabase! Điện thoại mở ra sẽ thấy ngay.");
        }
      }
    } else {
      alert("⚠️ Chưa kết nối được Supabase (thiếu biến môi trường NEXT_PUBLIC_SUPABASE_URL). Chỉ tiêu chỉ lưu tạm trên máy này!");
    }
    setLastSyncTime(syncTime());
  }, [docs, setDocs, setFormSuccessMsg, setLastSyncTime, setSelectedPlanId]);

  const setDocumentConcretized = useCallback(async (id: string | number, canEdit: boolean) => {
    if (!canEdit) return;
    const input = prompt("Nhập số, ký hiệu văn bản của Đảng ủy phường cụ thể hóa:", "Kế hoạch số ...-KH/ĐU");
    if (input === null || !input.trim()) return;
    const concretizedBy = input.trim();
    setDocs((current) => current.map((doc) => doc.id === id ? { ...doc, is_concretized: true, concretized_by: concretizedBy } : doc));
    if (isSupabaseConfigured && supabase) {
      if (typeof id === "number" || !isNaN(Number(id))) {
        await supabase.from("tasks").update({ is_concretized: true, concretized_by: concretizedBy }).eq("id", Number(id));
      } else {
        const docItem = docs.find((doc) => doc.id === id);
        if (docItem) {
          await supabase.from("tasks").insert([{
            title: `${docItem.doc_number}: ${docItem.title}`,
            level: docItem.level,
            deadline: docItem.issue_date,
            doc_number: docItem.doc_number,
            issuer: docItem.issuer,
            is_concretized: true,
            concretized_by: concretizedBy,
          }]);
        }
      }
    }
    setLastSyncTime(syncTime());
  }, [docs, setDocs, setLastSyncTime]);

  return {
    isUploading,
    uploadFile,
    createDocument,
    updateDocument,
    deleteDocument,
    updatePlanTargets,
    setDocumentConcretized,
  };
}
