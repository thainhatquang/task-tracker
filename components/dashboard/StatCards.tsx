import React from 'react';
import { DocItem, SubTarget } from '@/types';

interface StatCardsProps {
  totalDocs: number;
  twCount: number;
  tuCount: number;
  phuongCount: number;
  allSubTargetsCount: number;
  institutionalBottlenecksCount: number;
  uncompletedTargetsCount: number;
}

export const StatCards = ({
  totalDocs,
  twCount,
  tuCount,
  phuongCount,
  allSubTargetsCount,
  institutionalBottlenecksCount,
  uncompletedTargetsCount
}: StatCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      <div className="relative overflow-hidden bg-slate-950 p-5 md:p-6 rounded-3xl text-white shadow-xl shadow-slate-900/10">
        <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-blue-500/20 blur-2xl" />
        <div className="relative text-[10px] font-bold text-slate-300 uppercase tracking-[0.14em]">Tổng văn bản</div>
        <div className="relative text-3xl md:text-4xl font-black mt-2">{totalDocs}</div>
        <div className="relative text-[10px] md:text-xs text-slate-400 font-medium mt-1">TW {twCount} · TU {tuCount} · Phường {phuongCount}</div>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50/70 p-5 md:p-6 rounded-3xl border border-blue-100 shadow-lg shadow-blue-900/5">
        <div className="text-[10px] font-bold text-blue-700 uppercase tracking-[0.14em]">Văn bản Đảng ủy</div>
        <div className="text-3xl md:text-4xl font-black text-blue-700 mt-2">{phuongCount}</div>
        <div className="text-[10px] md:text-xs text-blue-600 font-medium mt-1">{allSubTargetsCount} chỉ tiêu thành phần</div>
      </div>

      <div className={`relative overflow-hidden p-5 md:p-6 rounded-3xl border shadow-lg ${
        institutionalBottlenecksCount > 0 
          ? "bg-gradient-to-br from-amber-50/80 to-yellow-50/50 border-amber-300" 
          : "bg-white border-slate-200"
      }`}>
        <div className="text-[10px] font-bold text-amber-800 uppercase tracking-[0.14em]">Điểm nghẽn thể chế</div>
        <div className="text-3xl md:text-4xl font-black text-amber-700 mt-2">{institutionalBottlenecksCount}</div>
        <div className="text-[10px] md:text-xs text-amber-700 font-medium mt-1">Văn bản TW/TU chưa có kế hoạch</div>
      </div>

      <div className={`relative overflow-hidden p-5 md:p-6 rounded-3xl border shadow-lg ${
        uncompletedTargetsCount > 0 
          ? "bg-gradient-to-br from-rose-50/80 to-pink-50/50 border-rose-300" 
          : "bg-white border-slate-200"
      }`}>
        <div className="text-[10px] font-bold text-rose-800 uppercase tracking-[0.14em]">Điểm nghẽn chỉ tiêu</div>
        <div className="text-3xl md:text-4xl font-black text-rose-700 mt-2">{uncompletedTargetsCount}</div>
        <div className="text-[10px] md:text-xs text-rose-700 font-medium mt-1">Chỉ tiêu chưa đạt 100%</div>
      </div>
    </div>
  );
};
