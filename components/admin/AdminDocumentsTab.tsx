import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { DocItem, DocLevel } from "@/types";

export type AdminDocSubTab = "all" | DocLevel;

export interface AdminDocumentsTabProps {
  docs: DocItem[];
  counts: { tw: number; tu: number; phuong: number };
  adminDocSubTab: AdminDocSubTab;
  setAdminDocSubTab: Dispatch<SetStateAction<AdminDocSubTab>>;
  adminFilteredDocs: DocItem[];
  canEdit: boolean;
  canAdmin: boolean;
  isUploading: boolean;
  formSuccessMsg: string;
  formLevel: DocLevel;
  setFormLevel: Dispatch<SetStateAction<DocLevel>>;
  formDocNumber: string;
  setFormDocNumber: Dispatch<SetStateAction<string>>;
  formTitle: string;
  setFormTitle: Dispatch<SetStateAction<string>>;
  formIssueDate: string;
  setFormIssueDate: Dispatch<SetStateAction<string>>;
  formIssuer: string;
  setFormIssuer: Dispatch<SetStateAction<string>>;
  formAssignee: string;
  setFormAssignee: Dispatch<SetStateAction<string>>;
  formDocUrl: string;
  setFormDocUrl: Dispatch<SetStateAction<string>>;
  setFormFile: Dispatch<SetStateAction<File | null>>;
  formIsConcretized: boolean;
  setFormIsConcretized: Dispatch<SetStateAction<boolean>>;
  formConcretizedBy: string;
  setFormConcretizedBy: Dispatch<SetStateAction<string>>;
  handleFormLevelChange: (level: DocLevel) => void;
  handleCreateDoc: (event: FormEvent<HTMLFormElement>) => void;
  handleOpenDocument: (doc: DocItem) => void;
  handleSetConcretized: (id: string | number) => void;
  handleDeleteDoc: (id: string | number) => void;
  setEditingDoc: (doc: DocItem | null) => void;
}

export function AdminDocumentsTab({
  docs,
  counts,
  adminDocSubTab,
  setAdminDocSubTab,
  adminFilteredDocs,
  canEdit,
  canAdmin,
  isUploading,
  formSuccessMsg,
  formLevel,
  setFormLevel,
  formDocNumber,
  setFormDocNumber,
  formTitle,
  setFormTitle,
  formIssueDate,
  setFormIssueDate,
  formIssuer,
  setFormIssuer,
  formAssignee,
  setFormAssignee,
  formDocUrl,
  setFormDocUrl,
  setFormFile,
  formIsConcretized,
  setFormIsConcretized,
  formConcretizedBy,
  setFormConcretizedBy,
  handleFormLevelChange,
  handleCreateDoc,
  handleOpenDocument,
  handleSetConcretized,
  handleDeleteDoc,
  setEditingDoc,
}: AdminDocumentsTabProps) {
  return (
            <div className="space-y-6">
              <div className="modern-surface p-4 md:p-5">
                <h2 className="text-sm md:text-base font-bold text-slate-900">Tiếp nhận và quản lý văn bản</h2>
                <div className="text-xs text-slate-500 mt-0.5">Tiếp nhận, chỉnh sửa và quản lý lưu trữ các văn bản chỉ đạo của các cấp</div>
              </div>

              {formSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                  ✓ {formSuccessMsg}
                </div>
              )}

              {/* Form thêm mới văn bản */}
              <div className="modern-surface p-4 md:p-6 space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wide text-slate-800 border-b border-slate-100 pb-2">
                  Tiếp nhận văn bản mới
                </h3>

                <form onSubmit={handleCreateDoc} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Cấp văn bản:</label>
                      <select
                        value={formLevel}
                        onChange={(e) => handleFormLevelChange(e.target.value as DocLevel)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-semibold text-xs"
                      >
                        <option value="Trung ương">Cấp Trung ương</option>
                        <option value="Thành ủy">Cấp Thành ủy</option>
                        <option value="Phường">Đảng ủy phường</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Số văn bản <span className="text-rose-500">*</span>:</label>
                      <input
                        type="text"
                        required
                        placeholder="VD: 57-NQ/TW, 118-KH/TU..."
                        value={formDocNumber}
                        onChange={(e) => setFormDocNumber(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Ngày ban hành:</label>
                      <input
                        type="date"
                        value={formIssueDate}
                        onChange={(e) => setFormIssueDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Cơ quan ban hành:</label>
                      <input
                        type="text"
                        placeholder="VD: Ban Chấp hành Trung ương..."
                        value={formIssuer}
                        onChange={(e) => setFormIssuer(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Đơn vị chủ trì thực hiện (nếu là phường):</label>
                      <input
                        type="text"
                        placeholder="VD: Văn phòng Đảng ủy, Ban Xây dựng Đảng..."
                        value={formAssignee}
                        onChange={(e) => setFormAssignee(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        📎 Tải lên tệp văn bản (PDF, Word, bản quét):
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFormFile(e.target.files[0]);
                          }
                        }}
                        className="w-full border border-slate-300 rounded-xl p-2 bg-white text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        🔗 Hoặc dán đường dẫn liên kết trực tiếp (URL):
                      </label>
                      <input
                        type="url"
                        placeholder="https://tulieuvankien.dangcongsan.vn/..."
                        value={formDocUrl}
                        onChange={(e) => setFormDocUrl(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Trích yếu nội dung văn bản <span className="text-rose-500">*</span>:</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Ghi rõ trích yếu nội dung..."
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs leading-relaxed"
                    />
                  </div>

                  {formLevel !== "Phường" && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="formCheckConcretized"
                          checked={formIsConcretized}
                          onChange={(e) => setFormIsConcretized(e.target.checked)}
                          className="rounded text-amber-600"
                        />
                        <label htmlFor="formCheckConcretized" className="font-bold text-slate-800">
                          Đảng ủy phường đã ban hành văn bản cụ thể hóa?
                        </label>
                      </div>
                      {formIsConcretized && (
                        <input
                          type="text"
                          placeholder="Nhập số văn bản cụ thể hóa (VD: Kế hoạch số 21-KH/ĐU)..."
                          value={formConcretizedBy}
                          onChange={(e) => setFormConcretizedBy(e.target.value)}
                          className="w-full border border-amber-300 rounded-lg p-2 bg-white text-xs"
                        />
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="palette-primary-button px-5 py-2 md:px-6 md:py-2.5 rounded-xl font-bold shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isUploading ? "Đang tải lên..." : "+ Lưu văn bản vào hệ thống"}
                    </button>
                  </div>
                </form>
              </div>

              {/* BẢNG QUẢN LÝ VĂN BẢN VỚI 4 SUB-TAB */}
              <div className="modern-surface p-4 md:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-xs uppercase tracking-wide text-slate-800">
                    Danh mục văn bản đang quản lý ({adminFilteredDocs.length})
                  </h3>

                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setAdminDocSubTab("all")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        adminDocSubTab === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Tất cả ({docs.length})
                    </button>
                    <button
                      onClick={() => setAdminDocSubTab("Trung ương")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        adminDocSubTab === "Trung ương" ? "bg-white text-purple-700 shadow-xs" : "text-slate-600 hover:text-purple-700"
                      }`}
                    >
                      Trung ương ({counts.tw})
                    </button>
                    <button
                      onClick={() => setAdminDocSubTab("Thành ủy")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        adminDocSubTab === "Thành ủy" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-blue-700"
                      }`}
                    >
                      Thành ủy ({counts.tu})
                    </button>
                    <button
                      onClick={() => setAdminDocSubTab("Phường")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        adminDocSubTab === "Phường" ? "bg-white text-rose-700 shadow-xs" : "text-slate-600 hover:text-rose-700"
                      }`}
                    >
                      Văn bản Đảng ủy phường ({counts.phuong})
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                      <tr>
                        <th className="p-3 w-24">Cấp</th>
                        <th className="p-3 w-32">Số văn bản</th>
                        <th className="p-3">Trích yếu nội dung</th>
                        <th className="p-3 w-28 text-center">Tệp / Link</th>
                        <th className="p-3 w-36">Cụ thể hóa</th>
                        <th className="p-3 w-32 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminFilteredDocs.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/60">
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.level === "Trung ương" ? "bg-purple-100 text-purple-700" :
                              item.level === "Thành ủy" ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"
                            }`}>
                              {item.level}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-900">{item.doc_number}</td>
                          <td className="p-3 text-slate-800 max-w-md">
                            <span
                              onClick={() => handleOpenDocument(item)}
                              className="cursor-pointer hover:text-blue-600 hover:underline font-semibold"
                            >
                              {item.title}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {item.file_url ? (
                              <button
                                onClick={() => handleOpenDocument(item)}
                                className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px] hover:bg-blue-100 cursor-pointer border border-blue-200"
                              >
                                📎 Tệp
                              </button>
                            ) : item.doc_url ? (
                              <button
                                onClick={() => handleOpenDocument(item)}
                                className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-[10px] hover:bg-emerald-100 cursor-pointer border border-emerald-200"
                              >
                                🔗 Link
                              </button>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            {item.level !== "Phường" ? (
                              item.is_concretized ? (
                                <span className="text-emerald-700 font-bold text-[11px]">✓ {item.concretized_by || "Đã cụ thể hóa"}</span>
                              ) : (
                                <button
                                  onClick={() => handleSetConcretized(item.id)}
                                  className="text-blue-600 hover:underline font-bold text-[11px] cursor-pointer"
                                >
                                  + Gán văn bản
                                </button>
                              )
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="p-3 text-right space-x-2">
                            {canEdit && (
                              <button
                                onClick={() => {
                                  setEditingDoc(item);
                                  setFormFile(null);
                                }}
                                className="text-blue-600 hover:text-blue-800 font-bold text-xs cursor-pointer"
                              >
                                Sửa
                              </button>
                            )}
                            {canAdmin && (
                              <button
                                onClick={() => handleDeleteDoc(item.id)}
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
            </div>
  );
}
