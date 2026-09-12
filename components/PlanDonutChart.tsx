import React from 'react';

interface PlanDonutChartProps {
  percent: number;
  size?: 'sm' | 'md' | 'lg';
}

export const PlanDonutChart = ({ percent, size = 'md' }: PlanDonutChartProps) => {
  const r = size === 'lg' ? 54 : size === 'sm' ? 28 : 38;
  const strokeW = size === 'lg' ? 12 : size === 'sm' ? 6 : 9;
  const dim = size === 'lg' ? 'w-28 h-28 md:w-34 md:h-34' : size === 'sm' ? 'w-14 h-14 md:w-16 md:h-16' : 'w-20 h-20 md:w-24 md:h-24';
  const fontSize = size === 'lg' ? 'text-2xl md:text-3xl font-black' : size === 'sm' ? 'text-xs font-bold' : 'text-base font-black';

  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;
  
  const strokeColor =
    clamped === 100 ? '#2a9d8f' :
    clamped >= 70 ? '#e9c46a' :
    clamped >= 40 ? '#f4a261' :
    '#e76f51';

  return (
    <div className={`relative ${dim} flex items-center justify-center shrink-0 drop-shadow-xs`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} fill="transparent" stroke="#eef2f3" strokeWidth={strokeW} />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`${fontSize} text-slate-800 tracking-tight font-sans`}>{clamped}%</span>
        {size === 'lg' && (
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Cán đích</span>
        )}
      </div>
    </div>
  );
};
