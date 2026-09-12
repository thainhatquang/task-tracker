import React from "react";
import { BottleneckTable } from "@/components/dashboard/BottleneckTable";
import { StatCards } from "@/components/dashboard/StatCards";
import { TargetTable } from "@/components/dashboard/TargetTable";
import { PlanDonutChart } from "@/components/PlanDonutChart";
import { DocItem, SubTarget, TabType } from "@/types";

interface TargetItem {
  planDoc: DocItem;
  target: SubTarget;
}

export interface TrackerDashboardProps {
  activeTab: TabType;
  docs: DocItem[];
  counts: { tw: number; tu: number; phuong: number };
  wardPlans: DocItem[];
  allSubTargets: TargetItem[];
  institutionalBottlenecks: DocItem[];
  uncompletedTargetList: TargetItem[];
  handleOpenDocument: (doc: DocItem) => void;
  onOpenPlan: (plan: DocItem) => void;
}

export function TrackerDashboard({
  activeTab,
  docs,
  counts,
  wardPlans,
  allSubTargets,
  institutionalBottlenecks,
  uncompletedTargetList,
  handleOpenDocument,
  onOpenPlan,
}: TrackerDashboardProps) {
  return (
    <>
{/* ======================= TAB 1: TỔNG QUAN TIẾN ĐỘ ======================= */}
{activeTab === "tong_quan" && (
  <div className="space-y-6">
    <StatCards
      totalDocs={docs.length}
      twCount={counts.tw}
      tuCount={counts.tu}
      phuongCount={counts.phuong}
      allSubTargetsCount={allSubTargets.length}
      institutionalBottlenecksCount={institutionalBottlenecks.length}
      uncompletedTargetsCount={uncompletedTargetList.length}
    />

    {/* KHỐI (1): TIẾN ĐỘ THỰC HIỆN VĂN BẢN ĐẢNG ỦY PHƯỜNG */}
    <div className="modern-surface p-4 md:p-6 space-y-5">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <h2 className="text-xs md:text-sm font-bold text-slate-900 flex items-center gap-2">
          <span className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">1</span>
          Tiến độ thực hiện văn bản Đảng ủy phường
        </h2>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Realtime
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {wardPlans.map(plan => {
          const subList = plan.sub_targets || [];
          const completedTargets = subList.filter(st => st.percent === 100);
          const uncompletedTargets = subList.filter(st => st.percent < 100);
          const planCompletedPercent = subList.length > 0 
            ? Math.round((completedTargets.length / subList.length) * 100) 
            : 0;

          return (
            <div
              key={plan.id}
              onClick={() => onOpenPlan(plan)}
              className="bg-gradient-to-br from-white to-blue-50/60 hover:from-blue-50/70 hover:to-indigo-50/60 p-4 md:p-5 rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex justify-between items-start gap-2 border-b border-slate-200/70 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-xs font-black bg-slate-900 text-white shadow-xs">
                    {plan.doc_number}
                  </span>
                  <span className="text-[10px] md:text-[11px] text-slate-500 font-medium">Ban hành: {plan.issue_date}</span>
                </div>
                <span className="text-[10px] md:text-[11px] font-bold text-blue-600 group-hover:underline flex items-center gap-0.5">
                  Chi tiết ›
                </span>
              </div>

              <div className="flex items-center gap-3 md:gap-5">
                <div className="transform group-hover:scale-105 transition-transform duration-300">
                  <PlanDonutChart percent={planCompletedPercent} size="lg" />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5 md:space-y-2">
                  <h3 className="font-bold text-xs md:text-sm text-slate-900 leading-snug line-clamp-2" title={plan.title}>
                    {plan.title}
                  </h3>

                  <div className="p-2 md:p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-[11px] md:text-xs">
                    <span className="font-bold text-emerald-800 flex items-center gap-1">
                      <span>✓</span> Hoàn thành (100%):
                    </span>
                    <span className="font-black text-emerald-700">
                      {completedTargets.length} / {subList.length} ({planCompletedPercent}%)
                    </span>
                  </div>

                  <div className="p-2 md:p-2.5 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between text-[11px] md:text-xs">
                    <span className="font-bold text-rose-800 flex items-center gap-1">
                      <span>⚠️</span> Chưa hoàn thành:
                    </span>
                    <span className="font-black text-rose-700">
                      {uncompletedTargets.length} / {subList.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 md:mt-4 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px] md:text-[11px] text-slate-500">
                <span>Đơn vị: <strong className="text-slate-800">{plan.assignee || "Văn phòng Đảng ủy"}</strong></span>
                <span className="font-bold text-blue-700">Đạt {planCompletedPercent}% chỉ tiêu 100%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <BottleneckTable docs={institutionalBottlenecks} handleOpenDocument={handleOpenDocument} />

    <TargetTable uncompletedTargets={uncompletedTargetList} />

  </div>
)}

{/* ======================= CÁC TAB DANH MỤC VĂN BẢN ======================= */}

    </>
  );
}
