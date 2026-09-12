import React from 'react';
import { DocItem, SubTarget } from '@/types';
import { PlanDonutChart } from '@/components/PlanDonutChart';

interface TargetItem {
  planDoc: DocItem;
  target: SubTarget;
}

interface TargetTableProps {
  uncompletedTargets: TargetItem[];
}

export const TargetTable = ({ uncompletedTargets }: TargetTableProps) => {
  return (
    <div className="modern-surface border-rose-200/70 p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-rose-100 pb-3">
        <div>
          <h2 className="text-xs md:text-sm font-bold text-rose-900 flex items-center gap-2">
            <span className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs font-black">3</span>
            Điểm nghẽn chỉ tiêu văn bản Đảng ủy phường
          </h2>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Danh mục chỉ tiêu chưa đạt 100%, phân tích nguyên nhân và giải pháp tháo gỡ
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg self-start sm:self-auto">
          {uncompletedTargets.length} chỉ tiêu cần đôn đốc
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[750px]">
          <thead className="bg-rose-50/50 text-slate-600 font-bold border-b border-rose-200">
            <tr>
              <th className="p-2.5 md:p-3 w-32">Số văn bản</th>
              <th className="p-2.5 md:p-3 w-64">Tên chỉ tiêu và thời hạn</th>
              <th className="p-2.5 md:p-3 w-36">Đơn vị chủ trì</th>
              <th className="p-2.5 md:p-3 w-32">Tiến độ (Gap)</th>
              <th className="p-2.5 md:p-3">Nguyên nhân điểm nghẽn</th>
              <th className="p-2.5 md:p-3">Kiến nghị / Giải pháp tháo gỡ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {uncompletedTargets.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-emerald-600 font-bold text-sm">
                  ✓ 100% các chỉ tiêu theo văn bản của Đảng ủy phường đã hoàn thành!
                </td>
              </tr>
            ) : (
              uncompletedTargets.map(({ planDoc, target }) => {
                const gap = 100 - target.percent;
                return (
                  <tr key={planDoc.id + "-" + target.id} className="hover:bg-rose-50/30 transition">
                    <td className="p-2.5 md:p-3 font-bold text-slate-900 whitespace-nowrap">
                      <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-800">
                        {planDoc.doc_number}
                      </span>
                    </td>
                    <td className="p-2.5 md:p-3">
                      <div className="font-bold text-slate-900 leading-snug">🎯 {target.name}</div>
                      <div className="text-[10px] text-slate-500 mt-1">Hạn chót: <strong>{target.deadline || "2026-12-31"}</strong></div>
                    </td>
                    <td className="p-2.5 md:p-3 font-semibold text-slate-700">
                      {target.assignee || planDoc.assignee}
                    </td>
                    <td className="p-2.5 md:p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-800">{target.percent}%</span>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded border border-rose-200">
                          (-{gap}%)
                        </span>
                      </div>
                      <div className="w-20 md:w-24 mx-auto bg-slate-200 rounded-full h-1.5 mt-1">
                        <div
                          className={"h-full rounded-full " + (target.percent >= 70 ? "bg-amber-500" : "bg-rose-500")}
                          style={{ width: target.percent + "%" }}
                        />
                      </div>
                    </td>
                    <td className="p-2.5 md:p-3 text-slate-700 leading-relaxed text-[11px] bg-rose-50/20 font-medium">
                      {target.bottleneck_reason || "Đang trong lộ trình thực hiện"}
                    </td>
                    <td className="p-2.5 md:p-3 text-blue-900 leading-relaxed text-[11px] bg-blue-50/20 font-semibold">
                      {target.proposed_solution || "Đôn đốc các bộ phận liên quan"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
