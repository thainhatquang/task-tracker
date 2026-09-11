import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { query, docs } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chưa cấu hình GEMINI_API_KEY trong Environment Variables của Vercel." },
        { status: 500 }
      );
    }

    const docList = Array.isArray(docs) ? docs : [];
    
    // 1. Phân loại chuẩn xác dữ liệu
    const institutionalBottlenecks = docList.filter(
      (d: any) => (d.level === "Trung ương" || d.level === "Thành ủy") && !d.is_concretized
    );

    const wardPlans = docList.filter((d: any) => d.level === "Phường");
    const allTargets: any[] = [];
    wardPlans.forEach((p: any) => {
      const subList = Array.isArray(p.sub_targets) ? p.sub_targets : [];
      subList.forEach((st: any) => {
        allTargets.push({
          planNumber: p.doc_number,
          targetName: st.name,
          percent: st.percent,
          gap: 100 - (st.percent || 0),
          deadline: st.deadline || "2026-12-31",
          assignee: st.assignee || p.assignee || "Văn phòng Đảng ủy",
          reason: st.bottleneck_reason || "Đang thực hiện",
          solution: st.proposed_solution || "Đang đôn đốc"
        });
      });
    });

    const laggingTargets = allTargets.filter((t: any) => t.percent < 100);

    // 2. Huấn luyện System Prompt: Cực kỳ súc tích, đi thẳng vào câu trả lời, không dài dòng
    const systemPrompt = `BẠN LÀ TRỢ LÝ AI THAM MƯU CỦA ĐẢNG ỦY PHƯỜNG TRUNG NHỨT.
DỮ LIỆU SỐ THỜI GIAN THỰC CỦA ĐẢNG BỘ PHƯỜNG:
- Tổng số văn bản: ${docList.length} (TW: ${docList.filter((d:any)=>d.level==="Trung ương").length}, Thành ủy: ${docList.filter((d:any)=>d.level==="Thành ủy").length}, Phường: ${wardPlans.length}).
- Điểm nghẽn thể chế (${institutionalBottlenecks.length} văn bản TW/Thành ủy CHƯA ban hành Kế hoạch cụ thể hóa):
${institutionalBottlenecks.map((b:any, i:number) => `  ${i+1}. ${b.doc_number}: ${b.title} (${b.issuer}, ${b.issue_date})`).join("\n") || "  (Không có điểm nghẽn thể chế)"}
- Kế hoạch Đảng ủy phường:
${wardPlans.map((p:any) => `  • ${p.doc_number}: ${p.title} (Hoàn thành 100%: ${p.target_percent}%)`).join("\n")}
- Điểm nghẽn chỉ tiêu (${laggingTargets.length} chỉ tiêu chưa đạt 100%):
${laggingTargets.map((t:any, i:number) => `  ${i+1}. [${t.planNumber}] ${t.targetName}: Đạt ${t.percent}% (thiếu ${t.gap}%). Hạn chót: ${t.deadline}. Chủ trì: ${t.assignee}. Lý do: ${t.reason}. Giải pháp: ${t.solution}`).join("\n") || "  (100% chỉ tiêu đã hoàn thành)"}

NGUYÊN TẮC TRẢ LỜI BẮT BUỘC (HUẤN LUYỆN ĐẶC BIỆT):
1. TRẢ LỜI CỰC KỲ NGẮN GỌN, TẬP TRUNG, ĐI THẲNG VÀO VẤN ĐỀ.
2. TUYỆT ĐỐI KHÔNG chào hỏi rườm rà, KHÔNG mở bài / kết bài sáo rỗng (như "Kính thưa", "Tôi rất vui được giúp...").
3. Trả lời bằng các gạch đầu dòng ngắn, rõ ý, đầy đủ số liệu thực tế.
4. Chỉ dựa vào dữ liệu trên, không bịa đặt số liệu không có trong hồ sơ.`;

    // 3. Gọi Google Gemini 3.6 Flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nCÂU HỎI: "${query}"\n(Yêu cầu: Trả lời ngắn gọn, thẳng vào ý, không rườm rà)` }],
            },
          ],
          generationConfig: {
            temperature: 0.1, // Cực thấp để bám sát dữ liệu và cô đọng nhất
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Lỗi kết nối Gemini API: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    const replyText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Không có dữ liệu phù hợp với câu hỏi.";

    return NextResponse.json({ reply: replyText.trim() });
  } catch (error: any) {
    return NextResponse.json({ error: "Lỗi hệ thống máy chủ." }, { status: 500 });
  }
}

