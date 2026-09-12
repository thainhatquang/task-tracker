"use client";

import type { DocItem } from "@/types";

export interface PlanDetailModalProps {
  plan: DocItem | null;
  onClose: () => void;
}

export function PlanDetailModal({ plan, onClose }: PlanDetailModalProps) {
  if (!plan) return null;

  const subList = plan.sub_targets || [];
  const completedTargets = subList.filter(st => st.percent === 100);
  const uncompletedTargets = subList.filter(st => st.percent < 100);
  const planCompletedPercent = subList.length > 0
    ? Math.round((completedTargets.length / subList.length) * 100)
    : 0;

  return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-950/20 max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
              <div className="px-4 md:px-6 py-5 bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5 md:gap-3">
                  <span className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-xs font-black bg-white text-slate-900 shadow-xs">
                    {plan.doc_number}
                  </span>
                  <div>
                    <h3 className="font-bold text-xs md:text-sm leading-tight line-clamp-1">{plan.title}</h3>
                    <div className="text-[10px] md:text-[11px] text-blue-200 mt-0.5">Tỷ lệ hoàn thành 100%: <strong>{planCompletedPercent}%</strong> ({completedTargets.length}/{subList.length} chỉ tiêu)</div>
                  </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer text-lg font-bold ml-2">✕</button>
              </div>

              <div className="p-4 md:p-6 overflow-y-auto space-y-5 md:space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                    <h4 className="text-xs font-extrabold uppercase text-emerald-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
                      Nhóm chỉ tiêu đã hoàn thành (100%)
                    </h4>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {completedTargets.length} chỉ tiêu ({planCompletedPercent}%)
                    </span>
                  </div>

                  {completedTargets.length === 0 ? (
                    <div className="p-4 bg-slate-50 text-slate-400 text-center text-xs rounded-xl italic">
                      Chưa có chỉ tiêu nào đạt 100% hoàn thành.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {completedTargets.map((st, i) => (
                        <div key={st.id || i} className="p-3 md:p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                              ✓
                            </span>
                            <div>
                              <div className="font-bold text-xs text-slate-900 leading-snug">{st.name}</div>
                              <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Hoàn thành đúng hạn: {st.deadline || "2026"}</div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shrink-0">
                            100%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                    <h4 className="text-xs font-extrabold uppercase text-rose-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">⚠️</span>
                      Nhóm chỉ tiêu chưa hoàn thành (&lt; 100%)
                    </h4>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      {uncompletedTargets.length} chỉ tiêu
                    </span>
                  </div>

                  {uncompletedTargets.length === 0 ? (
                    <div className="p-4 bg-emerald-50 text-emerald-700 text-center text-xs rounded-xl font-bold">
                      ✓ 100% các chỉ tiêu của văn bản này đã hoàn thành!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {uncompletedTargets.map((st, i) => {
                        const gap = 100 - st.percent;
                        return (
                          <div key={st.id || i} className="p-3.5 md:p-4 bg-rose-50/40 border border-rose-200 rounded-2xl space-y-2.5">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="font-bold text-xs text-slate-900 leading-snug">🎯 {st.name}</span>
                                <div className="text-[10px] text-slate-500 mt-0.5">Hạn chót: <strong>{st.deadline || "2026-12-31"}</strong></div>
                              </div>
                              <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2.5 py-0.5 rounded-full shrink-0">
                                Còn thiếu {gap}%
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-slate-200 rounded-full h-2">
                                <div
                                  className={`h-full rounded-full ${
                                    st.percent >= 70 ? "bg-amber-500" : "bg-rose-500"
                                  }`}
                                  style={{ width: `${st.percent}%` }}
                                />
                              </div>
                              <span className="font-black text-xs text-slate-800 w-10 text-right">{st.percent}%</span>
                            </div>

                            {(st.bottleneck_reason || st.proposed_solution) && (
                              <div className="pt-2 border-t border-rose-200/60 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                                <div className="text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200/60">
                                  <strong className="text-slate-800 block text-[10px] uppercase">Nguyên nhân:</strong>
                                  {st.bottleneck_reason || "Đang phân tích"}
                                </div>
                                <div className="text-blue-900 bg-blue-50/60 p-2 rounded-lg border border-blue-200/60">
                                  <strong className="text-blue-900 block text-[10px] uppercase">Kiến nghị / Giải pháp:</strong>
                                  {st.proposed_solution || "Đang hoàn thiện"}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
  );
}
