export type TabType = "tong_quan" | "trung_uong" | "thanh_uy" | "phuong" | "admin_docs" | "admin_targets" | "admin_users";
export type UserRole = "viewer" | "editor" | "admin";
export type DocLevel = "Trung ương" | "Thành ủy" | "Phường";
export type DocStatus = "Chưa thực hiện" | "Đang thực hiện" | "Hoàn thành";

export interface SubTarget {
  id: string;
  name: string;
  percent: number;
  deadline?: string;
  bottleneck_reason?: string;
  proposed_solution?: string;
  assignee?: string;
}

export interface DocItem {
  id: string | number;
  doc_number: string;
  title: string;
  issue_date: string;
  issuer: string;
  level: DocLevel;
  file_url?: string;
  doc_url?: string;
  file_name?: string;
  is_concretized: boolean;
  concretized_by?: string;
  assignee?: string;
  sub_targets?: SubTarget[];
  target_name?: string;
  target_percent: number;
  status: DocStatus;
}

export interface UserAccount {
  id: string;
  username: string;
  auth_email?: string;
  full_name: string;
  role: UserRole;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "gemini";
  text: string;
  timestamp: string;
}

export interface TaskRow {
  id?: string | number;
  title?: string;
  doc_number?: string;
  issue_date?: string;
  deadline?: string;
  issuer?: string;
  level?: string;
  file_url?: string | null;
  doc_url?: string | null;
  file_name?: string | null;
  is_concretized?: boolean;
  concretized_by?: string | null;
  assignee?: string | null;
  sub_targets?: string | SubTarget[] | null;
  target_name?: string | null;
  target_percent?: number;
  status?: DocStatus;
}
