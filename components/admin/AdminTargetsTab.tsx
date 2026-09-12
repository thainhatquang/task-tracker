import type { Dispatch, SetStateAction } from "react";
import { PlanDonutChart } from "@/components/PlanDonutChart";
import type { DocItem, SubTarget } from "@/types";

export interface AdminTargetsTabProps {
  wardPlans: DocItem[];
  selectedPlan: DocItem | null;
  selectedPlanId: string;
  setSelectedPlanId: Dispatch<SetStateAction<string>>;
  handleUpdateSelectedPlanTargets: (docId: string | number, targets: SubTarget[]) => void;
}

export function AdminTargetsTab({
  wardPlans,
  selectedPlan,
  selectedPlanId,
  setSelectedPlanId,
  handleUpdateSelectedPlanTargets,
}: AdminTargetsTabProps) {
  return (
            <div className="space-y-6">
              <div className="modern-surface p-4 md:p-5">
                <h2 className="text-sm md:text-base font-bold text-slate-900">Thiết lập chỉ tiêu kế hoạch Đảng ủy phường</h2>
                <div className="text-xs text-slate-500 mt-0.5">Cập nhật tiến độ %, thời hạn, nguyên nhân nghẽn và giải pháp tháo gỡ</div>
              </div>

              <div className="modern-surface p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="w-full md:w-auto">
                  <label className="font-bold text-slate-700 block mb-1 text-xs">Chọn văn bản/kế hoạch cần cấu hình chỉ tiêu:</label>
                  <select
                    value={selectedPlan ? String(selectedPlan.id) : ""}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-bold text-xs w-full md:w-96 cursor-pointer focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {wardPlans.map(p => (
                      <option key={String(p.id)} value={String(p.id)}>
                        {p.doc_number} - {p.title.slice(0, 45)}...
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPlan && (
                  <div className="flex items-center gap-4 bg-emerald-50 p-3 rounded-xl border border-emerald-200 w-full md:w-auto justify-center">
                    <PlanDonutChart percent={selectedPlan.target_percent} size="sm" />
                    <div>
                      <div className="text-xs font-bold text-emerald-950">Chỉ tiêu hoàn thành 100%:</div>
                      <div className="text-lg md:text-xl font-black text-emerald-700">{selectedPlan.target_percent}%</div>
                      <div className="text-[11px] text-emerald-600">{selectedPlan.sub_targets?.filter(s => s.percent === 100).length || 0} / {selectedPlan.sub_targets?.length || 0} chỉ tiêu</div>
                    </div>
                  </div>
                )}
              </div>

              {selectedPlan && (
                <div className="modern-surface p-4 md:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900">
                        Danh sách chỉ tiêu của: <span className="text-blue-700 font-black">{selectedPlan.doc_number}</span>
                      </h3>
                      <div className="text-xs text-slate-500 mt-0.5">{selectedPlan.title}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const curList = selectedPlan.sub_targets || [];
                        const newList: SubTarget[] = [
                          ...curList,
                          {
                            id: `st-${Date.now()}`,
                            name: "",
                            percent: 0,
                            deadline: "2026-12-31",
                            bottleneck_reason: "",
                            proposed_solution: "",
                            assignee: selectedPlan.assignee || "Văn phòng Đảng ủy"
                          }
                        ];
                        handleUpdateSelectedPlanTargets(selectedPlan.id, newList);
                      }}
                      className="palette-primary-button px-3.5 py-1.5 md:px-4 md:py-2 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
                    >
                      ＋ Thêm chỉ tiêu mới
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(selectedPlan.sub_targets || []).length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        Văn bản này chưa có chỉ tiêu thành phần nào. Hãy bấm <strong>&quot;＋ Thêm chỉ tiêu mới&quot;</strong> để bắt đầu.
                      </div>
                    ) : (
                      (selectedPlan.sub_targets || []).map((st, idx) => (
                        <div key={st.id || idx} className="p-3.5 md:p-4.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                placeholder="Tên chỉ tiêu cụ thể..."
                                value={st.name}
                                onChange={(e) => {
                                  const list = [...(selectedPlan.sub_targets || [])];
                                  list[idx].name = e.target.value;
                                  handleUpdateSelectedPlanTargets(selectedPlan.id, list);
                                }}
                                className="flex-1 border border-slate-300 rounded-xl p-2 bg-white text-xs font-bold"
                              />
                            </div>
                            <div className="flex items-center gap-2 ml-7 sm:ml-0">
                              <span className="text-[11px] text-slate-500 font-medium">Hạn chót:</span>
                              <input
                                type="date"
                                value={st.deadline || "2026-12-31"}
                                onChange={(e) => {
                                  const list = [...(selectedPlan.sub_targets || [])];
                                  list[idx].deadline = e.target.value;
                                  handleUpdateSelectedPlanTargets(selectedPlan.id, list);
                                }}
                                className="border border-slate-300 rounded-xl p-1.5 bg-white text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const list = (selectedPlan.sub_targets || []).filter((_, i) => i !== idx);
                                  handleUpdateSelectedPlanTargets(selectedPlan.id, list);
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer ml-auto"
                                title="Xóa chỉ tiêu này"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 md:gap-4 pl-7 sm:pl-9">
                            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Tiến độ:</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={st.percent}
                              onChange={(e) => {
                                const list = [...(selectedPlan.sub_targets || [])];
                                list[idx].percent = Number(e.target.value);
                                handleUpdateSelectedPlanTargets(selectedPlan.id, list);
                              }}
                              className="flex-1 accent-blue-600 cursor-pointer h-2"
                            />
                            <span className={`w-12 text-right font-black text-xs ${
                              st.percent === 100 ? "text-emerald-700" :
                              st.percent >= 70 ? "text-blue-700" :
                              st.percent >= 40 ? "text-amber-700" : "text-rose-700"
                            }`}>
                              {st.percent}%
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 pl-7 sm:pl-9 pt-1">
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-0.5">
                                Nguyên nhân điểm nghẽn (nếu chưa đạt 100%):
                              </label>
                              <input
                                type="text"
                                placeholder="Ghi rõ vướng mắc, khó khăn..."
                                value={st.bottleneck_reason || ""}
                                onChange={(e) => {
                                  const list = [...(selectedPlan.sub_targets || [])];
                                  list[idx].bottleneck_reason = e.target.value;
                                  handleUpdateSelectedPlanTargets(selectedPlan.id, list);
                                }}
                                className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-blue-900 uppercase block mb-0.5">
                                Kiến nghị / Giải pháp tháo gỡ:
                              </label>
                              <input
                                type="text"
                                placeholder="Đề xuất hướng xử lý..."
                                value={st.proposed_solution || ""}
                                onChange={(e) => {
                                  const list = [...(selectedPlan.sub_targets || [])];
                                  list[idx].proposed_solution = e.target.value;
                                  handleUpdateSelectedPlanTargets(selectedPlan.id, list);
                                }}
                                className="w-full border border-blue-200 rounded-lg p-2 bg-blue-50/40 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
  );
}
