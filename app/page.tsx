"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type TabType = "tong_quan" | "trung_uong" | "thanh_uy" | "phuong" | "admin_docs" | "admin_targets";
type UserRole = "viewer" | "editor" | "admin";
type AgencyFilter = "all" | "van_phong" | "xay_dung_dang" | "ubkt" | "ubnd";

export interface SubTarget {
  id: string;
  name: string;
  percent: number;
  deadline?: string;
  risk_level?: "normal" | "warning" | "danger";
  bottleneck_reason?: string;
  proposed_solution?: string;
  assignee?: string;
}

export interface DocItem {
  id: string | number;
  doc_number: string;
  title: string;
  issue_date: string;
  issuer: string;
  level: "Trung ương" | "Thành ủy" | "Phường";
  file_url?: string;
  doc_url?: string;
  file_name?: string;
  is_concretized: boolean;
  concretized_by?: string;
  assignee?: string;
  agency_group?: "Văn phòng Đảng ủy" | "Ban Xây dựng Đảng" | "Cơ quan Ủy ban Kiểm tra" | "UBND phường";
  sub_targets?: SubTarget[];
  target_name?: string;
  target_percent: number;
  status: "Chưa thực hiện" | "Đang thực hiện" | "Hoàn thành";
}

function DigitalTaskTrackerLogo() {
  return (
    <div className="relative flex items-center justify-center shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 p-1 shadow-lg shadow-red-950/50 border border-blue-400/30">
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="84" height="84" rx="20" stroke="url(#techBorder)" strokeWidth="2" strokeDasharray="3 2" opacity="0.6" />
        <path d="M22 28C22 24.7 24.7 22 28 22H68C71.3 22 74 24.7 74 28V68C74 71.3 71.3 74 68 74H28C24.7 74 22 71.3 22 68V28Z" fill="url(#docGrad)" />
        <path d="M30 35H55M30 45H68M30 55H48" stroke="#60a5fa" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
        <circle cx="58" cy="35" r="2.5" fill="#93c5fd" />
        <circle cx="70" cy="45" r="2.5" fill="#38bdf8" />
        <circle cx="52" cy="55" r="2.5" fill="#818cf8" />
        <path d="M58 35L64 41M52 55L60 63" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="1 1" />
        <circle cx="68" cy="68" r="18" fill="url(#goldGrad)" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.6))" />
        <circle cx="68" cy="68" r="15" fill="#047857" />
        <path d="M62 68L66.5 72.5L75 63.5" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50 14L51.8 19H57L52.8 22L54.4 27L50 24L45.6 27L47.2 22L43 19H48.2L50 14Z" fill="url(#goldGrad)" />
        <defs>
          <linearGradient id="techBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#991b1b" />
            <stop offset="50%" stopColor="#7f1d1d" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function TNQMonogramBadge() {
  return (
    <div className="flex items-center gap-2.5 py-1 px-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-colors">
      <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-black text-[10px] tracking-tighter shadow-xs">
        TNQ
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold text-slate-300 tracking-wide flex items-center gap-1">
          <span>TNQ</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">® TM</span>
        </div>
        <div className="text-[9px] text-slate-500 truncate">Bản quyền chuyển đổi số nội bộ</div>
      </div>
    </div>
  );
}

function PlanDonutChart({ percent, size = "md" }: { percent: number; size?: "sm" | "md" | "lg" }) {
  const r = size === "lg" ? 58 : size === "sm" ? 28 : 38;
  const strokeW = size === "lg" ? 16 : size === "sm" ? 7 : 10;
  const dim = size === "lg" ? "w-36 h-36" : size === "sm" ? "w-16 h-16" : "w-24 h-24";
  const fontSize = size === "lg" ? "text-xl font-black" : size === "sm" ? "text-xs font-bold" : "text-base font-black";

  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;
  
  const strokeColor =
    clamped === 100 ? "#10b981" :
    clamped >= 70 ? "#2563eb" :
    clamped >= 40 ? "#f59e0b" :
    "#f43f5e";

  return (
    <div className={`relative ${dim} flex items-center justify-center shrink-0`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} fill="transparent" stroke="#f1f5f9" strokeWidth={strokeW} />
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
        <span className={`${fontSize} text-slate-900 tracking-tight`}>{clamped}%</span>
      </div>
    </div>
  );
}

export default function DocumentTaskTracker() {
  const [activeTab, setActiveTab] = useState<TabType>("tong_quan");
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [agencyFilter, setAgencyFilter] = useState<AgencyFilter>("all");
  const [modalPlan, setModalPlan] = useState<DocItem | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    document.title = "Theo dõi Nghị quyết - Đảng ủy phường Trung Nhứt";
  }, []);

  const [role, setRole] = useState<UserRole>("viewer");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "live" | "off">("off");

  const PASSWORD_ADMIN = "Admin@TrungNhut2026";
  const PASSWORD_EDITOR = "Nhaplieu@2026";

  useEffect(() => {
    const savedRole = localStorage.getItem("user_assigned_role") as UserRole;
    if (savedRole === "admin" || savedRole === "editor") {
      setRole(savedRole);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authPassword === PASSWORD_ADMIN || authPassword === "TrungNhut@2026") {
      setRole("admin");
      localStorage.setItem("user_assigned_role", "admin");
      setIsAuthModalOpen(false);
      setAuthPassword("");
      setAuthError("");
    } else if (authPassword === PASSWORD_EDITOR) {
      setRole("editor");
      localStorage.setItem("user_assigned_role", "editor");
      setIsAuthModalOpen(false);
      setAuthPassword("");
      setAuthError("");
    } else {
      setAuthError("Mật khẩu không hợp lệ! Vui lòng kiểm tra lại.");
    }
  };

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất và trở về chế độ Khách (Chỉ xem)?")) {
      setRole("viewer");
      localStorage.removeItem("user_assigned_role");
      if (activeTab === "admin_docs" || activeTab === "admin_targets") {
        setActiveTab("tong_quan");
      }
    }
  };

  const canEdit = role === "admin" || role === "editor";
  const canDelete = role === "admin";

  const [formLevel, setFormLevel] = useState<"Trung ương" | "Thành ủy" | "Phường">("Trung ương");
  const [formDocNumber, setFormDocNumber] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formIssueDate, setFormIssueDate] = useState("");
  const [formIssuer, setFormIssuer] = useState("");
  const [formAssignee, setFormAssignee] = useState("");
  const [formAgencyGroup, setFormAgencyGroup] = useState<"Văn phòng Đảng ủy" | "Ban Xây dựng Đảng" | "Cơ quan Ủy ban Kiểm tra" | "UBND phường">("Văn phòng Đảng ủy");
  const [formDocUrl, setFormDocUrl] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formIsConcretized, setFormIsConcretized] = useState(false);
  const [formConcretizedBy, setFormConcretizedBy] = useState("");
  const [formSubTargets, setFormSubTargets] = useState<{ name: string; percent: number; deadline?: string; bottleneck_reason?: string; proposed_solution?: string }[]>([
    { name: "", percent: 0, deadline: "2026-12-31", bottleneck_reason: "", proposed_solution: "" }
  ]);
  const [formSuccessMsg, setFormSuccessMsg] = useState("");

  const [selectedPlanId, setSelectedPlanId] = useState<string | number>("");

  const sampleData: DocItem[] = [
    {
      id: "p-1",
      doc_number: "21-KH/ĐU",
      title: "Kế hoạch thực hiện Nghị quyết 57-NQ/TW về đột phá chuyển đổi số và nâng cao chất lượng phục vụ nhân dân",
      issue_date: "2025-02-10",
      issuer: "Đảng ủy phường Trung Nhứt",
      level: "Phường",
      doc_url: "https://cantho.gov.vn",
      file_name: "21-KH-DU_Chuyendoiso.pdf",
      agency_group: "Văn phòng Đảng ủy",
      assignee: "Văn phòng Đảng ủy phối hợp UBND phường",
      is_concretized: true,
      sub_targets: [
        {
          id: "st-1",
          name: "Tỷ lệ thủ tục hành chính công trực tuyến toàn trình đạt 95%",
          percent: 100,
          deadline: "2026-06-30",
          risk_level: "normal",
          bottleneck_reason: "Đã hoàn thành xuất sắc chỉ tiêu giao",
          proposed_solution: "Tiếp tục duy trì và nhân rộng mô hình hỗ trợ tổ công nghệ số cộng đồng",
          assignee: "Văn phòng Đảng ủy"
        },
        {
          id: "st-2",
          name: "Mức độ hài lòng của người dân và doanh nghiệp đạt trên 95%",
          percent: 100,
          deadline: "2026-08-30",
          risk_level: "normal",
          bottleneck_reason: "Đạt 98.5% qua khảo sát trực tuyến",
          proposed_solution: "Duy trì hòm thư điện tử tiếp nhận phản ánh kiến nghị",
          assignee: "Văn phòng Đảng ủy"
        },
        {
          id: "st-3",
          name: "Tỷ lệ số hóa kết quả giải quyết TTHC còn hiệu lực",
          percent: 85,
          deadline: "2026-10-15",
          risk_level: "warning",
          bottleneck_reason: "Hồ sơ lưu trữ giấy giai đoạn trước 2020 số lượng lớn, trang thiết bị quét tài liệu chuyên dụng còn thiếu",
          proposed_solution: "Đề nghị UBND phường bố trí thêm máy scan tốc độ cao và huy động đoàn viên thanh niên hỗ trợ",
          assignee: "Văn phòng Đảng ủy"
        },
        {
          id: "st-4",
          name: "Chuẩn hóa và đồng bộ 100% cơ sở dữ liệu số phường",
          percent: 70,
          deadline: "2026-09-30",
          risk_level: "danger",
          bottleneck_reason: "Hệ thống phần mềm liên thông cấp thành phố thỉnh thoảng nghẽn mạng giờ cao điểm",
          proposed_solution: "Kiến nghị Sở Thông tin & Truyền thông thành phố Cần Thơ tối ưu băng thông đường truyền nội bộ",
          assignee: "Văn phòng Đảng ủy"
        }
      ],
      target_percent: 89,
      status: "Đang thực hiện",
    },
    {
      id: "p-2",
      doc_number: "35-KH/ĐU",
      title: "Kế hoạch phát triển đảng viên và nâng cao chất lượng sinh hoạt chi bộ địa bàn dân cư năm 2026",
      issue_date: "2026-01-15",
      issuer: "Đảng ủy phường Trung Nhứt",
      level: "Phường",
      doc_url: "https://tulieuvankien.dangcongsan.vn",
      file_name: "35-KH-DU_Dangvien.pdf",
      agency_group: "Ban Xây dựng Đảng",
      assignee: "Ban Xây dựng Đảng",
      is_concretized: true,
      sub_targets: [
        {
          id: "st-5",
          name: "100% chi bộ duy trì sinh hoạt định kỳ và chuyên đề đúng quy chế",
          percent: 100,
          deadline: "2026-06-30",
          risk_level: "normal",
          bottleneck_reason: "100% chi bộ chấp hành nghiêm quy chế làm việc",
          proposed_solution: "Tiếp tục phân công Đảng ủy viên dự sinh hoạt chi bộ dân cư",
          assignee: "Ban Xây dựng Đảng"
        },
        {
          id: "st-6",
          name: "Chỉ tiêu kết nạp 25 đảng viên mới trong năm 2026",
          percent: 68,
          deadline: "2026-11-30",
          risk_level: "warning",
          bottleneck_reason: "Nguồn thanh niên tại địa bàn dân cư đi làm ăn xa nhiều; công tác thẩm tra xác minh lý lịch còn chậm",
          proposed_solution: "Tập trung tạo nguồn từ khối giáo viên trường học, lực lượng dân quân và công an khu vực",
          assignee: "Ban Xây dựng Đảng"
        },
        {
          id: "st-7",
          name: "Tỷ lệ đảng viên hoàn thành tốt nhiệm vụ đạt trên 90%",
          percent: 80,
          deadline: "2026-12-15",
          risk_level: "normal",
          bottleneck_reason: "Đang trong kỳ theo dõi rèn luyện quý III",
          proposed_solution: "Đôn đốc các chi bộ tiến hành đánh giá xếp loại thực chất, đúng quy định",
          assignee: "Ban Xây dựng Đảng"
        },
        {
          id: "st-8",
          name: "Hoàn thiện số hóa 100% hồ sơ dữ liệu đảng viên",
          percent: 52,
          deadline: "2026-10-30",
          risk_level: "danger",
          bottleneck_reason: "Nhiều hồ sơ đảng viên hưu trí thông tin chưa đồng bộ với căn cước công dân gắn chip",
          proposed_solution: "Tổ chức đợt cao điểm 30 ngày phối hợp Công an phường đối soát dữ liệu đảng viên",
          assignee: "Ban Xây dựng Đảng"
        }
      ],
      target_percent: 75,
      status: "Đang thực hiện",
    },
    {
      id: "tw-1",
      doc_number: "57-NQ/TW",
      title: "Nghị quyết số 57-NQ/TW của Ban Chấp hành Trung ương Đảng về phát triển kinh tế - xã hội, bảo đảm quốc phòng, an ninh",
      issue_date: "2024-11-20",
      issuer: "Ban Chấp hành Trung ương",
      level: "Trung ương",
      doc_url: "https://tulieuvankien.dangcongsan.vn",
      is_concretized: true,
      concretized_by: "Kế hoạch số 21-KH/ĐU",
      target_percent: 100,
      status: "Hoàn thành",
    },
    {
      id: "tw-2",
      doc_number: "299-QĐ/TW",
      title: "Quy định số 299-QĐ/TW về chức năng, nhiệm vụ, tổ chức bộ máy cơ quan chuyên trách tham mưu, giúp việc cấp ủy",
      issue_date: "2025-03-15",
      issuer: "Ban Bí thư",
      level: "Trung ương",
      doc_url: "https://tulieuvankien.dangcongsan.vn",
      is_concretized: false,
      concretized_by: "",
      target_percent: 0,
      status: "Chưa thực hiện",
    },
    {
      id: "tu-1",
      doc_number: "118-KH/TU",
      title: "Kế hoạch số 118-KH/TU của Thành ủy Cần Thơ về lãnh đạo thực hiện phong trào thi đua 'Dân vận khéo' và chuyển đổi số toàn diện",
      issue_date: "2025-06-12",
      issuer: "Ban Thường vụ Thành ủy Cần Thơ",
      level: "Thành ủy",
      doc_url: "https://cantho.gov.vn",
      is_concretized: true,
      concretized_by: "Kế hoạch số 35-KH/ĐU",
      target_percent: 75,
      status: "Đang thực hiện",
    },
    {
      id: "tu-2",
      doc_number: "113-KH/TU",
      title: "Kế hoạch số 113-KH/TU về số hóa hồ sơ dữ liệu đảng viên và ứng dụng công nghệ trong sinh hoạt chi bộ",
      issue_date: "2025-07-02",
      issuer: "Ban Thường vụ Thành ủy Cần Thơ",
      level: "Thành ủy",
      doc_url: "https://cantho.gov.vn",
      is_concretized: false,
      concretized_by: "",
      target_percent: 0,
      status: "Chưa thực hiện",
    },
  ];

  const formatRawTasks = (data: any[]): DocItem[] => {
    return data.map((item: any) => {
      let subTargets: SubTarget[] = [];
      if (item.sub_targets) {
        try {
          subTargets = typeof item.sub_targets === "string" ? JSON.parse(item.sub_targets) : item.sub_targets;
        } catch (e) {
          subTargets = [];
        }
      }
      if (subTargets.length === 0 && item.target_name) {
        subTargets = [{ id: "st-default", name: item.target_name, percent: item.target_percent || 0, deadline: "2026-12-31" }];
      }

      let avg = item.target_percent || 0;
      if (subTargets.length > 0) {
        avg = Math.round(subTargets.reduce((acc, cur) => acc + (cur.percent || 0), 0) / subTargets.length);
      }

      return {
        id: item.id,
        doc_number: item.doc_number || (item.title?.includes(":") ? item.title.split(":")[0].trim() : "VB-" + item.id),
        title: item.title?.includes(":") ? item.title.split(":").slice(1).join(":").trim() : item.title,
        issue_date: item.issue_date || item.deadline || "2026-01-01",
        issuer: item.issuer || (item.level === "Trung ương" ? "Ban Chấp hành Trung ương" : item.level === "Thành ủy" ? "Ban Thường vụ Thành ủy" : "Đảng ủy phường"),
        level: item.level || "Trung ương",
        file_url: item.file_url || "",
        doc_url: item.doc_url || "",
        file_name: item.file_name || "",
        is_concretized: item.is_concretized ?? (item.status === "Hoàn thành" || item.level === "Phường"),
        concretized_by: item.concretized_by || "",
        assignee: item.assignee || "Văn phòng Đảng ủy",
        agency_group: item.agency_group || (item.assignee?.includes("Ban Xây dựng") ? "Ban Xây dựng Đảng" : item.assignee?.includes("Kiểm tra") ? "Cơ quan Ủy ban Kiểm tra" : "Văn phòng Đảng ủy"),
        sub_targets: subTargets,
        target_name: item.target_name || (subTargets.length > 0 ? subTargets.map(s => s.name).join("; ") : undefined),
        target_percent: avg,
        status: (item.status as any) || (avg === 100 ? "Hoàn thành" : avg > 0 ? "Đang thực hiện" : "Chưa thực hiện"),
      };
    });
  };

  const loadData = async () => {
    setLoading(true);
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .order("id", { ascending: false });
        if (!error && data && data.length > 0) {
          setDocs(formatRawTasks(data));
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Lỗi Supabase:", err);
      }
    }

    const saved = localStorage.getItem("party_documents_v10");
    if (saved) {
      try { setDocs(JSON.parse(saved)); } catch (e) { setDocs(sampleData); }
    } else {
      setDocs(sampleData);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    if (isSupabaseConfigured && supabase) {
      setRealtimeStatus("connecting");
      const channel = supabase
        .channel("realtime_tasks_channel_v10")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tasks" },
          () => {
            supabase
              .from("tasks")
              .select("*")
              .order("id", { ascending: false })
              .then(({ data }) => {
                if (data) {
                  setDocs(formatRawTasks(data));
                }
              });
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setRealtimeStatus("live");
          } else {
            setRealtimeStatus("off");
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setRealtimeStatus("off");
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured && docs.length > 0) {
      localStorage.setItem("party_documents_v10", JSON.stringify(docs));
    }
  }, [docs]);

  useEffect(() => {
    if (formLevel === "Trung ương") setFormIssuer("Ban Chấp hành Trung ương");
    else if (formLevel === "Thành ủy") setFormIssuer("Ban Thường vụ Thành ủy Cần Thơ");
    else setFormIssuer("Đảng ủy phường Trung Nhứt");
  }, [formLevel]);

  const handleOpenDocument = (doc: DocItem) => {
    const target = doc.file_url || doc.doc_url;
    if (target) {
      window.open(target, "_blank", "noopener,noreferrer");
    } else {
      alert(`Văn bản "${doc.doc_number}" hiện chưa được đính kèm tệp tải lên hoặc đường dẫn liên kết.`);
    }
  };

  const uploadFileToSupabase = async (file: File): Promise<string> => {
    if (!isSupabaseConfigured || !supabase) {
      return URL.createObjectURL(file);
    }
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { data, error } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (error) {
        console.warn("Lỗi upload Supabase Storage:", error.message);
        return URL.createObjectURL(file);
      }

      const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(filePath);
      return publicUrl || URL.createObjectURL(file);
    } catch (err) {
      console.warn("Lỗi lưu trữ Storage:", err);
      return URL.createObjectURL(file);
    }
  };

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert("Bạn cần quyền Cán bộ Nhập liệu hoặc Quản trị viên để thực hiện thao tác này.");
      return;
    }
    if (!formDocNumber.trim() || !formTitle.trim()) {
      alert("Vui lòng nhập đầy đủ Số văn bản và Trích yếu nội dung.");
      return;
    }

    setIsUploading(true);

    let uploadedFileUrl = "";
    let uploadedFileName = "";
    if (formFile) {
      uploadedFileName = formFile.name;
      uploadedFileUrl = await uploadFileToSupabase(formFile);
    }

    const validSubTargets: SubTarget[] = formSubTargets
      .filter(st => st.name.trim() !== "")
      .map((st, i) => {
        const pct = Math.min(100, Math.max(0, Number(st.percent) || 0));
        const risk: "normal" | "warning" | "danger" = pct === 100 ? "normal" : pct >= 70 ? "normal" : pct >= 40 ? "warning" : "danger";
        return {
          id: `st-${Date.now()}-${i}`,
          name: st.name.trim(),
          percent: pct,
          deadline: st.deadline || "2026-12-31",
          risk_level: risk,
          bottleneck_reason: st.bottleneck_reason || (pct < 100 ? "Đang trong lộ trình thực hiện" : "Đã hoàn thành"),
          proposed_solution: st.proposed_solution || "Tiếp tục đôn đốc theo tiến độ",
          assignee: formAssignee || formAgencyGroup
        };
      });

    const calcAvg = validSubTargets.length > 0 
      ? Math.round(validSubTargets.reduce((acc, cur) => acc + cur.percent, 0) / validSubTargets.length)
      : 0;

    const newDoc: DocItem = {
      id: Date.now().toString(),
      doc_number: formDocNumber.trim(),
      title: formTitle.trim(),
      issue_date: formIssueDate || new Date().toISOString().slice(0, 10),
      issuer: formIssuer.trim() || (formLevel === "Trung ương" ? "Ban Chấp hành Trung ương" : formLevel === "Thành ủy" ? "Thành ủy Cần Thơ" : "Đảng ủy phường"),
      level: formLevel,
      file_url: uploadedFileUrl || undefined,
      doc_url: formDocUrl.trim() || undefined,
      file_name: uploadedFileName || undefined,
      agency_group: formLevel === "Phường" ? formAgencyGroup : undefined,
      is_concretized: formLevel === "Phường" ? true : formIsConcretized,
      concretized_by: formLevel === "Phường" ? "" : formConcretizedBy.trim(),
      assignee: formAssignee.trim() || formAgencyGroup,
      sub_targets: formLevel === "Phường" ? validSubTargets : undefined,
      target_name: validSubTargets.map(s => s.name).join("; "),
      target_percent: formLevel === "Phường" ? calcAvg : (formIsConcretized ? 100 : 0),
      status: formLevel === "Phường" ? (calcAvg === 100 ? "Hoàn thành" : calcAvg > 0 ? "Đang thực hiện" : "Chưa thực hiện") : (formIsConcretized ? "Hoàn thành" : "Chưa thực hiện"),
    };

    if (isSupabaseConfigured && supabase) {
      const payload: any = {
        title: `${newDoc.doc_number}: ${newDoc.title}`,
        level: newDoc.level,
        deadline: newDoc.issue_date,
        assignee: newDoc.assignee,
        agency_group: newDoc.agency_group,
        status: newDoc.status,
        doc_number: newDoc.doc_number,
        issuer: newDoc.issuer,
        file_url: newDoc.file_url,
        doc_url: newDoc.doc_url,
        file_name: newDoc.file_name,
        is_concretized: newDoc.is_concretized,
        concretized_by: newDoc.concretized_by,
        target_name: newDoc.target_name,
        target_percent: newDoc.target_percent,
        sub_targets: JSON.stringify(newDoc.sub_targets || []),
      };
      const { data, error } = await supabase.from("tasks").insert([payload]).select();
      if (!error && data && data.length > 0) {
        newDoc.id = data[0].id;
      }
    }

    setDocs([newDoc, ...docs]);
    setIsUploading(false);
    setFormSuccessMsg(`Đã tiếp nhận thành công văn bản ${newDoc.doc_number}!`);
    setTimeout(() => setFormSuccessMsg(""), 4000);

    setFormDocNumber("");
    setFormTitle("");
    setFormIssueDate("");
    setFormAssignee("");
    setFormDocUrl("");
    setFormFile(null);
    setFormIsConcretized(false);
    setFormConcretizedBy("");
    setFormSubTargets([{ name: "", percent: 0, deadline: "2026-12-31", bottleneck_reason: "", proposed_solution: "" }]);
  };

  const handleUpdateSelectedPlanTargets = async (docId: string | number, newSubTargets: SubTarget[]) => {
    if (!canEdit) return;

    const targetDoc = docs.find(d => d.id === docId);
    if (!targetDoc) return;

    const avg = newSubTargets.length > 0
      ? Math.round(newSubTargets.reduce((acc, cur) => acc + (cur.percent || 0), 0) / newSubTargets.length)
      : 0;

    const newStatus = avg === 100 ? "Hoàn thành" : avg > 0 ? "Đang thực hiện" : "Chưa thực hiện";
    const updated = {
      ...targetDoc,
      sub_targets: newSubTargets,
      target_percent: avg,
      target_name: newSubTargets.map(s => s.name).join("; "),
      status: newStatus as any
    };

    setDocs(docs.map(d => d.id === docId ? updated : d));

    if (isSupabaseConfigured && supabase) {
      await supabase.from("tasks").update({
        sub_targets: JSON.stringify(newSubTargets),
        target_name: updated.target_name,
        target_percent: avg,
        status: newStatus
      }).eq("id", docId);
    }
  };

  const handleDeleteDoc = async (id: string | number) => {
    if (!canDelete) {
      alert("Chỉ Quản trị viên (Admin) mới có quyền xóa văn bản.");
      return;
    }
    if (!confirm("Bạn có chắc chắn muốn xóa văn bản này khỏi hệ thống?")) return;
    setDocs(docs.filter(d => d.id !== id));
    if (isSupabaseConfigured && supabase) {
      await supabase.from("tasks").delete().eq("id", id);
    }
  };

  const handleSetConcretized = async (id: string | number) => {
    if (!canEdit) return;
    const input = prompt("Nhập Số/Ký hiệu văn bản của Đảng ủy phường cụ thể hóa:", "Kế hoạch số ...-KH/ĐU");
    if (input === null || !input.trim()) return;

    setDocs(docs.map(d => d.id === id ? { ...d, is_concretized: true, concretized_by: input.trim() } : d));

    if (isSupabaseConfigured && supabase) {
      await supabase.from("tasks").update({ is_concretized: true, concretized_by: input.trim() }).eq("id", id);
    }
  };

  const counts = useMemo(() => ({
    tw: docs.filter(d => d.level === "Trung ương").length,
    tu: docs.filter(d => d.level === "Thành ủy").length,
    phuong: docs.filter(d => d.level === "Phường").length,
  }), [docs]);

  const wardPlans = useMemo(() => {
    const base = docs.filter(d => d.level === "Phường");
    if (agencyFilter === "all") return base;
    if (agencyFilter === "van_phong") return base.filter(d => d.agency_group === "Văn phòng Đảng ủy" || d.assignee?.includes("Văn phòng"));
    if (agencyFilter === "xay_dung_dang") return base.filter(d => d.agency_group === "Ban Xây dựng Đảng" || d.assignee?.includes("Xây dựng Đảng"));
    if (agencyFilter === "ubkt") return base.filter(d => d.agency_group === "Cơ quan Ủy ban Kiểm tra" || d.assignee?.includes("Kiểm tra"));
    if (agencyFilter === "ubnd") return base.filter(d => d.agency_group === "UBND phường" || d.assignee?.includes("UBND"));
    return base;
  }, [docs, agencyFilter]);

  const allSubTargets = useMemo(() => {
    const list: { planDoc: DocItem; target: SubTarget }[] = [];
    wardPlans.forEach(plan => {
      (plan.sub_targets || []).forEach(st => {
        list.push({ planDoc: plan, target: st });
      });
    });
    return list;
  }, [wardPlans]);

  const bottleneckConcretize = useMemo(() => {
    return docs.filter(d => (d.level === "Trung ương" || d.level === "Thành ủy") && !d.is_concretized);
  }, [docs]);

  const uncompletedTargetList = useMemo(() => {
    return allSubTargets.filter(item => item.target.percent < 100);
  }, [allSubTargets]);

  const selectedPlan = useMemo(() => {
    if (!selectedPlanId && wardPlans.length > 0) return wardPlans[0];
    return wardPlans.find(p => p.id === selectedPlanId) || wardPlans[0] || null;
  }, [wardPlans, selectedPlanId]);

  const filteredLevelDocs = useMemo(() => {
    if (activeTab === "tong_quan" || activeTab === "admin_docs" || activeTab === "admin_targets") return [];
    const levelMap: Record<string, "Trung ương" | "Thành ủy" | "Phường"> = {
      trung_uong: "Trung ương",
      thanh_uy: "Thành ủy",
      phuong: "Phường",
    };
    const targetLevel = levelMap[activeTab];
    return docs.filter(d => {
      const matchLevel = d.level === targetLevel;
      const matchSearch =
        d.doc_number.toLowerCase().includes(search.toLowerCase()) ||
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.issuer.toLowerCase().includes(search.toLowerCase());
      return matchLevel && matchSearch;
    });
  }, [docs, activeTab, search]);

  return (
    <div className="flex min-h-screen bg-slate-100/90 font-sans text-slate-800 antialiased selection:bg-red-500 selection:text-white">
      {/* SIDEBAR CỐ ĐỊNH */}
      <aside className="w-72 bg-slate-950 text-slate-200 flex flex-col shrink-0 border-r border-slate-800/80 shadow-2xl">
        <div className="p-5 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <DigitalTaskTrackerLogo />
            <div className="min-w-0">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 truncate">
                Đảng Ủy Phường Trung Nhứt
              </div>
              <div className="text-sm font-black text-white tracking-tight truncate">
                Theo Dõi Nghị Quyết
              </div>
              <div className="text-[10px] text-blue-300/80 font-medium flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                Ứng dụng chuyển đổi số
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Theo Dõi & Giám Sát
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <button
            onClick={() => setActiveTab("tong_quan")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
              activeTab === "tong_quan"
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-900/30"
                : "text-slate-300 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>📊</span>
              <span>Tổng Quan (Trang chính)</span>
            </div>
            {(bottleneckConcretize.length > 0 || uncompletedTargetList.length > 0) && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                {bottleneckConcretize.length + uncompletedTargetList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab("trung_uong"); setSearch(""); }}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeTab === "trung_uong"
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                : "text-slate-300 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>🏛️</span>
              <span>Văn bản Trung ương</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300">
              {counts.tw}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab("thanh_uy"); setSearch(""); }}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeTab === "thanh_uy"
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                : "text-slate-300 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>🏢</span>
              <span>Văn bản Thành ủy</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300">
              {counts.tu}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab("phuong"); setSearch(""); }}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeTab === "phuong"
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                : "text-slate-300 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>🚩</span>
              <span>Văn bản Đảng ủy phường</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300">
              {counts.phuong}
            </span>
          </button>

          <div className="pt-4 pb-1 px-2 text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>Khu Vực Quản Trị & Nhập Liệu</span>
            {!canEdit && <span>🔒</span>}
          </div>

          <button
            onClick={() => {
              if (canEdit) setActiveTab("admin_docs");
              else setIsAuthModalOpen(true);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeTab === "admin_docs"
                ? "bg-amber-600 text-white shadow-md shadow-amber-900/40"
                : canEdit
                ? "text-amber-200 hover:bg-slate-900 hover:text-white"
                : "text-slate-500 hover:bg-slate-900/50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>📝</span>
              <span>1. Nhập Liệu Văn Bản</span>
            </div>
            {!canEdit && <span className="text-xs text-slate-500">Khóa</span>}
          </button>

          <button
            onClick={() => {
              if (canEdit) setActiveTab("admin_targets");
              else setIsAuthModalOpen(true);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeTab === "admin_targets"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                : canEdit
                ? "text-emerald-200 hover:bg-slate-900 hover:text-white"
                : "text-slate-500 hover:bg-slate-900/50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>🎯</span>
              <span>2. Quản Lý Chỉ Tiêu</span>
            </div>
            {!canEdit && <span className="text-xs text-slate-500">Khóa</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs bg-slate-950 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              realtimeStatus === "live" ? "bg-emerald-400 animate-pulse" : 
              isSupabaseConfigured ? "bg-emerald-500" : "bg-amber-400"
            }`} />
            <span className="font-semibold text-slate-300 text-[11px]">
              {realtimeStatus === "live" ? "Realtime Supabase Trực tiếp" : 
               isSupabaseConfigured ? "CSDL Đám mây Supabase" : "Bộ nhớ máy cục bộ"}
            </span>
          </div>

          <TNQMonogramBadge />
        </div>
      </aside>

      {/* NỘI DUNG CHÍNH */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs backdrop-blur-md bg-white/95">
          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            <span>Theo dõi Nghị quyết</span>
            <span>›</span>
            <span className="text-red-700 font-bold text-base">
              {activeTab === "tong_quan" && "Tổng Quan Tiến Độ & Tháo Gỡ Điểm Nghẽn"}
              {activeTab === "trung_uong" && "Danh Mục Văn Bản Cấp Trung Ương"}
              {activeTab === "thanh_uy" && "Danh Mục Văn Bản Cấp Thành Ủy Cần Thơ"}
              {activeTab === "phuong" && "Danh Mục Kế Hoạch - Văn Bản Đảng Ủy Phường"}
              {activeTab === "admin_docs" && "Tab Riêng: Tiếp Nhận & Quản Lý Văn Bản 3 Cấp"}
              {activeTab === "admin_targets" && "Tab Riêng: Thiết Lập & Điều Chỉnh Chỉ Tiêu Kế Hoạch"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>📄</span> Xuất Báo Cáo Thường Trực
            </button>

            {role === "admin" && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs">
                <span>👑</span>
                <span>Quản trị viên (Toàn quyền)</span>
                <button onClick={handleLogout} className="ml-1 text-slate-400 hover:text-red-800 underline text-[11px] cursor-pointer">
                  Đăng xuất
                </button>
              </div>
            )}
            {role === "editor" && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs">
                <span>✍️</span>
                <span>Cán bộ Nhập liệu</span>
                <button onClick={handleLogout} className="ml-1 text-slate-400 hover:text-amber-900 underline text-[11px] cursor-pointer">
                  Đăng xuất
                </button>
              </div>
            )}
            {role === "viewer" && (
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium">
                <span>👁️</span>
                <span>Chế độ: <strong>Chỉ xem</strong></span>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="ml-1 text-blue-600 hover:text-blue-800 font-bold underline text-[11px] cursor-pointer"
                >
                  Mở khóa Nhập liệu / Admin
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* TAB 1: TỔNG QUAN */}
          {activeTab === "tong_quan" && (
            <div className="space-y-6">
              {/* BỘ LỌC 3 CƠ QUAN THAM MƯU THEO QĐ 299-QĐ/TW */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <span>🏢 Phân rã theo cơ quan tham mưu (QĐ 299-QĐ/TW):</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    onClick={() => setAgencyFilter("all")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                      agencyFilter === "all" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Toàn Đảng bộ ({docs.filter(d => d.level === "Phường").length})
                  </button>
                  <button
                    onClick={() => setAgencyFilter("van_phong")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                      agencyFilter === "van_phong" ? "bg-blue-600 text-white shadow-xs" : "bg-blue-50 text-blue-800 hover:bg-blue-100"
                    }`}
                  >
                    Văn phòng Đảng ủy
                  </button>
                  <button
                    onClick={() => setAgencyFilter("xay_dung_dang")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                      agencyFilter === "xay_dung_dang" ? "bg-red-600 text-white shadow-xs" : "bg-red-50 text-red-800 hover:bg-red-100"
                    }`}
                  >
                    Ban Xây dựng Đảng
                  </button>
                  <button
                    onClick={() => setAgencyFilter("ubkt")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                      agencyFilter === "ubkt" ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    Cơ quan Ủy ban Kiểm tra
                  </button>
                </div>
              </div>

              {/* Thống kê vĩ mô */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-bold uppercase text-slate-500">Tổng văn bản theo dõi</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{docs.length}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">TW: {counts.tw} | TU: {counts.tu} | Phường: {counts.phuong}</div>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs">
                  <div className="text-xs font-bold uppercase text-blue-700">Kế hoạch đang theo dõi</div>
                  <div className="text-2xl font-black text-blue-700 mt-1">{wardPlans.length}</div>
                  <div className="text-[11px] text-blue-600 mt-0.5">Gồm {allSubTargets.length} chỉ tiêu thành phần</div>
                </div>

                <div className={`bg-white p-4.5 rounded-2xl border shadow-xs ${
                  bottleneckConcretize.length > 0 ? "border-amber-300 bg-amber-50/30" : "border-slate-200"
                }`}>
                  <div className="text-xs font-bold uppercase text-amber-700">Điểm nghẽn Cụ thể hóa</div>
                  <div className="text-2xl font-black text-amber-700 mt-1">{bottleneckConcretize.length}</div>
                  <div className="text-[11px] text-amber-600 mt-0.5">Văn bản TW/TU chưa ban hành KH</div>
                </div>

                <div className={`bg-white p-4.5 rounded-2xl border shadow-xs ${
                  uncompletedTargetList.length > 0 ? "border-rose-300 bg-rose-50/30" : "border-slate-200"
                }`}>
                  <div className="text-xs font-bold uppercase text-rose-700">Điểm nghẽn Chỉ tiêu</div>
                  <div className="text-2xl font-black text-rose-700 mt-1">{uncompletedTargetList.length}</div>
                  <div className="text-[11px] text-rose-600 mt-0.5">Chỉ tiêu chưa đạt 100%</div>
                </div>
              </div>

              {/* KHỐI (1): DASHBOARD TIẾN ĐỘ - 2 BIỂU ĐỒ RIÊNG CHO 2 KẾ HOẠCH */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 border-b pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">1</span>
                      Dashboard Tiến Độ Triển Khai Kế Hoạch Đảng Ủy Phường
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hiển thị <strong>2 biểu đồ tròn độc lập</strong> cho 2 kế hoạch trọng tâm. <strong>Nhấp chuột vào biểu đồ</strong> để hiển thị nhóm chỉ tiêu hoàn thành và chưa hoàn thành.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Realtime Supabase
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {wardPlans.map(plan => {
                    const subList = plan.sub_targets || [];
                    const completedTargets = subList.filter(st => st.percent === 100);
                    const uncompletedTargets = subList.filter(st => st.percent < 100);

                    return (
                      <div
                        key={plan.id}
                        onClick={() => setModalPlan(plan)}
                        className="bg-gradient-to-br from-slate-50 to-blue-50/20 hover:from-blue-50/30 hover:to-indigo-50/30 p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                        title="Nhấp vào biểu đồ để xem nhóm chỉ tiêu hoàn thành & chưa hoàn thành"
                      >
                        <div className="flex justify-between items-start gap-2 border-b border-slate-200/80 pb-2.5 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-900 text-white shadow-xs">
                              {plan.doc_number}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">Ban hành: {plan.issue_date}</span>
                          </div>
                          <span className="text-[11px] font-bold text-blue-600 group-hover:underline flex items-center gap-1">
                            <span>🔍</span> Xem nhóm chỉ tiêu
                          </span>
                        </div>

                        <div className="flex items-center gap-5">
                          <div className="transform group-hover:scale-105 transition-transform duration-300">
                            <PlanDonutChart percent={plan.target_percent} size="lg" />
                          </div>

                          <div className="flex-1 min-w-0 space-y-2">
                            <h3 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2" title={plan.title}>
                              {plan.title}
                            </h3>

                            <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                              <span className="font-bold text-emerald-800 flex items-center gap-1">
                                <span>✓</span> Hoàn thành (100%):
                              </span>
                              <span className="font-black text-emerald-700">
                                {completedTargets.length} / {subList.length} chỉ tiêu
                              </span>
                            </div>

                            <div className="p-2 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between text-xs">
                              <span className="font-bold text-rose-800 flex items-center gap-1">
                                <span>⚠️</span> Chưa hoàn thành:
                              </span>
                              <span className="font-black text-rose-700">
                                {uncompletedTargets.length} / {subList.length} chỉ tiêu
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Khối chủ trì: <strong className="text-slate-800">{plan.agency_group || plan.assignee}</strong></span>
                          <span className="font-bold text-blue-700">Tiến độ: {plan.target_percent}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* KHỐI (2): ĐIỂM NGHẼN CỤ THỂ HÓA */}
              <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 space-y-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 border-b pb-3">
                  <div>
                    <h2 className="text-base font-bold text-amber-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-black">2</span>
                      Điểm Nghẽn Cụ Thể Hóa Văn Bản Cấp Trên
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Văn bản của <strong>Trung ương</strong> và <strong>Thành ủy</strong> mà Đảng ủy phường <strong>CHƯA cụ thể hóa</strong>
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-lg">
                    {bottleneckConcretize.length} văn bản cần tháo gỡ
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-amber-50/60 text-slate-600 font-bold border-b border-amber-200">
                      <tr>
                        <th className="p-3 w-24">Cấp</th>
                        <th className="p-3 w-36">Số văn bản</th>
                        <th className="p-3">Trích yếu nội dung văn bản cấp trên</th>
                        <th className="p-3 w-44">Cơ quan ban hành</th>
                        <th className="p-3 w-28">Ngày ban hành</th>
                        <th className="p-3 w-40 text-center">Tình trạng cụ thể hóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bottleneckConcretize.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-emerald-600 font-medium">
                            ✓ Rất tốt: 100% văn bản của Trung ương và Thành ủy đã được cụ thể hóa kịp thời!
                          </td>
                        </tr>
                      ) : (
                        bottleneckConcretize.map(doc => (
                          <tr key={doc.id} className="hover:bg-amber-50/30 transition">
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                doc.level === "Trung ương" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                              }`}>
                                {doc.level}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-slate-900">{doc.doc_number}</td>
                            <td className="p-3 font-medium text-slate-800 leading-relaxed max-w-md">
                              <span
                                onClick={() => handleOpenDocument(doc)}
                                className="cursor-pointer hover:text-blue-600 hover:underline flex items-center gap-1.5"
                                title="Nhấp chuột để mở văn bản"
                              >
                                {doc.file_url ? "📎" : doc.doc_url ? "🔗" : ""} {doc.title}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600">{doc.issuer}</td>
                            <td className="p-3 text-slate-600 whitespace-nowrap">{doc.issue_date}</td>
                            <td className="p-3 text-center">
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200 inline-block">
                                ⚠️ Chưa cụ thể hóa
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* KHỐI (3): ĐIỂM NGHẼN CHỈ TIÊU - NÂNG CẤP THÊM NGUYÊN NHÂN NGHẼN & ĐỀ XUẤT THÁO GỠ */}
              <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-6 space-y-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 border-b pb-3">
                  <div>
                    <h2 className="text-base font-bold text-rose-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs font-black">3</span>
                      Điểm Nghẽn Chỉ Tiêu Kế Hoạch Đảng Ủy Phường (Kèm Nguyên Nhân & Kiến Nghị Tháo Gỡ)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Danh mục chi tiết các chỉ tiêu chưa đạt, thời hạn hoàn thành, <strong>nguyên nhân nghẽn</strong> và <strong>kiến nghị giải pháp</strong> trình Thường trực chỉ đạo
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-rose-100 text-rose-800 rounded-lg">
                    {uncompletedTargetList.length} chỉ tiêu cần đôn đốc
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-rose-50/60 text-slate-600 font-bold border-b border-rose-200">
                      <tr>
                        <th className="p-3 w-32">Kế hoạch</th>
                        <th className="p-3 w-64">Tên chỉ tiêu & Thời hạn</th>
                        <th className="p-3 w-40">Khối chủ trì</th>
                        <th className="p-3 w-36">Tiến độ (Gap)</th>
                        <th className="p-3">Nguyên nhân điểm nghẽn</th>
                        <th className="p-3">Kiến nghị / Giải pháp tháo gỡ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {uncompletedTargetList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-emerald-600 font-bold text-sm">
                            ✓ Xuất sắc: 100% các chỉ tiêu kế hoạch của Đảng ủy phường đã hoàn thành!
                          </td>
                        </tr>
                      ) : (
                        uncompletedTargetList.map(({ planDoc, target }) => {
                          const gap = 100 - target.percent;
                          return (
                            <tr key={`${planDoc.id}-${target.id}`} className="hover:bg-rose-50/30 transition">
                              <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-800">
                                  {planDoc.doc_number}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-slate-900 leading-snug">🎯 {target.name}</div>
                                <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                                  <span>📅 Hạn chót: <strong>{target.deadline || "2026-12-31"}</strong></span>
                                </div>
                              </td>
                              <td className="p-3 font-medium text-slate-700">
                                {target.assignee || planDoc.agency_group || planDoc.assignee}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-slate-800">{target.percent}%</span>
                                  <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded">
                                    (-{gap}%)
                                  </span>
                                </div>
                                <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1">
                                  <div
                                    className={`h-full rounded-full ${
                                      target.percent >= 70 ? "bg-amber-500" : "bg-rose-500"
                                    }`}
                                    style={{ width: `${target.percent}%` }}
                                  />
                                </div>
                              </td>
                              <td className="p-3 text-slate-700 leading-relaxed text-[11px] bg-rose-50/20">
                                <span className="text-slate-800 font-medium">{target.bottleneck_reason || "Đang trong tiến trình giải quyết"}</span>
                              </td>
                              <td className="p-3 text-blue-900 leading-relaxed text-[11px] bg-blue-50/20 font-medium">
                                {target.proposed_solution || "Đôn đốc các bộ phận liên quan đẩy nhanh tiến độ"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CÁC TAB HIỂN THỊ CÔNG CỘNG */}
          {(activeTab === "trung_uong" || activeTab === "thanh_uy" || activeTab === "phuong") && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {activeTab === "trung_uong" && "Danh Mục Văn Bản Cấp Trung Ương"}
                    {activeTab === "thanh_uy" && "Danh Mục Văn Bản Cấp Thành Ủy Cần Thơ"}
                    {activeTab === "phuong" && "Danh Mục Kế Hoạch - Văn Bản Đảng Ủy Phường"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tổng số: <strong className="text-blue-600">{filteredLevelDocs.length}</strong> văn bản (<strong>Nhấp vào trích yếu</strong> để xem trực tiếp văn bản)
                  </p>
                </div>

                <div className="relative w-full md:w-80">
                  <input
                    type="text"
                    placeholder="Tìm theo Số văn bản, Trích yếu..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                        <th className="p-3.5 w-40">1. Số văn bản</th>
                        <th className="p-3.5">2. Trích yếu nội dung (Nhấp để mở văn bản)</th>
                        <th className="p-3.5 w-32">3. Ngày ban hành</th>
                        <th className="p-3.5 w-52">4. Cơ quan ban hành</th>
                        {activeTab !== "phuong" ? (
                          <th className="p-3.5 w-44 text-center">Tình trạng cụ thể hóa</th>
                        ) : (
                          <th className="p-3.5 w-40 text-center">Tiến độ chỉ tiêu</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLevelDocs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-10 text-center text-slate-400">
                            Chưa có văn bản nào trong mục này.
                          </td>
                        </tr>
                      ) : (
                        filteredLevelDocs.map(doc => (
                          <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                              <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-slate-800">
                                {doc.doc_number}
                              </span>
                            </td>

                            <td className="p-3.5 font-medium text-slate-800 max-w-md leading-relaxed">
                              <div
                                onClick={() => handleOpenDocument(doc)}
                                className="cursor-pointer hover:text-blue-600 transition-colors group flex items-start gap-1.5"
                                title={doc.file_url ? "Mở tệp đính kèm đã tải lên" : doc.doc_url ? "Mở đường dẫn liên kết văn bản" : "Chưa có file hoặc link"}
                              >
                                {doc.file_url ? (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold shrink-0 mt-0.5">
                                    📎 Tệp
                                  </span>
                                ) : doc.doc_url ? (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold shrink-0 mt-0.5">
                                    🔗 Link
                                  </span>
                                ) : null}
                                <span className="group-hover:underline font-semibold leading-relaxed">
                                  {doc.title}
                                </span>
                              </div>

                              {doc.concretized_by && (
                                <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                                  ↳ Cụ thể hóa bằng: {doc.concretized_by}
                                </div>
                              )}
                            </td>

                            <td className="p-3.5 text-slate-600 whitespace-nowrap font-medium">
                              {doc.issue_date}
                            </td>

                            <td className="p-3.5 text-slate-700 font-medium">
                              {doc.issuer}
                            </td>

                            {activeTab !== "phuong" ? (
                              <td className="p-3.5 text-center">
                                <span
                                  className={`px-3 py-1 rounded-full text-[11px] font-bold inline-block ${
                                    doc.is_concretized
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                      : "bg-rose-100 text-rose-800 border border-rose-300"
                                  }`}
                                >
                                  {doc.is_concretized ? "✓ Đã cụ thể hóa" : "⚠️ Chưa cụ thể hóa"}
                                </span>
                              </td>
                            ) : (
                              <td className="p-3.5 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="font-bold text-slate-800">{doc.target_percent}%</span>
                                </div>
                                <div className="w-24 mx-auto bg-slate-200 rounded-full h-1.5 mt-1">
                                  <div
                                    className={`h-full rounded-full ${
                                      doc.target_percent === 100 ? "bg-emerald-500" :
                                      doc.target_percent >= 50 ? "bg-blue-600" : "bg-amber-500"
                                    }`}
                                    style={{ width: `${doc.target_percent}%` }}
                                  />
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB RIÊNG 1: QUẢN LÝ & NHẬP LIỆU VĂN BẢN */}
          {activeTab === "admin_docs" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 rounded-2xl shadow-md">
                <h2 className="text-lg font-black flex items-center gap-2">
                  <span>📝</span> Tab Riêng 1: Tiếp Nhận & Quản Lý Văn Bản 3 Cấp
                </h2>
                <p className="text-xs text-amber-100 mt-1">
                  Khu vực chuyên biệt có tích hợp trường <strong>Tải lên tệp văn bản</strong> và <strong>Đường dẫn liên kết trực tiếp (URL)</strong>.
                </p>
              </div>

              {formSuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold animate-in fade-in">
                  ✓ {formSuccessMsg}
                </div>
              )}

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-900 border-b pb-2">
                  1. Tiếp nhận văn bản mới vào hệ thống
                </h3>

                <form onSubmit={handleCreateDoc} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Cấp văn bản:</label>
                      <select
                        value={formLevel}
                        onChange={(e) => setFormLevel(e.target.value as any)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-semibold text-xs"
                      >
                        <option value="Trung ương">Cấp Trung ương</option>
                        <option value="Thành ủy">Cấp Thành ủy</option>
                        <option value="Phường">Đảng ủy phường</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Số văn bản <span className="text-rose-500">*</span>:</label>
                      <input
                        type="text"
                        required
                        placeholder="VD: 57-NQ/TW, 118-KH/TU..."
                        value={formDocNumber}
                        onChange={(e) => setFormDocNumber(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Ngày ban hành:</label>
                      <input
                        type="date"
                        value={formIssueDate}
                        onChange={(e) => setFormIssueDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Cơ quan ban hành:</label>
                      <input
                        type="text"
                        placeholder="VD: Ban Chấp hành Trung ương..."
                        value={formIssuer}
                        onChange={(e) => setFormIssuer(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Khối tham mưu (QĐ 299-QĐ/TW):</label>
                      <select
                        value={formAgencyGroup}
                        onChange={(e) => setFormAgencyGroup(e.target.value as any)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-semibold text-xs"
                      >
                        <option value="Văn phòng Đảng ủy">Văn phòng Đảng ủy</option>
                        <option value="Ban Xây dựng Đảng">Ban Xây dựng Đảng</option>
                        <option value="Cơ quan Ủy ban Kiểm tra">Cơ quan Ủy ban Kiểm tra</option>
                        <option value="UBND phường">UBND phường</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Đơn vị chủ trì cụ thể:</label>
                      <input
                        type="text"
                        placeholder="VD: Văn phòng Đảng ủy phối hợp UBND..."
                        value={formAssignee}
                        onChange={(e) => setFormAssignee(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-xs"
                      />
                    </div>
                  </div>

                  {/* KHU VỰC THÊM TRƯỜNG UPLOAD TỆP & LINK VĂN BẢN TRỰC TIẾP */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-blue-50/50 p-3.5 rounded-xl border border-blue-200">
                    <div>
                      <label className="font-bold text-blue-900 block mb-1">
                        📎 Tải lên tệp văn bản (PDF / Word / Scan):
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFormFile(e.target.files[0]);
                          }
                        }}
                        className="w-full border border-blue-300 rounded-xl p-2 bg-white text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-blue-900 block mb-1">
                        🔗 Hoặc chèn Đường dẫn liên kết trực tiếp (URL):
                      </label>
                      <input
                        type="url"
                        placeholder="https://tulieuvankien.dangcongsan.vn/..."
                        value={formDocUrl}
                        onChange={(e) => setFormDocUrl(e.target.value)}
                        className="w-full border border-blue-300 rounded-xl p-2.5 bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Trích yếu nội dung văn bản <span className="text-rose-500">*</span>:</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Ghi rõ trích yếu nội dung..."
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs leading-relaxed"
                    />
                  </div>

                  {/* Cụ thể hóa văn bản TW/TU */}
                  {formLevel !== "Phường" && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="formCheckConcretized"
                          checked={formIsConcretized}
                          onChange={(e) => setFormIsConcretized(e.target.checked)}
                          className="rounded text-amber-600"
                        />
                        <label htmlFor="formCheckConcretized" className="font-bold text-slate-800">
                          Đảng ủy phường đã ban hành văn bản cụ thể hóa?
                        </label>
                      </div>
                      {formIsConcretized && (
                        <input
                          type="text"
                          placeholder="Nhập số KH cụ thể hóa (VD: Kế hoạch số 21-KH/ĐU)..."
                          value={formConcretizedBy}
                          onChange={(e) => setFormConcretizedBy(e.target.value)}
                          className="w-full border border-amber-300 rounded-lg p-2 bg-white text-xs"
                        />
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isUploading ? "Đang xử lý tệp & Lưu..." : "+ Lưu văn bản vào hệ thống"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Danh mục văn bản đang lưu trữ */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-sm text-slate-900 border-b pb-2">
                  2. Danh mục văn bản đang lưu trữ ({docs.length})
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                      <tr>
                        <th className="p-3 w-24">Cấp</th>
                        <th className="p-3 w-32">Số văn bản</th>
                        <th className="p-3">Trích yếu nội dung</th>
                        <th className="p-3 w-28 text-center">Tệp / Link</th>
                        <th className="p-3 w-36">Cụ thể hóa</th>
                        <th className="p-3 w-24 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {docs.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/60">
                          <td className="p-3 font-semibold text-slate-600">{item.level}</td>
                          <td className="p-3 font-bold text-slate-900">{item.doc_number}</td>
                          <td className="p-3 text-slate-800 max-w-md">
                            <span
                              onClick={() => handleOpenDocument(item)}
                              className="cursor-pointer hover:text-blue-600 hover:underline font-medium"
                            >
                              {item.title}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {item.file_url ? (
                              <button
                                onClick={() => handleOpenDocument(item)}
                                className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px] hover:bg-blue-100 cursor-pointer"
                              >
                                📎 Mở Tệp
                              </button>
                            ) : item.doc_url ? (
                              <button
                                onClick={() => handleOpenDocument(item)}
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md font-bold text-[10px] hover:bg-emerald-100 cursor-pointer"
                              >
                                🔗 Mở Link
                              </button>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            {item.level !== "Phường" ? (
                              item.is_concretized ? (
                                <span className="text-emerald-700 font-bold text-[11px]">✓ {item.concretized_by || "Đã cụ thể hóa"}</span>
                              ) : (
                                <button
                                  onClick={() => handleSetConcretized(item.id)}
                                  className="text-blue-600 hover:underline font-bold text-[11px] cursor-pointer"
                                >
                                  + Gán Kế hoạch
                                </button>
                              )
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteDoc(item.id)}
                                className="text-rose-600 hover:text-rose-800 font-bold text-xs p-1 cursor-pointer"
                                title="Xóa văn bản này"
                              >
                                Xóa
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB RIÊNG 2: QUẢN LÝ CHỈ TIÊU KẾ HOẠCH */}
          {activeTab === "admin_targets" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-md">
                <h2 className="text-lg font-black flex items-center gap-2">
                  <span>🎯</span> Tab Riêng 2: Thiết Lập & Thêm Bớt Chỉ Tiêu Kế Hoạch Đảng Ủy Phường
                </h2>
                <p className="text-xs text-emerald-100 mt-1">
                  Chọn kế hoạch của Đảng ủy phường để thêm chỉ tiêu, cập nhật thời hạn hoàn thành, nguyên nhân nghẽn và giải pháp kiến nghị.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="w-full md:w-auto">
                  <label className="font-bold text-slate-700 block mb-1 text-xs">Chọn Kế hoạch cần cấu hình chỉ tiêu:</label>
                  <select
                    value={selectedPlan?.id || ""}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-bold text-xs w-full md:w-96"
                  >
                    {wardPlans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.doc_number} - {p.title.slice(0, 45)}...
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPlan && (
                  <div className="flex items-center gap-4 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <PlanDonutChart percent={selectedPlan.target_percent} size="sm" />
                    <div>
                      <div className="text-xs font-bold text-emerald-950">Tiến độ bình quân:</div>
                      <div className="text-xl font-black text-emerald-700">{selectedPlan.target_percent}%</div>
                      <div className="text-[11px] text-emerald-600">{selectedPlan.sub_targets?.length || 0} chỉ tiêu con</div>
                    </div>
                  </div>
                )}
              </div>

              {selectedPlan && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        Danh sách chỉ tiêu của: <span className="text-blue-700 font-black">{selectedPlan.doc_number}</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{selectedPlan.title}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const curList = selectedPlan.sub_targets || [];
                        const newList: SubTarget[] = [
                          ...curList,
                          {
                            id: `st-${Date.now()}`,
                            name: "",
                            percent: 0,
                            deadline: "2026-12-31",
                            risk_level: "normal",
                            bottleneck_reason: "",
                            proposed_solution: "",
                            assignee: selectedPlan.agency_group || "Văn phòng Đảng ủy"
                          }
                        ];
                        handleUpdateSelectedPlanTargets(selectedPlan.id, newList);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      ＋ Thêm chỉ tiêu mới
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(selectedPlan.sub_targets || []).length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        Kế hoạch này chưa có chỉ tiêu thành phần nào. Hãy bấm <strong>"＋ Thêm chỉ tiêu mới"</strong> để bắt đầu.
                      </div>
                    ) : (
                      (selectedPlan.sub_targets || []).map((st, idx) => (
                        <div key={st.id || idx} className="p-4.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              placeholder="Tên chỉ tiêu..."
                              value={st.name}
                              onChange={(e) => {
                                const list = [...(selectedPlan.sub_targets || [])];
                                list[idx].name = e.target.value;
                                handleUpdateSelectedPlanTargets(selectedPlan.id, list);
                              }}
                              className="flex-1 border border-slate-300 rounded-xl p-2 bg-white text-xs font-bold"
                            />
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-500 font-medium">Hạn chót:</span>
                              <input
                                type="date"
                                value={st.deadline || "2026-12-31"}
                                onChange={(e) => {
                                  const list = [...(selectedPlan.sub_targets || [])];
                                  list[idx].deadline = e.target.value;
                                  handleUpdateSelectedPlanTargets(selectedPlan.id, list);
                                }}
                                className="border border-slate-300 rounded-xl p-1.5 bg-white text-xs"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const list = (selectedPlan.sub_targets || []).filter((_, i) => i !== idx);
                                handleUpdateSelectedPlanTargets(selectedPlan.id, list);
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1.5 cursor-pointer"
                              title="Xóa chỉ tiêu này"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="flex items-center gap-4 pl-9">
                            <span className="text-xs text-slate-500 font-medium">Tiến độ đạt được:</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={st.percent}
                              onChange={(e) => {
                                const list = [...(selectedPlan.sub_targets || [])];
                                list[idx].percent = Number(e.target.value);
                                handleUpdateSelectedPlanTargets(selectedPlan.id, list);
                              }}
                              className="flex-1 accent-emerald-600 cursor-pointer h-2"
                            />
                            <span className={`w-14 text-right font-black text-xs ${
                              st.percent === 100 ? "text-emerald-700" :
                              st.percent >= 70 ? "text-blue-700" :
                              st.percent >= 40 ? "text-amber-700" : "text-rose-700"
                            }`}>
                              {st.percent}%
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9 pt-1">
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-0.5">
                                Nguyên nhân điểm nghẽn (nếu chưa đạt 100%):
                              </label>
                              <input
                                type="text"
                                placeholder="Ghi rõ vướng mắc, khó khăn..."
                                value={st.bottleneck_reason || ""}
                                onChange={(e) => {
                                  const list = [...(selectedPlan.sub_targets || [])];
                                  list[idx].bottleneck_reason = e.target.value;
                                  handleUpdateSelectedPlanTargets(selectedPlan.id, list);
                                }}
                                className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-blue-800 uppercase block mb-0.5">
                                Kiến nghị / Giải pháp tháo gỡ trình Thường trực:
                              </label>
                              <input
                                type="text"
                                placeholder="Đề xuất hướng xử lý cụ thể..."
                                value={st.proposed_solution || ""}
                                onChange={(e) => {
                                  const list = [...(selectedPlan.sub_targets || [])];
                                  list[idx].proposed_solution = e.target.value;
                                  handleUpdateSelectedPlanTargets(selectedPlan.id, list);
                                }}
                                className="w-full border border-blue-200 rounded-lg p-2 bg-blue-50/40 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* MODAL HIỂN THỊ 2 NHÓM CHỈ TIÊU KHI CLICK VÀO BIỂU ĐỒ TRÒN */}
      {modalPlan && (() => {
        const subList = modalPlan.sub_targets || [];
        const completedTargets = subList.filter(st => st.percent === 100);
        const uncompletedTargets = subList.filter(st => st.percent < 100);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-white text-slate-900 shadow-xs">
                    {modalPlan.doc_number}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm leading-tight line-clamp-1">{modalPlan.title}</h3>
                    <div className="text-[11px] text-blue-200 mt-0.5">Tiến độ kế hoạch: <strong>{modalPlan.target_percent}%</strong> • Khối: {modalPlan.agency_group || modalPlan.assignee}</div>
                  </div>
                </div>
                <button
                  onClick={() => setModalPlan(null)}
                  className="text-slate-400 hover:text-white cursor-pointer text-lg font-bold ml-3"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                {/* 1. NHÓM CHỈ TIÊU ĐÃ HOÀN THÀNH (100%) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                    <h4 className="text-xs font-extrabold uppercase text-emerald-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
                      Nhóm Chỉ Tiêu Đã Hoàn Thành (100%)
                    </h4>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {completedTargets.length} chỉ tiêu
                    </span>
                  </div>

                  {completedTargets.length === 0 ? (
                    <div className="p-4 bg-slate-50 text-slate-400 text-center text-xs rounded-xl italic">
                      Chưa có chỉ tiêu nào đạt 100% hoàn thành.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {completedTargets.map((st, i) => (
                        <div key={st.id || i} className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                              ✓
                            </span>
                            <div>
                              <div className="font-bold text-xs text-slate-900 leading-snug">{st.name}</div>
                              <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Hoàn thành đúng hạn: {st.deadline || "2026"}</div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shrink-0">
                            100%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. NHÓM CHỈ TIÊU CHƯA HOÀN THÀNH (< 100%) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                    <h4 className="text-xs font-extrabold uppercase text-rose-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">⚠️</span>
                      Nhóm Chỉ Tiêu Chưa Hoàn Thành (&lt; 100%)
                    </h4>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      {uncompletedTargets.length} chỉ tiêu
                    </span>
                  </div>

                  {uncompletedTargets.length === 0 ? (
                    <div className="p-4 bg-emerald-50 text-emerald-700 text-center text-xs rounded-xl font-bold">
                      ✓ Rất tốt: Toàn bộ chỉ tiêu của kế hoạch này đã hoàn thành 100%!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {uncompletedTargets.map((st, i) => {
                        const gap = 100 - st.percent;
                        return (
                          <div key={st.id || i} className="p-4 bg-rose-50/40 border border-rose-200 rounded-2xl space-y-2.5">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="font-bold text-xs text-slate-900 leading-snug">🎯 {st.name}</span>
                                <div className="text-[10px] text-slate-500 mt-0.5">Hạn chót: <strong>{st.deadline || "2026-12-31"}</strong></div>
                              </div>
                              <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2.5 py-0.5 rounded-full shrink-0">
                                Còn thiếu {gap}%
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-slate-200 rounded-full h-2">
                                <div
                                  className={`h-full rounded-full ${
                                    st.percent >= 70 ? "bg-amber-500" : "bg-rose-500"
                                  }`}
                                  style={{ width: `${st.percent}%` }}
                                />
                              </div>
                              <span className="font-black text-xs text-slate-800 w-10 text-right">{st.percent}%</span>
                            </div>

                            {(st.bottleneck_reason || st.proposed_solution) && (
                              <div className="pt-2 border-t border-rose-200/60 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                                <div className="text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200/60">
                                  <strong className="text-slate-800 block text-[10px] uppercase">Nguyên nhân:</strong>
                                  {st.bottleneck_reason || "Đang phân tích"}
                                </div>
                                <div className="text-blue-900 bg-blue-50/60 p-2 rounded-lg border border-blue-200/60">
                                  <strong className="text-blue-900 block text-[10px] uppercase">Giải pháp kiến nghị:</strong>
                                  {st.proposed_solution || "Đang hoàn thiện"}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setModalPlan(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL XUẤT BÁO CÁO GIÁM SÁT ĐỊNH KỲ (CHUẨN HƯỚNG DẪN 05-HD/VPTW) */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">📄</span>
                <span className="font-bold text-sm">Dự Thảo Báo Cáo Giám Sát Nghị Quyết (Chuẩn Hướng Dẫn 05-HD/VPTW)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  🖨️ In Báo Cáo / Lưu PDF
                </button>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer text-base ml-2"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto bg-slate-50 font-serif text-slate-900 space-y-6 print:p-0 print:bg-white text-sm leading-relaxed">
              <div className="bg-white p-8 rounded-xl shadow-xs border border-slate-200 print:border-0 print:shadow-none space-y-5">
                <div className="flex justify-between items-start text-center">
                  <div className="w-5/12">
                    <div className="font-bold uppercase text-xs">ĐẢNG BỘ THÀNH PHỐ CẦN THƠ</div>
                    <div className="font-bold uppercase text-xs border-b border-black pb-1 inline-block">
                      ĐẢNG ỦY PHƯỜNG TRUNG NHỨT
                    </div>
                    <div className="text-[11px] mt-1 font-sans italic">Số: ...-BC/ĐU</div>
                  </div>
                  <div className="w-6/12">
                    <div className="font-bold uppercase text-xs">ĐẢNG CỘNG SẢN VIỆT NAM</div>
                    <div className="text-[11px] italic mt-1">
                      Trung Nhứt, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                    </div>
                  </div>
                </div>

                <div className="text-center pt-3 pb-2">
                  <div className="font-bold text-base uppercase">BÁO CÁO</div>
                  <div className="font-bold text-xs uppercase mt-0.5">
                    TÌNH HÌNH THỰC HIỆN CÁC NGHỊ QUYẾT, CHƯƠNG TRÌNH, KẾ HOẠCH CỦA CẤP ỦY
                  </div>
                  <div className="text-xs italic mt-0.5">(Trích xuất từ Hệ thống Quản trị & Giám sát dữ liệu số Đảng ủy phường)</div>
                </div>

                <div className="space-y-2">
                  <div className="font-bold">I. TỔNG QUAN TIẾN ĐỘ THỰC HIỆN CÁC KẾ HOẠCH CỦA ĐẢNG ỦY PHƯỜNG</div>
                  <p className="text-justify indent-6">
                    Hiện nay, Đảng ủy phường Trung Nhứt đang tập trung chỉ đạo điều hành <strong>{wardPlans.length} kế hoạch trọng tâm</strong> với tổng số <strong>{allSubTargets.length} chỉ tiêu cụ thể</strong>. Tỷ lệ hoàn thành bình quân chung của các kế hoạch đạt <strong>{Math.round(wardPlans.reduce((a, b) => a + b.target_percent, 0) / (wardPlans.length || 1))}%</strong>.
                  </p>
                  <ul className="list-disc pl-8 space-y-1">
                    {wardPlans.map(p => (
                      <li key={p.id}>
                        <strong>{p.doc_number}</strong>: {p.title} - Tiến độ đạt: <strong>{p.target_percent}%</strong>.
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="font-bold">II. TÌNH HÌNH CỤ THỂ HÓA VĂN BẢN CẤP TRÊN</div>
                  <p className="text-justify indent-6">
                    Tổng số văn bản cấp Trung ương và Thành ủy theo dõi là {counts.tw + counts.tu} văn bản. Trong đó, còn <strong>{bottleneckConcretize.length} văn bản chưa ban hành kế hoạch cụ thể hóa</strong> gồm:
                  </p>
                  {bottleneckConcretize.length > 0 ? (
                    <ul className="list-disc pl-8 space-y-0.5 text-rose-800">
                      {bottleneckConcretize.map(b => (
                        <li key={b.id}>{b.doc_number}: {b.title} ({b.issuer})</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="italic pl-6 text-emerald-800">100% văn bản cấp trên đã được Đảng ủy phường cụ thể hóa đầy đủ.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="font-bold">III. DANH MỤC ĐIỂM NGHẼN CHỈ TIÊU, NGUYÊN NHÂN VÀ KIẾN NGHỊ THÁO GỠ</div>
                  <p className="text-justify indent-6">
                    Qua rà soát số liệu thực tế, Đảng bộ phường hiện còn <strong>{uncompletedTargetList.length} chỉ tiêu chưa hoàn thành (đạt dưới 100%)</strong>. Văn phòng Đảng ủy tổng hợp nguyên nhân và đề xuất phương hướng xử lý như sau:
                  </p>

                  <table className="w-full border-collapse border border-black text-xs my-2">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-center">
                        <th className="border border-black p-1.5 w-10">STT</th>
                        <th className="border border-black p-1.5 w-24">Số Kế hoạch</th>
                        <th className="border border-black p-1.5">Tên chỉ tiêu & Khối chủ trì</th>
                        <th className="border border-black p-1.5 w-16">Tiến độ</th>
                        <th className="border border-black p-1.5">Nguyên nhân nghẽn</th>
                        <th className="border border-black p-1.5">Kiến nghị / Giải pháp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uncompletedTargetList.map(({ planDoc, target }, index) => (
                        <tr key={index}>
                          <td className="border border-black p-1.5 text-center">{index + 1}</td>
                          <td className="border border-black p-1.5 font-bold">{planDoc.doc_number}</td>
                          <td className="border border-black p-1.5">
                            <div>{target.name}</div>
                            <div className="italic text-[10px] text-slate-600">Chủ trì: {target.assignee || planDoc.agency_group}</div>
                          </td>
                          <td className="border border-black p-1.5 text-center font-bold text-red-700">{target.percent}%</td>
                          <td className="border border-black p-1.5">{target.bottleneck_reason || "Đang đôn đốc"}</td>
                          <td className="border border-black p-1.5">{target.proposed_solution || "Đang đề xuất"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-start pt-6">
                  <div className="text-xs italic space-y-0.5">
                    <div className="font-bold not-italic">Nơi nhận:</div>
                    <div>- Thường trực Đảng ủy;</div>
                    <div>- Ban Thường vụ Đảng ủy;</div>
                    <div>- Lưu: VT, VPĐU.</div>
                  </div>
                  <div className="text-center w-5/12 space-y-12">
                    <div>
                      <div className="font-bold uppercase text-xs">T/M THƯỜNG TRỰC ĐẢNG ỦY</div>
                      <div className="font-bold uppercase text-xs">BÍ THƯ</div>
                    </div>
                    <div className="font-bold text-xs">(Ký, đóng dấu và ghi rõ họ tên)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐĂNG NHẬP PHÂN QUYỀN */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="font-bold text-sm flex items-center gap-2">
                <span>🔐</span> Xác thực Quyền Quản trị / Nhập liệu
              </div>
              <button
                onClick={() => { setIsAuthModalOpen(false); setAuthError(""); setAuthPassword(""); }}
                className="text-slate-400 hover:text-white cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogin} className="p-6 space-y-4 text-xs">
              <div className="text-slate-600 leading-relaxed">
                Nhập mật khẩu để mở khóa <strong>Tab Nhập liệu văn bản</strong> và <strong>Tab Quản lý chỉ tiêu</strong>.
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mật khẩu:</label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Nhập mật khẩu quyền..."
                  value={authPassword}
                  onChange={(e) => { setAuthPassword(e.target.value); setAuthError(""); }}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {authError && (
                  <div className="text-rose-600 font-bold text-[11px] mt-1.5">⚠️ {authError}</div>
                )}
                <div className="text-[10px] text-slate-400 mt-2 space-y-0.5">
                  <div>• Quyền Nhập liệu: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold">Nhaplieu@2026</code></div>
                  <div>• Quyền Quản trị viên: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold">TrungNhut@2026</code></div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAuthModalOpen(false); setAuthError(""); setAuthPassword(""); }}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-100 font-medium transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-xl font-bold shadow-sm transition cursor-pointer"
                >
                  Xác nhận mở khóa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

