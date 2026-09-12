import React from 'react';
import { DocItem } from '@/types';

interface BottleneckTableProps {
  docs: DocItem[];
  handleOpenDocument: (doc: DocItem) => void;
}

export const BottleneckTable = ({ docs, handleOpenDocument }: BottleneckTableProps) => {
  return (
    <div className="modern-surface border-amber-200/70 p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-amber-100 pb-3">
        <div>
          <h2 className="text-xs md:text-sm font-bold text-amber-900 flex items-center gap-2">
            <span className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black">2</span>
            Điểm nghẽn thể chế
          </h2>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Văn bản chỉ đạo cấp Trung ương và Thành ủy chưa được Đảng ủy phường ban hành văn bản cụ thể hóa
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg self-start sm:self-auto">
          {docs.length} văn bản cần tháo gỡ
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[600px]">
          <thead className="bg-amber-50/50 text-slate-600 font-bold border-b border-amber-200">
            <tr>
              <th className="p-2.5 md:p-3 w-24">Cấp</th>
              <th className="p-2.5 md:p-3 w-36">Số văn bản</th>
              <th className="p-2.5 md:p-3 w-36">Trích yếu nội dung văn bản</th>
              <th className="p-2.5 md:p-3 w-48">Cơ quan ban hành</th>
              <th className="p-2.5 md:p-3 w-28">Ngày ban hành</th>
              <th className="p-2.5 md:p-3 w-36 text-center">Tình trạng thể chế</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {docs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-emerald-600 font-bold">
                  ✓ 100% văn bản của Trung ương và Thành ủy đã được cụ thể hóa kịp thời!
                </td>
              </tr>
            ) : (
              docs.map(doc => (
                <tr key={doc.id} className="hover:bg-amber-50/30 transition">
                  <td className="p-2.5 md:p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      doc.level === "Trung ương" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {doc.level}
                    </span>
                  </td>
                  <td className="p-2.5 md:p-3 font-bold text-slate-900">{doc.doc_number}</td>
                  <td className="p-2.5 md:p-3 font-medium text-slate-800 leading-relaxed">
                    <span
                      onClick={() => handleOpenDocument(doc)}
                      className="cursor-pointer hover:text-blue-600 hover:underline flex items-center gap-1.5 font-semibold"
                      title="Mở văn bản"
                    >
                      {doc.file_url ? (
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold shrink-0 mt-0.5 border border-blue-200">
                          📎 Tệp
                        </span>
                      ) : doc.doc_url ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold shrink-0 mt-0.5 border border-emerald-200">
                          🔗 Link
                        </span>
                      ) : null}
                      <span className="group-hover:underline font-semibold leading-relaxed">
                        {doc.title}
                      </span>
                    </span>
                    {doc.concretized_by && (
                      <div className="text-[11px] text-emerald-700 font-bold mt-1">
                        ↳ Cụ thể hóa: {doc.concretized_by}
                      </div>
                    )}
                  </td>
                  <td className="p-2.5 md:p-3 text-slate-600 whitespace-nowrap font-medium">
                    {doc.issue_date}
                  </td>
                  <td className="p-2.5 md:p-3 text-slate-700 font-medium">
                    {doc.issuer}
                  </td>
                  <td className="p-2.5 md:p-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-block ${
                      doc.is_concretized
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}>
                      {doc.is_concretized ? "✓ Đã cụ thể hóa" : "Chưa cụ thể hóa"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
