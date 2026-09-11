import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = typeof body?.query === "string" ? body.query : "";
    const docs = Array.isArray(body?.docs) ? body.docs : [];

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Chưa cấu hình API key Gemini. Thêm GEMINI_API_KEY hoặc GOOGLE_API_KEY vào file .env.local.",
        },
        { status: 500 }
      );
    }

    const contextSummary = JSON.stringify(docs, null, 2);
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            role: "system",
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: `Câu hỏi của cán bộ: "${query}"` }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1500,
          },
        }),
      }
    );

    const responseText = await response.text();
    let parsedError: any = null;

    try {
      parsedError = JSON.parse(responseText);
    } catch {
      // Ignore parse errors and use raw text if needed.
    }

    if (!response.ok) {
      const detail =
        parsedError?.error?.message ||
        parsedError?.message ||
        responseText ||
        "Lỗi kết nối Gemini API.";

      return NextResponse.json(
        {
          error: `Lỗi kết nối Gemini API: ${detail}`,
        },
        { status: response.status }
      );
    }

    const data = parsedError || JSON.parse(responseText || "{}");
    const replyText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Không nhận được phản hồi từ AI Gemini.";

    return NextResponse.json({ reply: replyText });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi xử lý hệ thống.";
    return NextResponse.json({ error: `Lỗi xử lý hệ thống: ${message}` }, { status: 500 });
  }
}