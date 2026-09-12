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
    const { query, docs } = (await req.json()) as { query?: string; docs?: GeminiDoc[] };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chưa cấu hình GEMINI_API_KEY trong Environment Variables của Vercel." },
        { status: 500 }
      );
    }

    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";

    const docList = Array.isArray(docs) ? docs : [];

    const institutionalBottlenecks = docList.filter(
      (d) => (d.level === "Trung ương" || d.level === "Thành ủy") && !d.is_concretized
    );

    const wardPlans = docList.filter((d) => d.level === "Phường");
    const allTargets: Array<{
      planNumber: string;
      targetName: string;
      percent: number;
      gap: number;
      deadline: string;
      assignee: string;
      reason: string;
      solution: string;
    }> = [];

    wardPlans.forEach((p) => {
      const subList = Array.isArray(p.sub_targets) ? p.sub_targets : [];
      subList.forEach((st) => {
        allTargets.push({
          planNumber: p.doc_number || "",
          targetName: st.name || "",
          percent: Number(st.percent) || 0,
          gap: 100 - (Number(st.percent) || 0),
          deadline: st.deadline || "2026-12-31",
          assignee: st.assignee || p.assignee || "Văn phòng Đảng ủy",
          reason: st.bottleneck_reason || "Đang thực hiện",
          solution: st.proposed_solution || "Đang đôn đốc"
        });
      });
    });

    const laggingTargets = allTargets.filter((t) => t.percent < 100);

    const systemPrompt = `BẠN LÀ TRỢ LÝ AI THAM MƯU CỦA ĐẢNG ỦY PHƯỜNG TRUNG NHỨT.
DỮ LIỆU SỐ THỜI GIAN THỰC CỦA ĐẢNG BỘ PHƯỜNG:
- Tổng số văn bản: ${docList.length} (TW: ${docList.filter((d) => d.level === "Trung ương").length}, Thành ủy: ${docList.filter((d) => d.level === "Thành ủy").length}, Phường: ${wardPlans.length}).
- Điểm nghẽn thể chế (${institutionalBottlenecks.length} văn bản TW/Thành ủy CHƯA ban hành Kế hoạch cụ thể hóa):
${institutionalBottlenecks.map((b, i) => `  ${i + 1}. ${b.doc_number}: ${b.title} (${b.issuer}, ${b.issue_date})`).join("\n") || "  (Không có điểm nghẽn thể chế)"}
- Kế hoạch Đảng ủy phường:
${wardPlans.map((p) => `  • ${p.doc_number}: ${p.title} (Hoàn thành 100%: ${p.target_percent}%)`).join("\n")}
- Điểm nghẽn chỉ tiêu (${laggingTargets.length} chỉ tiêu chưa đạt 100%):
${laggingTargets.map((t, i) => `  ${i + 1}. [${t.planNumber}] ${t.targetName}: Đạt ${t.percent}% (thiếu ${t.gap}%). Hạn chót: ${t.deadline}. Chủ trì: ${t.assignee}. Lý do: ${t.reason}. Giải pháp: ${t.solution}`).join("\n") || "  (100% chỉ tiêu đã hoàn thành)"}

NGUYÊN TẮC TRẢ LỜI BẮT BUỘC (HUẤN LUYỆN ĐẶC BIỆT):
1. TRẢ LỜI CỰC KỲ NGẮN GỌN, TẬP TRUNG, ĐI THẲNG VÀO VẤN ĐỀ.
2. TUYỆT ĐỐI KHÔNG chào hỏi rườm rà, KHÔNG mở bài / kết bài sáo rỗng.
3. Trả lời bằng các gạch đầu dòng ngắn, rõ ý, đầy đủ số liệu thực tế.
4. Chỉ dựa vào dữ liệu trên, không bịa đặt số liệu không có trong hồ sơ.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nCÂU HỎI: "${String(query || "").replace(/"/g, '\\"')}"\n(Yêu cầu: Trả lời ngắn gọn, thẳng vào ý, không rườm rà)` }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Lỗi kết nối Gemini API: ${errText}` }, { status: response.status });
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không có dữ liệu phù hợp với câu hỏi.";

    return NextResponse.json({ reply: replyText.trim() });
  } catch (error) {
    console.error("Gemini route error", error);
    return NextResponse.json({ error: "Lỗi hệ thống máy chủ." }, { status: 500 });
  }
}

