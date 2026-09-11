import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { query, docs } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chưa cấu hình GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    // 1. Chuẩn bị ngữ cảnh dữ liệu sống từ CSDL phường
    const contextSummary = JSON.stringify(docs || [], null, 2);

    // 2. Định hình System Prompt chuyên môn công tác Đảng
    const systemPrompt = `Bạn là Trợ lý AI Tham mưu cấp cao của Đảng ủy phường Trung Nhứt (thuộc Đảng bộ thành phố Cần Thơ), hỗ trợ Thường trực và Văn phòng Đảng ủy.
Nhiệm vụ của bạn là phân tích, tra cứu và trả lời các câu hỏi dựa trên CƠ SỞ DỮ LIỆU SỐ THỜI GIAN THỰC dưới đây:

--- DỮ LIỆU VĂN BẢN VÀ KẾ HOẠCH ĐẢNG BỘ PHƯỜNG ---
${contextSummary}
---------------------------------------------------

Yêu cầu phản hồi:
1. Nếu người dùng hỏi về số hiệu văn bản cụ thể (ví dụ: 57-NQ/TW, 21-KH/ĐU, 299-QĐ/TW): Trích xuất chính xác trích yếu, cấp ban hành, ngày ban hành và tình trạng cụ thể hóa của Đảng ủy phường.
2. Nếu người dùng hỏi về "điểm nghẽn thể chế": Rà soát các văn bản cấp Trung ương và Thành ủy có is_concretized = false, liệt kê rõ tên văn bản và kiến nghị thời hạn ban hành Kế hoạch cụ thể hóa.
3. Nếu người dùng hỏi về "chỉ tiêu chậm tiến độ" hoặc "điểm nghẽn chỉ tiêu": Liệt kê các chỉ tiêu thành phần có tiến độ percent < 100, nêu rõ tỷ lệ còn thiếu (gap), nguyên nhân nghẽn và đề xuất giải pháp tháo gỡ.
4. Nếu được yêu cầu "tổng hợp kiến nghị Phần IV báo cáo": Tổng hợp 4 nhóm nhiệm vụ giải pháp trọng tâm tháo gỡ các điểm nghẽn thực tế trên dữ liệu để trình Thường trực Đảng ủy xem xét kết luận.
5. Giữ văn phong hành chính Đảng trang trọng, chính xác, mạch lạc; sử dụng gạch đầu dòng rõ ràng.`;

    // 3. Gọi trực tiếp Google Gemini 1.5 Flash REST API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nCâu hỏi của cán bộ: "${query}"` }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1500,
          },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Lỗi kết nối Gemini API." }, { status: response.status });
    }

    const data = await response.json();
    const replyText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Không nhận được phản hồi từ AI Gemini.";

    return NextResponse.json({ reply: replyText });
  } catch (error: any) {
    return NextResponse.json({ error: "Lỗi xử lý hệ thống." }, { status: 500 });
  }
}