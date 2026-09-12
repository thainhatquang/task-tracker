import React from "react";

export default function VibeLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#e63946] via-[#457b9d] to-[#a8dadc] p-0.5 shadow-lg shadow-[#e63946]/25 flex items-center justify-center shrink-0">
        <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="#e63946" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="#457b9d" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M12 6v6M9 9h6" stroke="#1d3557" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="15" r="2" fill="#a8dadc" />
          </svg>
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a8dadc] truncate">
          Đảng ủy phường Trung Nhứt
        </div>
        <div className="text-sm md:text-base font-black text-white tracking-tight truncate">
          Theo dõi nghị quyết
        </div>
      </div>
    </div>
  );
}
