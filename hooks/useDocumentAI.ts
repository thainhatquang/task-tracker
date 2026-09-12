"use client";

import { useCallback } from "react";
import { DocItem, SubTarget } from "@/types";

interface TargetItem {
  planDoc: DocItem;
  target: SubTarget;
}

interface UseDocumentAIOptions {
  docs: DocItem[];
  counts: { tw: number; tu: number; phuong: number };
  wardPlans: DocItem[];
  allSubTargets: TargetItem[];
  institutionalBottlenecks: DocItem[];
  uncompletedTargetList: TargetItem[];
}

export function useDocumentAI({
  docs,
  counts,
  wardPlans,
  allSubTargets,
  institutionalBottlenecks,
  uncompletedTargetList,
}: UseDocumentAIOptions) {
  const askAssistant = useCallback(async (queryText: string): Promise<string> => {
    const query = queryText.trim();
    if (!query) return "";

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, docs }),
      });
      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = (await response.json()) as { reply?: string };
          if (data.reply) return data.reply;
        } else {
          const reply = await response.text();
          if (reply) return reply;
        }
      }
    } catch (error) {
      console.warn("Lỗi API Gemini:", error);
    }

    const qLower = query.toLowerCase();
    const matchedDoc = docs.find(
      (doc) =>
        qLower.includes(doc.doc_number.toLowerCase()) ||
        doc.doc_number.toLowerCase().includes(
          qLower.replace(/văn bản|kế hoạch|nghị quyết|quy định/g, "").trim(),
        ),
    );

    if (matchedDoc) {
      return (
        `• Số hiệu: ${matchedDoc.doc_number}\n` +
        `• Trích yếu: ${matchedDoc.title}\n` +
        `• Cơ quan & Ngày: ${matchedDoc.issuer} (${matchedDoc.issue_date})\n` +
        (matchedDoc.level === "Phường"
          ? `• Tiến độ: ${matchedDoc.target_percent}% chỉ tiêu cán đích 100% (${matchedDoc.sub_targets?.length || 0} chỉ tiêu)`
          : `• Tình trạng thể chế: ${matchedDoc.is_concretized ? `Đã có văn bản ${matchedDoc.concretized_by}` : "CHƯA CỤ THỂ HÓA (ĐIỂM NGHẼN THỂ CHẾ)"}`)
      );
    }

    if (qLower.includes("thể chế") || qLower.includes("cụ thể hóa") || qLower.includes("chưa ban hành")) {
      if (institutionalBottlenecks.length === 0) {
        return "✓ Không có điểm nghẽn thể chế. 100% văn bản Trung ương và Thành ủy đã được ban hành văn bản cụ thể hóa.";
      }
      const list = institutionalBottlenecks
        .map((doc, index) => `${index + 1}. ${doc.doc_number}: ${doc.title} (${doc.issuer}, ngày ${doc.issue_date})`)
        .join("\n");
      return `⚠️ Có ${institutionalBottlenecks.length} điểm nghẽn thể chế chưa ban hành kế hoạch:\n${list}\n\n↳ Kiến nghị: Giao Văn phòng Đảng ủy và Ban Xây dựng Đảng hoàn thành dự thảo văn bản trong tháng.`;
    }

    if (qLower.includes("chỉ tiêu") || qLower.includes("chậm") || qLower.includes("nghẽn") || qLower.includes("tiến độ")) {
      if (uncompletedTargetList.length === 0) {
        return "✓ 100% các chỉ tiêu theo văn bản của Đảng ủy phường đã hoàn thành.";
      }
      const list = uncompletedTargetList
        .map(
          ({ planDoc, target }, index) =>
            `${index + 1}. ${target.name} (${planDoc.doc_number})\n   - Đạt: ${target.percent}% (thiếu ${100 - target.percent}%) | Hạn: ${target.deadline || "2026"}\n   - Lý do: ${target.bottleneck_reason || "Đang giải quyết"}\n   - Giải pháp: ${target.proposed_solution || "Đôn đốc tiến độ"}`,
        )
        .join("\n");
      return `🎯 ${uncompletedTargetList.length} chỉ tiêu chậm tiến độ:\n${list}`;
    }

    return (
      `• Tổng số văn bản: ${docs.length} (TW: ${counts.tw}, Thành ủy: ${counts.tu}, Phường: ${counts.phuong})\n` +
      `• Văn bản Đảng ủy: ${wardPlans.length} văn bản (${allSubTargets.length} chỉ tiêu)\n` +
      `• Điểm nghẽn thể chế: ${institutionalBottlenecks.length} văn bản\n` +
      `• Điểm nghẽn chỉ tiêu: ${uncompletedTargetList.length} chỉ tiêu`
    );
  }, [allSubTargets.length, counts.phuong, counts.tu, counts.tw, docs, institutionalBottlenecks, uncompletedTargetList, wardPlans.length]);

  return { askAssistant };
}
