import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { UserAccount, UserRole } from "@/types";

export const defaultUsers: UserAccount[] = [
  { id: "u-1", username: "thainhatquang@gmail.com", auth_email: "thainhatquang@gmail.com", full_name: "Quản trị viên Đảng ủy", role: "admin" },
  { id: "u-2", username: "nhaplieu@trungnhut.com", auth_email: "nhaplieu@trungnhut.com", full_name: "Cán bộ nhập liệu Văn phòng", role: "editor" },
  { id: "u-3", username: "lanhdao@trungnhut.com", auth_email: "lanhdao@trungnhut.com", full_name: "Thường trực Đảng ủy", role: "viewer" },
];

export interface UserFormValues {
  username: string;
  fullName: string;
  role: UserRole;
}

interface UserManagementOptions {
  canAdmin: boolean;
  currentUser: UserAccount | null;
}

export function useUserManagement({ canAdmin, currentUser }: UserManagementOptions) {
  const [users, setUsers] = useState<UserAccount[]>(() => {
    if (typeof window === "undefined") return defaultUsers;
    try {
      const saved = localStorage.getItem("party_accounts_list_v21");
      if (!saved) return defaultUsers;
      const parsed = JSON.parse(saved) as UserAccount[];
      if (!Array.isArray(parsed) || parsed.length === 0) return defaultUsers;
      return parsed.map(({ id, username, auth_email, full_name, role, created_at }) => ({
        id,
        username,
        auth_email,
        full_name,
        role,
        created_at,
      }));
    } catch {
      return defaultUsers;
    }
  });
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userFormError, setUserFormError] = useState("");

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      void supabase.from("app_users").select("*").then(({ data, error }) => {
        if (!error && data && data.length > 0) setUsers(data as UserAccount[]);
      });
    }
  }, []);

  useEffect(() => {
    if (users.length > 0) localStorage.setItem("party_accounts_list_v21", JSON.stringify(users));
  }, [users]);

  const openUserModal = useCallback((user?: UserAccount) => {
    if (!canAdmin) {
      alert("Chỉ quản trị viên mới có quyền quản lý người dùng.");
      return;
    }
    setEditingUser(user || null);
    setUserFormError("");
    setIsUserModalOpen(true);
    return user
      ? { username: user.username, fullName: user.full_name, role: user.role }
      : { username: "", fullName: "", role: "editor" as UserRole };
  }, [canAdmin]);

  const saveUser = useCallback(async (values: UserFormValues): Promise<{ ok: boolean; error?: string }> => {
    if (!values.username.trim() || !values.fullName.trim()) {
      const error = "Vui lòng nhập đầy đủ tên đăng nhập và họ tên.";
      setUserFormError(error);
      return { ok: false, error };
    }
    const username = values.username.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
      const error = "Tên đăng nhập phải là một địa chỉ email hợp lệ.";
      setUserFormError(error);
      return { ok: false, error };
    }
    if (editingUser) {
      const updatedUser: UserAccount = {
        ...editingUser,
        username,
        auth_email: username,
        full_name: values.fullName.trim(),
        role: values.role,
      };
      setUsers((current) => current.map((user) => user.id === editingUser.id ? updatedUser : user));
      if (isSupabaseConfigured && supabase) await supabase.from("app_users").upsert([updatedUser]);
    } else {
      if (users.some((user) => user.username.toLowerCase() === username)) {
        const error = "Tên đăng nhập này đã tồn tại, vui lòng chọn tên khác.";
        setUserFormError(error);
        return { ok: false, error };
      }
      const newUser: UserAccount = {
        id: `u-${Date.now()}`,
        username,
        auth_email: username,
        full_name: values.fullName.trim(),
        role: values.role,
        created_at: new Date().toISOString().slice(0, 10),
      };
      setUsers((current) => [...current, newUser]);
      if (isSupabaseConfigured && supabase) await supabase.from("app_users").insert([newUser]);
    }
    setIsUserModalOpen(false);
    return { ok: true };
  }, [editingUser, users]);

  const deleteUser = useCallback(async (id: string) => {
    if (!canAdmin) return;
    if (currentUser?.id === id) {
      alert("Đồng chí không thể tự xóa tài khoản của chính mình đang đăng nhập.");
      return;
    }
    if (!confirm("Đồng chí có chắc chắn muốn xóa người dùng này?")) return;
    setUsers((current) => current.filter((user) => user.id !== id));
    if (isSupabaseConfigured && supabase) await supabase.from("app_users").delete().eq("id", id);
  }, [canAdmin, currentUser?.id]);

  return {
    users,
    defaultUsers,
    editingUser,
    isUserModalOpen,
    userFormError,
    setIsUserModalOpen,
    setUserFormError,
    openUserModal,
    saveUser,
    deleteUser,
  };
}
