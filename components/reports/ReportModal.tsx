"use client";

import type { DocItem, SubTarget } from "@/types";

interface ReportTargetEntry {
  planDoc: DocItem;
  target: SubTarget;
}

interface ReportCounts {
  tw: number;
  tu: number;
}

export interface ReportModalProps {
  isOpen: boolean;
  reportPeriod: string;
  onReportPeriodChange: (period: string) => void;
  isAiGenerating: boolean;
  onGenerateAi: () => void;
  onPrint: () => void;
  onClose: () => void;
  wardPlans: DocItem[];
  counts: ReportCounts;
  allSubTargets: ReportTargetEntry[];
  completedTargetList: ReportTargetEntry[];
  uncompletedTargetList: ReportTargetEntry[];
  institutionalBottlenecks: DocItem[];
  customAiSectionIV: string[] | null;
}

export function ReportModal({
  isOpen,
  reportPeriod,
  onReportPeriodChange,
  isAiGenerating,
  onGenerateAi,
  onPrint,
  onClose,
  wardPlans,
  counts,
  allSubTargets,
  completedTargetList,
  uncompletedTargetList,
  institutionalBottlenecks,
  customAiSectionIV,
}: ReportModalProps) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 md:p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-950/20 max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[94vh] flex flex-col">
            <div className="px-4 md:px-6 py-4 bg-gradient-to-r from-slate-950 via-rose-950 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-base">📄</span>
                <span className="font-bold text-xs md:text-sm">Báo cáo tình hình thực hiện kế hoạch và điểm nghẽn chỉ tiêu</span>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <select
                  value={reportPeriod}
                  onChange={(e) => onReportPeriodChange(e.target.value)}
                  className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2 py-1 text-[11px] md:text-xs font-semibold focus:outline-none"
                >
                  <option value="Định kỳ tháng 09/2026">Kỳ: Tháng 09/2026</option>
                  <option value="Sơ kết quý III/2026">Kỳ: Quý III/2026</option>
                  <option value="Đánh giá 9 tháng năm 2026">Kỳ: 9 tháng năm 2026</option>
                  <option value="Báo cáo chuyên đề">Báo cáo chuyên đề</option>
                </select>

                <button
                  onClick={onGenerateAi}
                  disabled={isAiGenerating}
                  className="palette-primary-button px-2.5 py-1 text-[11px] md:text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-50"
                  title="Tổng hợp kiến nghị dựa trên dữ liệu sống"
                >
                  <span>✨</span> {isAiGenerating ? "Đang tạo..." : "Tạo kiến nghị AI"}
                </button>

                <button
                  onClick={onPrint}
                  className="palette-coral-button px-3 py-1 text-[11px] md:text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <span>🖨️</span> In / PDF (1 trang chuẩn)
                </button>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white cursor-pointer text-base ml-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 md:p-8 overflow-y-auto bg-slate-50 font-['Times_New_Roman',_Times,_serif] text-slate-900 space-y-4 text-xs md:text-sm leading-relaxed">
              <div id="printable-party-report" className="bg-white p-6 md:p-8 rounded-xl shadow-xs border border-slate-200 space-y-4">
                <div className="text-center pb-2 border-b border-slate-200">
                  <div className="font-bold text-base md:text-lg uppercase">BÁO CÁO</div>
                  <div className="font-bold text-xs md:text-sm uppercase mt-0.5">
                    TÌNH HÌNH THỰC HIỆN CÁC VĂN BẢN, CHỈ TIÊU NGHỊ QUYẾT CỦA CẤP ỦY
                  </div>
                  <div className="text-xs italic font-sans mt-0.5 font-medium text-slate-600">
                    ({reportPeriod} - Trích xuất từ hệ thống quản trị và giám sát dữ liệu số Đảng bộ phường Trung Nhứt)
                  </div>
                </div>

                {/* Phần I */}
                <div className="space-y-1.5">
                  <div className="font-bold uppercase text-xs md:text-sm">
                    I. TÌNH HÌNH CHỈ ĐẠO VÀ TIẾN ĐỘ THỰC HIỆN CÁC VĂN BẢN CỦA ĐẢNG BỘ
                  </div>
                  <p className="text-justify indent-6">
                    Thực hiện Nghị quyết Đại hội đại biểu Đảng bộ phường Trung Nhứt và các văn bản chỉ đạo của cấp trên, Đảng ủy phường đã ban hành và tập trung chỉ đạo điều hành <strong>{wardPlans.length} văn bản trọng tâm</strong> với tổng số <strong>{allSubTargets.length} chỉ tiêu cụ thể</strong>.
                  </p>
                  <p className="text-justify indent-6">
                    Đến nay, toàn Đảng bộ đã có <strong>{completedTargetList.length}/{allSubTargets.length} chỉ tiêu hoàn thành 100%</strong> (đạt tỷ lệ <strong>{Math.round((completedTargetList.length / (allSubTargets.length || 1)) * 100)}%</strong>); còn <strong>{uncompletedTargetList.length} chỉ tiêu đang trong lộ trình thực hiện</strong>.
                  </p>
                  
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs my-1 font-sans">
                    <div className="font-bold text-slate-800 mb-1">Tiến độ chi tiết từng văn bản trọng tâm:</div>
                    <ul className="space-y-0.5">
                      {wardPlans.map(p => {
                        const sub = p.sub_targets || [];
                        const done = sub.filter(s => s.percent === 100).length;
                        const pct = sub.length > 0 ? Math.round((done / sub.length) * 100) : 0;
                        return (
                          <li key={p.id} className="flex justify-between border-b border-slate-200/60 pb-0.5">
                            <span>• <strong>{p.doc_number}</strong>: {p.title}</span>
                            <span className="font-bold text-blue-800">{done}/{sub.length} chỉ tiêu 100% ({pct}%)</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* Phần II: Điểm nghẽn thể chế */}
                <div className="space-y-1.5">
                  <div className="font-bold uppercase text-xs md:text-sm">
                    II. TÌNH HÌNH CỤ THỂ HÓA VĂN BẢN TRUNG ƯƠNG VÀ THÀNH ỦY (ĐIỂM NGHẼN THỂ CHẾ)
                  </div>
                  <p className="text-justify indent-6">
                    Tổng số văn bản chỉ đạo của Trung ương và Thành ủy Cần Thơ đang theo dõi là <strong>{counts.tw + counts.tu} văn bản</strong>.
                  </p>
                  {institutionalBottlenecks.length > 0 ? (
                    <div className="text-justify indent-6">
                      Đảng bộ phường hiện còn <strong>{institutionalBottlenecks.length} văn bản chưa ban hành văn bản cụ thể hóa (Điểm nghẽn thể chế)</strong> gồm:
                      <ul className="list-disc pl-8 space-y-0.5 text-rose-900 font-sans text-xs mt-1">
                        {institutionalBottlenecks.map(b => (
                          <li key={b.id}><strong>{b.doc_number}</strong>: {b.title} ({b.issuer}, ngày {b.issue_date}).</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-justify indent-6 text-emerald-800 italic">
                      100% các văn bản chỉ đạo của Trung ương và Thành ủy Cần Thơ đã được Đảng ủy phường cụ thể hóa kịp thời bằng các nghị quyết, kế hoạch hành động cụ thể.
                    </p>
                  )}
                </div>

                {/* Phần III: Điểm nghẽn chỉ tiêu */}
                <div className="space-y-1.5">
                  <div className="font-bold uppercase text-xs md:text-sm">
                    III. ĐIỂM NGHẼN CHỈ TIÊU VĂN BẢN ĐẢNG ỦY PHƯỜNG (KÈM NGUYÊN NHÂN & KIẾN NGHỊ THÁO GỠ)
                  </div>
                  <p className="text-justify indent-6">
                    Danh mục các chỉ tiêu chưa đạt 100%, phân tích nguyên nhân và phương hướng xử lý:
                  </p>

                  <table className="w-full border-collapse border border-black text-xs my-1">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-center">
                        <th className="border border-black p-1 w-7">STT</th>
                        <th className="border border-black p-1 w-20">Số văn bản</th>
                        <th className="border border-black p-1">Tên chỉ tiêu và thời hạn</th>
                        <th className="border border-black p-1 w-14">Tiến độ</th>
                        <th className="border border-black p-1">Nguyên nhân điểm nghẽn</th>
                        <th className="border border-black p-1">Kiến nghị / Giải pháp tháo gỡ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uncompletedTargetList.map(({ planDoc, target }, index) => (
                        <tr key={index}>
                          <td className="border border-black p-1 text-center">{index + 1}</td>
                          <td className="border border-black p-1 font-bold">{planDoc.doc_number}</td>
                          <td className="border border-black p-1">
                            <div className="font-semibold">{target.name}</div>
                            <div className="italic text-[10px] text-slate-600">Hạn: {target.deadline || "2026-12-31"} • Đơn vị: {target.assignee || planDoc.assignee}</div>
                          </td>
                          <td className="border border-black p-1 text-center font-bold text-red-700">{target.percent}%</td>
                          <td className="border border-black p-1">{target.bottleneck_reason || "Đang trong tiến trình giải quyết"}</td>
                          <td className="border border-black p-1 font-semibold text-blue-900">{target.proposed_solution || "Đôn đốc các bộ phận liên quan"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Phần IV: Đề xuất chỉ đạo */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="font-bold uppercase text-xs md:text-sm">
                      IV. NHIỆM VỤ TRỌNG TÂM VÀ ĐỀ XUẤT THƯỜNG TRỰC ĐẢNG ỦY CHỈ ĐẠO
                    </div>
                    <span className="text-[10px] text-purple-700 font-sans font-bold bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                      Tổng hợp AI Gemini
                    </span>
                  </div>

                  <ol className="list-decimal pl-7 space-y-1 text-justify">
                    {(customAiSectionIV || [
                      `Về xử lý điểm nghẽn thể chế: Giao Văn phòng Đảng ủy chủ trì, phối hợp các ban tham mưu khẩn trương xây dựng kế hoạch cụ thể hóa đối với ${institutionalBottlenecks.length} văn bản cấp trên còn tồn đọng (${institutionalBottlenecks.map(b => b.doc_number).join(", ")}), trình Thường trực Đảng ủy xem xét trước ngày 30 hàng tháng.`,
                      `Về tháo gỡ điểm nghẽn chỉ tiêu: Thường trực Đảng ủy chỉ đạo Ủy ban nhân dân phường và các chi bộ trực thuộc tập trung cao độ xử lý dứt điểm các vướng mắc tại Bảng III, trọng tâm là: bổ sung trang thiết bị phục vụ số hóa hồ sơ thủ tục hành chính (85%) và phối hợp với cơ quan cấp trên tối ưu băng thông đồng bộ cơ sở dữ liệu số (70%).`,
                      `Về công tác phát triển đảng và sinh hoạt chi bộ: Chỉ đạo Ban Xây dựng Đảng chủ động tạo nguồn phát triển đảng viên mới từ khối giáo viên và lực lượng dân quân tự vệ để sớm đạt chỉ tiêu 25 đảng viên mới (hiện đạt 68%); phối hợp chặt chẽ với Công an phường giải quyết dứt điểm vướng mắc hồ sơ đảng viên hưu trí để hoàn thành 100% việc số hóa hồ sơ dữ liệu đảng viên (hiện đạt 52%).`,
                      `Về công tác điều hành số: Tiếp tục duy trì và cập nhật dữ liệu hàng tuần trên Hệ thống theo dõi nghị quyết số của phường, bảo đảm mọi chỉ đạo của Thường trực và Ban Thường vụ Đảng ủy được đôn đốc, giám sát theo thời gian thực.`
                    ]).map((item, idx) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
  );
}
