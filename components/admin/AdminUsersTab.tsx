import type { UserAccount } from "@/types";

export interface AdminUsersTabProps {
  users: UserAccount[];
  currentUser: UserAccount | null;
  handleOpenUserModal: (user?: UserAccount) => void;
  handleDeleteUser: (id: string) => void;
}

export function AdminUsersTab({
  users,
  currentUser,
  handleOpenUserModal,
  handleDeleteUser,
}: AdminUsersTabProps) {
  return (
            <div className="space-y-6">
              <div className="modern-surface p-4 md:p-5 flex justify-between items-center">
                <div>
                  <h2 className="text-sm md:text-base font-bold text-slate-900">Quản lý người dùng và phân quyền</h2>
                  <div className="text-xs text-slate-500 mt-0.5">Thêm, sửa, xóa tài khoản và phân quyền truy cập hệ thống</div>
                </div>

                <button
                  onClick={() => handleOpenUserModal()}
                  className="palette-primary-button px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-teal-900/15 transition cursor-pointer flex items-center gap-1"
                >
                  <span>＋</span> Thêm người dùng
                </button>
              </div>

              <div className="modern-surface overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                    <tr>
                      <th className="p-3.5">Họ và tên cán bộ</th>
                      <th className="p-3.5">Email đăng nhập</th>
                      <th className="p-3.5">Vai trò</th>
                      <th className="p-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-black flex items-center justify-center text-xs">
                            {u.username.slice(0, 1).toUpperCase()}
                          </span>
                          {u.full_name}
                        </td>
                        <td className="p-3.5 font-mono text-slate-700 font-bold">{u.username}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            u.role === "admin" ? "bg-red-50 text-red-700 border border-red-200" :
                            u.role === "editor" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            "bg-slate-100 text-slate-700"
                          }`}>
                            {u.role === "admin" ? "👑 Quản trị viên" : u.role === "editor" ? "✍️ Nhập liệu" : "👁️ Chỉ xem"}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleOpenUserModal(u)}
                            className="text-blue-600 hover:text-blue-800 font-bold text-xs cursor-pointer"
                          >
                            Sửa
                          </button>
                          {currentUser?.id !== u.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-rose-600 hover:text-rose-800 font-bold text-xs cursor-pointer"
                            >
                              Xóa
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
  );
}
