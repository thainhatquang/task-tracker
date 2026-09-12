"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-slate-700 rounded ${className}`}
      style={style}
    />
  );
}

export function SkeletonCard({ height = "100px" }: { height?: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 w-full">
      <Skeleton className="h-4 w-1/3 mb-4" />
      <Skeleton className="h-6 w-2/3 mb-2" />
      <Skeleton className="h-4 w-full" style={{ height: height }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
      <div className="grid grid-cols-5 gap-4 p-4 bg-slate-700/50 border-b border-slate-700">
        {[...Array(rows)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid grid-cols-5 gap-4 p-4 border-b border-slate-700/50 last:border-0">
          {[...Array(5)].map((_, j) => (
            <Skeleton key={j} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
