import { NextResponse } from "next/server";

type DocLevel = "Trung ương" | "Thành ủy" | "Phường";

type GeminiDoc = {
  level?: DocLevel | string;
  title?: string;
  doc_number?: string;
  issuer?: string;
  issue_date?: string;
  is_concretized?: boolean;
  target_percent?: number;
  assignee?: string;
  sub_targets?: Array<{
    name?: string;
    percent?: number;
    deadline?: string;
    bottleneck_reason?: string;
    proposed_solution?: string;
    assignee?: string;
  }>;
};

export async function POST(req: Request) {
  try {
    const { period, docs } = (await req.json()) as { period?: string; docs?: GeminiDoc[] };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const docList = Array.isArray(docs) ? docs : [];

    // 1. Extract Insights for the prompt
    const institutionalBottlenecks = docList.filter(
      (d) => (d.level === "Trung ương" || d.level === "Thành ủy") && !d.is_concretized
    );

    const wardPlans = docList.filter((d) => d.level === "Phường");
    const laggingTargets = [];
    wardPlans.forEach(p => {
      (p.sub_targets || []).forEach(st => {
        if ((st.percent || 0) < 100) {
          laggingTargets.push({
            doc: p.doc_number,
            target: st.name,
            percent: st.percent,
            reason: st.bottleneck_reason
          });
        }
      });
    });

    const systemPrompt = `BẠN LÀ CHUYÊN GIA SOẠN THẢO VĂN BẢN HÀNH CHÍNH ĐẢNG.
NHIỆM VỤ: Viết báo cáo tổng hợp tiến độ thực hiện nghị quyết cho Đảng ủy phường Trung Nhứt.
KỲ BÁO CÁO: ${period || "Tháng hiện tại"}

DỮ LIỆU THỰC TẾ:
- Tổng số văn bản theo dõi: ${docList.length}
- Điểm nghẽn thể chế: ${institutionalBottlenecks.length} văn bản chưa cụ thể hóa.
- Điểm nghẽn chỉ tiêu: ${laggingTargets.length} chỉ tiêu chưa đạt 100%.

YÊU CẦU VỀ VĂN PHONG:
1. Sử dụng ngôn ngữ hành chính Đảng: "Kính gửi", "Quán triệt", "Triển khai", "Tháo gỡ", "Kiến nghị".
2. Cấu trúc báo cáo gồm 3 phần rõ ràng:
   I. Đánh giá chung (Ưu điểm, tồn tại).
   II. Chi tiết các điểm nghẽn (Thể chế & Chỉ tiêu).
   III. Giải pháp và Kiến nghị cụ thể.
3. Không dùng từ ngữ sáo rỗng, phải đi kèm số liệu cụ thể từ dữ liệu cung cấp.
4. Định dạng rõ ràng, sử dụng gạch đầu dòng.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n Hãy soạn thảo chi tiết báo cáo này dựa trên dữ liệu thực tế.` }]
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
        })
      }
    );

    if (!response.ok) throw new Error("Gemini API Error");

    const data = await response.json();
    const reportText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không thể tạo báo cáo.";

    return NextResponse.json({ report: reportText });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi tạo báo cáo." }, { status: 500 });
  }
}
