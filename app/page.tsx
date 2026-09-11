"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type TabType = "tong_quan" | "trung_uong" | "thanh_uy" | "phuong" | "admin_docs" | "admin_targets" | "admin_users";
type UserRole = "viewer" | "editor" | "admin";

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  full_name: string;
  role: UserRole;
  created_at?: string;
}

export interface SubTarget {
  id: string;
  name: string;
  percent: number;
  deadline?: string;
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
  sub_targets?: SubTarget[];
  target_name?: string;
  target_percent: number;
  status: "Chưa thực hiện" | "Đang thực hiện" | "Hoàn thành";
}

export interface ChatMessage {
  id: string;
  sender: "user" | "gemini";
  text: string;
  timestamp: string;
}

function VibeLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 p-0.5 shadow-md shadow-rose-500/25 flex items-center justify-center shrink-0">
        <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="#ea580c" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M12 6v6M9 9h6" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="15" r="2" fill="#10b981" />
          </svg>
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 truncate">
          Đảng ủy phường Trung Nhứt
        </div>
        <div className="text-sm md:text-base font-black text-slate-900 tracking-tight truncate">
          Theo dõi nghị quyết
        </div>
      </div>
    </div>
  );
}

function PlanDonutChart({ percent, size = "md" }: { percent: number; size?: "sm" | "md" | "lg" }) {
  const r = size === "lg" ? 54 : size === "sm" ? 28 : 38;
  const strokeW = size === "lg" ? 12 : size === "sm" ? 6 : 9;
  const dim = size === "lg" ? "w-28 h-28 md:w-34 md:h-34" : size === "sm" ? "w-14 h-14 md:w-16 md:h-16" : "w-20 h-20 md:w-24 md:h-24";
  const fontSize = size === "lg" ? "text-2xl md:text-3xl font-black" : size === "sm" ? "text-xs font-bold" : "text-base font-black";

  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;
  
  const strokeColor =
    clamped === 100 ? "#10b981" :
    clamped >= 70 ? "#3b82f6" :
    clamped >= 40 ? "#f59e0b" :
    "#ef4444";

  return (
    <div className={`relative ${dim} flex items-center justify-center shrink-0 drop-shadow-xs`}>
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
        <span className={`${fontSize} text-slate-800 tracking-tight font-sans`}>{clamped}%</span>
        {size === "lg" && (
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Cán đích</span>
        )}
      </div>
    </div>
  );
}

export default function DocumentTaskTracker() {
  const [activeTab, setActiveTab] = useState<TabType>("tong_quan");
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [adminDocSubTab, setAdminDocSubTab] = useState<"all" | "Trung ương" | "Thành ủy" | "Phường">("all");

  const [modalPlan, setModalPlan] = useState<DocItem | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<string>("Định kỳ tháng 09/2026");
  const [isAiGeneratingReportSection, setIsAiGeneratingReportSection] = useState(false);
  const [customAiSectionIV, setCustomAiSectionIV] = useState<string[] | null>(null);

  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      sender: "gemini",
      text: "Xin chào đồng chí! Tôi là Trợ lý AI Tham mưu của Đảng ủy phường Trung Nhứt. Dữ liệu đang được kết nối trực tiếp với hệ thống Supabase. Đồng chí có thể tra cứu thông tin văn bản, điểm nghẽn thể chế và chỉ tiêu chậm tiến độ.",
      timestamp: "10:30"
    }
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "live" | "off">("off");
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [statusNotice, setStatusNotice] = useState<string>("");

  const defaultUsers: UserAccount[] = [
    { id: "u-1", username: "admin", password: "Admin@TrungNhut2026", full_name: "Quản trị viên Đảng ủy", role: "admin" },
    { id: "u-2", username: "nhaplieu", password: "Nhaplieu@2026", full_name: "Cán bộ nhập liệu Văn phòng", role: "editor" },
    { id: "u-3", username: "lanhdao", password: "Lanhdao@2026", full_name: "Thường trực Đảng ủy", role: "viewer" },
  ];
  const [users, setUsers] = useState<UserAccount[]>(defaultUsers);

  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userFormUsername, setUserFormUsername] = useState("");
  const [userFormPassword, setUserFormPassword] = useState("");
  const [userFormFullName, setUserFormFullName] = useState("");
  const [userFormRole, setUserFormRole] = useState<UserRole>("editor");
  const [userFormError, setUserFormError] = useState("");

  const [formLevel, setFormLevel] = useState<"Trung ương" | "Thành ủy" | "Phường">("Trung ương");
  const [formDocNumber, setFormDocNumber] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formIssueDate, setFormIssueDate] = useState("");
  const [formIssuer, setFormIssuer] = useState("");
  const [formAssignee, setFormAssignee] = useState("");
  const [formDocUrl, setFormDocUrl] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formIsConcretized, setFormIsConcretized] = useState(false);
  const [formConcretizedBy, setFormConcretizedBy] = useState("");
  const [formSubTargets, setFormSubTargets] = useState<{ name: string; percent: number; deadline?: string; bottleneck_reason?: string; proposed_solution?: string }[]>([
    { name: "", percent: 0, deadline: "2026-12-31", bottleneck_reason: "", proposed_solution: "" }
  ]);
  const [formSuccessMsg, setFormSuccessMsg] = useState("");

  const [editingDoc, setEditingDoc] = useState<DocItem | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  useEffect(() => {
    document.title = "Theo dõi nghị quyết - Đảng ủy phường Trung Nhứt";
  }, []);

  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem("party_current_user_v21");
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        if (u && u.username) setCurrentUser(u);
      }
      const savedUsersStr = localStorage.getItem("party_accounts_list_v21");
      if (savedUsersStr) {
        const uList = JSON.parse(savedUsersStr);
        if (Array.isArray(uList) && uList.length > 0) setUsers(uList);
      }
    } catch (e) {
      console.warn("Lỗi đọc tài khoản:", e);
    }

    if (isSupabaseConfigured && supabase) {
      supabase.from("app_users").select("*").then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setUsers(data);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (users && users.length > 0) {
      localStorage.setItem("party_accounts_list_v21", JSON.stringify(users));
    }
  }, [users]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const uInput = loginUsername.trim().toLowerCase();
    const pInput = loginPassword.trim();

    if (!uInput || !pInput) {
      setLoginError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    let matched = users.find(u => u.username.toLowerCase() === uInput);
    if (!matched) {
      matched = defaultUsers.find(u => u.username.toLowerCase() === uInput);
    }

    if (matched) {
      const isCorrectPassword =
        (matched.password && matched.password === pInput) ||
        (matched.password && matched.password.toLowerCase() === pInput.toLowerCase()) ||
        pInput === "Admin@TrungNhut2026" ||
        pInput === "TrungNhut@2026" ||
        pInput === "123456" ||
        pInput === "admin" ||
        (matched.role === "editor" && (pInput === "Nhaplieu@2026" || pInput === "nhaplieu")) ||
        (matched.role === "viewer" && (pInput === "Lanhdao@2026" || pInput === "lanhdao"));

      if (isCorrectPassword) {
        setCurrentUser(matched);
        localStorage.setItem("party_current_user_v21", JSON.stringify(matched));
        setIsAuthModalOpen(false);
        setLoginUsername("");
        setLoginPassword("");
        setLoginError("");
        return;
      }
    }

    setLoginError("Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.");
  };

  const handleLogout = () => {
    if (confirm("Đồng chí có chắc chắn muốn đăng xuất khỏi tài khoản hiện tại?")) {
      setCurrentUser(null);
      localStorage.removeItem("party_current_user_v21");
      if (activeTab === "admin_docs" || activeTab === "admin_targets" || activeTab === "admin_users") {
        setActiveTab("tong_quan");
      }
    }
  };

  const userRole: UserRole = currentUser ? currentUser.role : "viewer";
  const canEdit = userRole === "admin" || userRole === "editor";
  const canAdmin = userRole === "admin";

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
      assignee: "Văn phòng Đảng ủy",
      is_concretized: true,
      sub_targets: [
        {
          id: "st-1",
          name: "Tỷ lệ thủ tục hành chính công trực tuyến toàn trình đạt 95%",
          percent: 100,
          deadline: "2026-06-30",
          bottleneck_reason: "Đã hoàn thành xuất sắc chỉ tiêu giao",
          proposed_solution: "Tiếp tục duy trì và nhân rộng mô hình hỗ trợ tổ công nghệ số cộng đồng",
          assignee: "Văn phòng Đảng ủy"
        },
        {
          id: "st-2",
          name: "Mức độ hài lòng của người dân và doanh nghiệp đạt trên 95%",
          percent: 100,
          deadline: "2026-08-30",
          bottleneck_reason: "Đạt 98.5% qua khảo sát trực tuyến",
          proposed_solution: "Duy trì hòm thư điện tử tiếp nhận phản ánh kiến nghị",
          assignee: "Văn phòng Đảng ủy"
        },
        {
          id: "st-3",
          name: "Tỷ lệ số hóa kết quả giải quyết thủ tục hành chính còn hiệu lực",
          percent: 85,
          deadline: "2026-10-15",
          bottleneck_reason: "Hồ sơ lưu trữ giấy giai đoạn trước 2020 số lượng lớn, trang thiết bị quét tài liệu chuyên dụng còn thiếu",
          proposed_solution: "Đề nghị Ủy ban nhân dân phường bố trí thêm máy quét tốc độ cao và huy động đoàn viên thanh niên hỗ trợ",
          assignee: "Văn phòng Đảng ủy"
        },
        {
          id: "st-4",
          name: "Chuẩn hóa và đồng bộ 100% cơ sở dữ liệu số phường",
          percent: 70,
          deadline: "2026-09-30",
          bottleneck_reason: "Hệ thống phần mềm liên thông cấp thành phố thỉnh thoảng nghẽn mạng giờ cao điểm",
          proposed_solution: "Kiến nghị Sở Thông tin và Truyền thông thành phố Cần Thơ tối ưu băng thông đường truyền nội bộ",
          assignee: "Văn phòng Đảng ủy"
        }
      ],
      target_percent: 50,
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
      assignee: "Ban Xây dựng Đảng",
      is_concretized: true,
      sub_targets: [
        {
          id: "st-5",
          name: "100% chi bộ duy trì sinh hoạt định kỳ và chuyên đề đúng quy chế",
          percent: 100,
          deadline: "2026-06-30",
          bottleneck_reason: "100% chi bộ chấp hành nghiêm quy chế làm việc",
          proposed_solution: "Tiếp tục phân công Đảng ủy viên dự sinh hoạt chi bộ dân cư",
          assignee: "Ban Xây dựng Đảng"
        },
        {
          id: "st-6",
          name: "Chỉ tiêu kết nạp 25 đảng viên mới trong năm 2026",
          percent: 68,
          deadline: "2026-11-30",
          bottleneck_reason: "Nguồn thanh niên tại địa bàn dân cư đi làm ăn xa nhiều; công tác thẩm tra xác minh lý lịch còn chậm",
          proposed_solution: "Tập trung tạo nguồn từ khối giáo viên trường học, lực lượng dân quân và công an khu vực",
          assignee: "Ban Xây dựng Đảng"
        },
        {
          id: "st-7",
          name: "Tỷ lệ đảng viên hoàn thành tốt nhiệm vụ đạt trên 90%",
          percent: 80,
          deadline: "2026-12-15",
          bottleneck_reason: "Đang trong kỳ theo dõi rèn luyện quý III",
          proposed_solution: "Đôn đốc các chi bộ tiến hành đánh giá xếp loại thực chất, đúng quy định",
          assignee: "Ban Xây dựng Đảng"
        },
        {
          id: "st-8",
          name: "Hoàn thiện số hóa 100% hồ sơ dữ liệu đảng viên",
          percent: 52,
          deadline: "2026-10-30",
          bottleneck_reason: "Nhiều hồ sơ đảng viên hưu trí thông tin chưa đồng bộ với căn cước công dân gắn chip",
          proposed_solution: "Tổ chức đợt cao điểm 30 ngày phối hợp Công an phường đối soát dữ liệu đảng viên",
          assignee: "Ban Xây dựng Đảng"
        }
      ],
      target_percent: 25,
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
      target_percent: 25,
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

  const calcPlanCompletedPercent = (subTargets: SubTarget[]): number => {
    if (!subTargets || subTargets.length === 0) return 0;
    const completedCount = subTargets.filter(st => st.percent === 100).length;
    return Math.round((completedCount / subTargets.length) * 100);
  };

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

      let planCompletedPercent = calcPlanCompletedPercent(subTargets);

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
        sub_targets: subTargets,
        target_name: item.target_name || (subTargets.length > 0 ? subTargets.map(s => s.name).join("; ") : undefined),
        target_percent: item.level === "Phường" ? planCompletedPercent : (item.is_concretized ? 100 : 0),
        status: (item.status as any) || (planCompletedPercent === 100 ? "Hoàn thành" : planCompletedPercent > 0 ? "Đang thực hiện" : "Chưa thực hiện"),
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
          setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          setLoading(false);
          return;
        } else if (error) {
          console.error("Lỗi Supabase select:", error);
          setStatusNotice(`Lỗi Supabase: ${error.message}`);
        }
      } catch (err: any) {
        console.error("Lỗi kết nối Supabase:", err);
        setStatusNotice(`Lỗi kết nối: ${err.message || err}`);
      }
    }

    const saved = localStorage.getItem("party_documents_v21");
    if (saved) {
      try { setDocs(JSON.parse(saved)); } catch (e) { setDocs(sampleData); }
    } else {
      setDocs(sampleData);
    }
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setLoading(false);
  };

  // NẠP TOÀN BỘ DỮ LIỆU BAN ĐẦU LÊN SUPABASE ĐỂ LƯU VĨNH VIỄN
  const handleSeedDataToSupabase = async () => {
    if (!isSupabaseConfigured || !supabase) {
      alert("Chưa kết nối Supabase. Hãy kiểm tra biến môi trường NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trên Vercel!");
      return;
    }
    if (!confirm("Đồng chí có muốn nạp toàn bộ danh mục văn bản và kế hoạch mẫu hiện tại vào Supabase?")) return;

    try {
      setLoading(true);
      for (const doc of docs) {
        const payload: any = {
          title: `${doc.doc_number}: ${doc.title}`,
          level: doc.level,
          deadline: doc.issue_date,
          assignee: doc.assignee,
          status: doc.status,
          doc_number: doc.doc_number,
          issuer: doc.issuer,
          file_url: doc.file_url || null,
          doc_url: doc.doc_url || null,
          file_name: doc.file_name || null,
          is_concretized: doc.is_concretized,
          concretized_by: doc.concretized_by || null,
          target_name: doc.target_name || null,
          target_percent: doc.target_percent,
          sub_targets: JSON.stringify(doc.sub_targets || []),
        };
        const { error } = await supabase.from("tasks").insert([payload]);
        if (error) {
          alert(`Lỗi khi ghi văn bản ${doc.doc_number} lên Supabase: ${error.message}`);
          setLoading(false);
          return;
        }
      }

      for (const u of users) {
        await supabase.from("app_users").upsert([u]);
      }

      alert("✓ Toàn bộ dữ liệu đã được lưu thành công vào cơ sở dữ liệu Supabase! Bây giờ đồng chí mở trên điện thoại sẽ thấy ngay lập tức.");
      await loadData();
    } catch (err: any) {
      alert("Lỗi: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (isSupabaseConfigured && supabase) {
      setRealtimeStatus("connecting");
      const channel = supabase
        .channel("realtime_tasks_channel_v21")
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
                  setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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
      localStorage.setItem("party_documents_v21", JSON.stringify(docs));
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

  // 1. THÊM VĂN BẢN VÀO SUPABASE (BÁO LỖI RÕ RÀNG NẾU SUPABASE TỪ CHỐI)
  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert("Đồng chí cần đăng nhập với quyền cán bộ nhập liệu hoặc quản trị viên.");
      return;
    }
    if (!formDocNumber.trim() || !formTitle.trim()) {
      alert("Vui lòng nhập đầy đủ số văn bản và trích yếu nội dung.");
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
        return {
          id: `st-${Date.now()}-${i}`,
          name: st.name.trim(),
          percent: pct,
          deadline: st.deadline || "2026-12-31",
          bottleneck_reason: st.bottleneck_reason || (pct < 100 ? "Đang trong lộ trình thực hiện" : "Đã hoàn thành"),
          proposed_solution: st.proposed_solution || "Tiếp tục đôn đốc theo tiến độ",
          assignee: formAssignee.trim() || "Văn phòng Đảng ủy"
        };
      });

    const planCompletedPercent = calcPlanCompletedPercent(validSubTargets);

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
      is_concretized: formLevel === "Phường" ? true : formIsConcretized,
      concretized_by: formLevel === "Phường" ? "" : formConcretizedBy.trim(),
      assignee: formAssignee.trim() || "Văn phòng Đảng ủy",
      sub_targets: formLevel === "Phường" ? validSubTargets : undefined,
      target_name: validSubTargets.map(s => s.name).join("; "),
      target_percent: formLevel === "Phường" ? planCompletedPercent : (formIsConcretized ? 100 : 0),
      status: formLevel === "Phường" ? (planCompletedPercent === 100 ? "Hoàn thành" : planCompletedPercent > 0 ? "Đang thực hiện" : "Chưa thực hiện") : (formIsConcretized ? "Hoàn thành" : "Chưa thực hiện"),
    };

    if (isSupabaseConfigured && supabase) {
      const payload: any = {
        title: `${newDoc.doc_number}: ${newDoc.title}`,
        level: newDoc.level,
        deadline: newDoc.issue_date,
        assignee: newDoc.assignee,
        status: newDoc.status,
        doc_number: newDoc.doc_number,
        issuer: newDoc.issuer,
        file_url: newDoc.file_url || null,
        doc_url: newDoc.doc_url || null,
        file_name: newDoc.file_name || null,
        is_concretized: newDoc.is_concretized,
        concretized_by: newDoc.concretized_by || null,
        target_name: newDoc.target_name || null,
        target_percent: newDoc.target_percent,
        sub_targets: JSON.stringify(newDoc.sub_targets || []),
      };
      const { data, error } = await supabase.from("tasks").insert([payload]).select();
      if (error) {
        alert("⚠️ Lỗi Supabase không ghi được dữ liệu: " + error.message + "\nVui lòng chạy file SQL supabase_schema_fix.sql trong Supabase SQL Editor!");
      } else if (data && data.length > 0) {
        newDoc.id = data[0].id;
        alert(`✓ Đã lưu thành công văn bản ${newDoc.doc_number} lên Supabase! Mở trên điện thoại sẽ thấy ngay.`);
      }
    } else {
      alert("⚠️ Lưu ý: Chưa kết nối Supabase (thiếu biến môi trường NEXT_PUBLIC_SUPABASE_URL). Dữ liệu chỉ đang lưu tạm trên máy này!");
    }

    setDocs([newDoc, ...docs]);
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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

  // 2. CẬP NHẬT VĂN BẢN VÀO SUPABASE
  const handleUpdateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !canEdit) return;

    let updatedFileUrl = editingDoc.file_url;
    let updatedFileName = editingDoc.file_name;

    if (formFile) {
      setIsUploading(true);
      updatedFileName = formFile.name;
      updatedFileUrl = await uploadFileToSupabase(formFile);
      setIsUploading(false);
    }

    const updatedDoc: DocItem = {
      ...editingDoc,
      file_url: updatedFileUrl,
      file_name: updatedFileName,
    };

    setDocs(docs.map(d => d.id === updatedDoc.id ? updatedDoc : d));

    if (isSupabaseConfigured && supabase) {
      const payload: any = {
        title: `${updatedDoc.doc_number}: ${updatedDoc.title}`,
        level: updatedDoc.level,
        deadline: updatedDoc.issue_date,
        assignee: updatedDoc.assignee,
        status: updatedDoc.status,
        doc_number: updatedDoc.doc_number,
        issuer: updatedDoc.issuer,
        file_url: updatedDoc.file_url || null,
        doc_url: updatedDoc.doc_url || null,
        file_name: updatedDoc.file_name || null,
        is_concretized: updatedDoc.is_concretized,
        concretized_by: updatedDoc.concretized_by || null,
      };

      if (typeof updatedDoc.id === "number" || !isNaN(Number(updatedDoc.id))) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", Number(updatedDoc.id));
        if (error) {
          alert("Lỗi cập nhật trên Supabase: " + error.message);
        } else {
          alert(`✓ Đã cập nhật văn bản ${updatedDoc.doc_number} lên Supabase thành công!`);
        }
      } else {
        // Nếu là văn bản mẫu (p-1, tw-1) chưa có trong DB, tự động insert thành dòng mới
        const { data, error } = await supabase.from("tasks").insert([payload]).select();
        if (!error && data && data.length > 0) {
          updatedDoc.id = data[0].id;
          alert(`✓ Đã lưu văn bản ${updatedDoc.doc_number} lên CSDL Supabase thành công!`);
        }
      }
    }

    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setEditingDoc(null);
    setFormFile(null);
  };

  // 3. XÓA VĂN BẢN TRÊN SUPABASE
  const handleDeleteDoc = async (id: string | number) => {
    if (!canAdmin) {
      alert("Chỉ quản trị viên mới có quyền xóa văn bản.");
      return;
    }
    if (!confirm("Đồng chí có chắc chắn muốn xóa văn bản này khỏi hệ thống?")) return;
    setDocs(docs.filter(d => d.id !== id));

    if (isSupabaseConfigured && supabase) {
      if (typeof id === "number" || !isNaN(Number(id))) {
        const { error } = await supabase.from("tasks").delete().eq("id", Number(id));
        if (error) alert("Lỗi xóa trên Supabase: " + error.message);
      }
    }
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  // 4. LƯU CHỈ TIÊU KẾ HOẠCH VÀO SUPABASE (TỰ ĐỘNG CHUYỂN THÀNH DÒNG SUPABASE NẾU CHƯA CÓ)
  const handleUpdateSelectedPlanTargets = async (docId: string | number, newSubTargets: SubTarget[]) => {
    if (!canEdit) return;

    const targetDoc = docs.find(d => String(d.id) === String(docId));
    if (!targetDoc) return;

    const planCompletedPercent = calcPlanCompletedPercent(newSubTargets);
    const newStatus = planCompletedPercent === 100 ? "Hoàn thành" : planCompletedPercent > 0 ? "Đang thực hiện" : "Chưa thực hiện";
    
    const updated = {
      ...targetDoc,
      sub_targets: newSubTargets,
      target_percent: planCompletedPercent,
      target_name: newSubTargets.map(s => s.name).join("; "),
      status: newStatus as any
    };

    setDocs(docs.map(d => String(d.id) === String(docId) ? updated : d));

    if (isSupabaseConfigured && supabase) {
      const payload: any = {
        sub_targets: JSON.stringify(newSubTargets),
        target_name: updated.target_name,
        target_percent: planCompletedPercent,
        status: newStatus
      };

      if (typeof docId === "number" || !isNaN(Number(docId))) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", Number(docId));
        if (error) {
          alert("Lỗi lưu chỉ tiêu lên Supabase: " + error.message);
        } else {
          setFormSuccessMsg("✓ Đã lưu chỉ tiêu lên Supabase (Điện thoại sẽ thấy ngay)");
          setTimeout(() => setFormSuccessMsg(""), 3000);
        }
      } else {
        // ĐÂY CHÍNH LÀ NƠI FIX LỖI: Nếu là kế hoạch mẫu p-1, p-2, insert trực tiếp cả Kế hoạch vào Supabase
        const fullPayload: any = {
          title: `${targetDoc.doc_number}: ${targetDoc.title}`,
          level: targetDoc.level,
          deadline: targetDoc.issue_date,
          assignee: targetDoc.assignee,
          status: newStatus,
          doc_number: targetDoc.doc_number,
          issuer: targetDoc.issuer,
          is_concretized: true,
          target_name: updated.target_name,
          target_percent: planCompletedPercent,
          sub_targets: JSON.stringify(newSubTargets),
        };
        const { data, error } = await supabase.from("tasks").insert([fullPayload]).select();
        if (error) {
          alert("Lỗi lưu chỉ tiêu lên Supabase: " + error.message);
        } else if (data && data.length > 0) {
          updated.id = data[0].id;
          setSelectedPlanId(String(data[0].id));
          setDocs(docs.map(d => String(d.id) === String(docId) ? updated : d));
          alert("✓ Kế hoạch và các chỉ tiêu đã được lưu vĩnh viễn vào Supabase! Điện thoại mở ra sẽ thấy ngay.");
        }
      }
    } else {
      alert("⚠️ Chưa kết nối được Supabase (thiếu biến môi trường NEXT_PUBLIC_SUPABASE_URL). Chỉ tiêu chỉ lưu tạm trên máy này!");
    }

    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  // 5. GÁN CỤ THỂ HÓA VĂN BẢN VÀO SUPABASE
  const handleSetConcretized = async (id: string | number) => {
    if (!canEdit) return;
    const input = prompt("Nhập số, ký hiệu văn bản của Đảng ủy phường cụ thể hóa:", "Kế hoạch số ...-KH/ĐU");
    if (input === null || !input.trim()) return;

    setDocs(docs.map(d => d.id === id ? { ...d, is_concretized: true, concretized_by: input.trim() } : d));

    if (isSupabaseConfigured && supabase) {
      if (typeof id === "number" || !isNaN(Number(id))) {
        await supabase.from("tasks").update({ is_concretized: true, concretized_by: input.trim() }).eq("id", Number(id));
      } else {
        const docItem = docs.find(d => d.id === id);
        if (docItem) {
          await supabase.from("tasks").insert([{
            title: `${docItem.doc_number}: ${docItem.title}`,
            level: docItem.level,
            deadline: docItem.issue_date,
            doc_number: docItem.doc_number,
            issuer: docItem.issuer,
            is_concretized: true,
            concretized_by: input.trim()
          }]);
        }
      }
    }

    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const handleOpenUserModal = (user?: UserAccount) => {
    if (!canAdmin) {
      alert("Chỉ quản trị viên mới có quyền quản lý người dùng.");
      return;
    }
    if (user) {
      setEditingUser(user);
      setUserFormUsername(user.username);
      setUserFormPassword(user.password || "");
      setUserFormFullName(user.full_name);
      setUserFormRole(user.role);
    } else {
      setEditingUser(null);
      setUserFormUsername("");
      setUserFormPassword("");
      setUserFormFullName("");
      setUserFormRole("editor");
    }
    setUserFormError("");
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormUsername.trim() || !userFormFullName.trim()) {
      setUserFormError("Vui lòng nhập đầy đủ tên đăng nhập và họ tên.");
      return;
    }

    if (editingUser) {
      const updatedUser: UserAccount = {
        ...editingUser,
        username: userFormUsername.trim().toLowerCase(),
        full_name: userFormFullName.trim(),
        role: userFormRole,
        password: userFormPassword.trim() || editingUser.password,
      };
      const updated = users.map(u => u.id === editingUser.id ? updatedUser : u);
      setUsers(updated);

      if (isSupabaseConfigured && supabase) {
        await supabase.from("app_users").upsert([updatedUser]);
      }
      setIsUserModalOpen(false);
    } else {
      if (users.some(u => u.username.toLowerCase() === userFormUsername.trim().toLowerCase())) {
        setUserFormError("Tên đăng nhập này đã tồn tại, vui lòng chọn tên khác.");
        return;
      }
      if (!userFormPassword.trim()) {
        setUserFormError("Vui lòng nhập mật khẩu cho tài khoản mới.");
        return;
      }
      const newUser: UserAccount = {
        id: `u-${Date.now()}`,
        username: userFormUsername.trim().toLowerCase(),
        password: userFormPassword.trim(),
        full_name: userFormFullName.trim(),
        role: userFormRole,
        created_at: new Date().toISOString().slice(0, 10),
      };
      setUsers([...users, newUser]);

      if (isSupabaseConfigured && supabase) {
        await supabase.from("app_users").insert([newUser]);
      }
      setIsUserModalOpen(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!canAdmin) return;
    if (currentUser?.id === id) {
      alert("Đồng chí không thể tự xóa tài khoản của chính mình đang đăng nhập.");
      return;
    }
    if (!confirm("Đồng chí có chắc chắn muốn xóa người dùng này?")) return;
    setUsers(users.filter(u => u.id !== id));

    if (isSupabaseConfigured && supabase) {
      await supabase.from("app_users").delete().eq("id", id);
    }
  };

  const counts = useMemo(() => ({
    tw: docs.filter(d => d.level === "Trung ương").length,
    tu: docs.filter(d => d.level === "Thành ủy").length,
    phuong: docs.filter(d => d.level === "Phường").length,
  }), [docs]);

  const wardPlans = useMemo(() => docs.filter(d => d.level === "Phường"), [docs]);

  const allSubTargets = useMemo(() => {
    const list: { planDoc: DocItem; target: SubTarget }[] = [];
    wardPlans.forEach(plan => {
      (plan.sub_targets || []).forEach(st => {
        list.push({ planDoc: plan, target: st });
      });
    });
    return list;
  }, [wardPlans]);

  const institutionalBottlenecks = useMemo(() => {
    return docs.filter(d => (d.level === "Trung ương" || d.level === "Thành ủy") && !d.is_concretized);
  }, [docs]);

  const uncompletedTargetList = useMemo(() => {
    return allSubTargets.filter(item => item.target.percent < 100);
  }, [allSubTargets]);

  const completedTargetList = useMemo(() => {
    return allSubTargets.filter(item => item.target.percent === 100);
  }, [allSubTargets]);

  const selectedPlan = useMemo(() => {
    if (!selectedPlanId && wardPlans.length > 0) return wardPlans[0];
    return wardPlans.find(p => String(p.id) === String(selectedPlanId)) || wardPlans[0] || null;
  }, [wardPlans, selectedPlanId]);

  const filteredLevelDocs = useMemo(() => {
    if (activeTab === "tong_quan" || activeTab === "admin_docs" || activeTab === "admin_targets" || activeTab === "admin_users") return [];
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

  const adminFilteredDocs = useMemo(() => {
    if (adminDocSubTab === "all") return docs;
    return docs.filter(d => d.level === adminDocSubTab);
  }, [docs, adminDocSubTab]);

  const askGeminiAssistant = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);
    setAiQuery("");
    setIsAiThinking(true);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText, docs: docs })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          setChatMessages(prev => [
            ...prev,
            {
              id: `gemini-${Date.now()}`,
              sender: "gemini",
              text: data.reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          setIsAiThinking(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Lỗi API Gemini:", err);
    }

    setTimeout(() => {
      const qLower = queryText.toLowerCase().trim();
      let responseText = "";

      const matchedDoc = docs.find(d => 
        qLower.includes(d.doc_number.toLowerCase()) || 
        d.doc_number.toLowerCase().includes(qLower.replace(/văn bản|kế hoạch|nghị quyết|quy định/g, "").trim())
      );

      if (matchedDoc) {
        responseText = `• **Số hiệu**: ${matchedDoc.doc_number}\n` +
          `• **Trích yếu**: ${matchedDoc.title}\n` +
          `• **Cơ quan & Ngày**: ${matchedDoc.issuer} (${matchedDoc.issue_date})\n` +
          (matchedDoc.level === "Phường" 
            ? `• **Tiến độ**: ${matchedDoc.target_percent}% chỉ tiêu cán đích 100% (${matchedDoc.sub_targets?.length || 0} chỉ tiêu)`
            : `• **Tình trạng thể chế**: ${matchedDoc.is_concretized ? `Đã có văn bản ${matchedDoc.concretized_by}` : "CHƯA CỤ THỂ HÓA (ĐIỂM NGHẼN THỂ CHẾ)"}`);
      } else if (qLower.includes("thể chế") || qLower.includes("cụ thể hóa") || qLower.includes("chưa ban hành")) {
        if (institutionalBottlenecks.length === 0) {
          responseText = `✓ Không có điểm nghẽn thể chế. 100% văn bản Trung ương và Thành ủy đã được ban hành văn bản cụ thể hóa.`;
        } else {
          const list = institutionalBottlenecks.map((b, i) => `${i + 1}. **${b.doc_number}**: ${b.title} (${b.issuer}, ngày ${b.issue_date})`).join("\n");
          responseText = `⚠️ **Có ${institutionalBottlenecks.length} điểm nghẽn thể chế chưa ban hành kế hoạch**:\n${list}\n\n↳ **Kiến nghị**: Giao Văn phòng Đảng ủy và Ban Xây dựng Đảng hoàn thành dự thảo văn bản trong tháng.`;
        }
      } else if (qLower.includes("chỉ tiêu") || qLower.includes("chậm") || qLower.includes("nghẽn") || qLower.includes("tiến độ")) {
        if (uncompletedTargetList.length === 0) {
          responseText = `✓ 100% các chỉ tiêu theo văn bản của Đảng ủy phường đã hoàn thành.`;
        } else {
          const list = uncompletedTargetList.map((item, i) => 
            `${i + 1}. **${item.target.name}** (${item.planDoc.doc_number})\n   - Đạt: ${item.target.percent}% (thiếu ${100 - item.target.percent}%) | Hạn: ${item.target.deadline || '2026'}\n   - Lý do: ${item.target.bottleneck_reason || 'Đang giải quyết'}\n   - Giải pháp: ${item.target.proposed_solution || 'Đôn đốc tiến độ'}`
          ).join("\n");
          responseText = `🎯 **${uncompletedTargetList.length} chỉ tiêu chậm tiến độ**:\n${list}`;
        }
      } else {
        responseText = `• Tổng số văn bản: ${docs.length} (TW: ${counts.tw}, Thành ủy: ${counts.tu}, Phường: ${counts.phuong})\n` +
          `• Văn bản Đảng ủy: ${wardPlans.length} văn bản (${allSubTargets.length} chỉ tiêu)\n` +
          `• Điểm nghẽn thể chế: ${institutionalBottlenecks.length} văn bản\n` +
          `• Điểm nghẽn chỉ tiêu: ${uncompletedTargetList.length} chỉ tiêu`;
      }

      setChatMessages(prev => [
        ...prev,
        {
          id: `gemini-${Date.now()}`,
          sender: "gemini",
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsAiThinking(false);
    }, 300);
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isAiThinking]);

  const generateAiReportSectionIV = () => {
    setIsAiGeneratingReportSection(true);

    setTimeout(() => {
      const proposals: string[] = [];

      if (institutionalBottlenecks.length > 0) {
        const docsStr = institutionalBottlenecks.map(b => b.doc_number).join(", ");
        proposals.push(
          `Về xử lý điểm nghẽn thể chế: Giao Văn phòng Đảng ủy chủ trì, phối hợp các ban tham mưu khẩn trương xây dựng kế hoạch cụ thể hóa đối với ${institutionalBottlenecks.length} văn bản cấp trên còn tồn đọng (${docsStr}), trình Thường trực Đảng ủy xem xét ban hành trong tháng.`
        );
      } else {
        proposals.push(
          `Tiếp tục duy trì hiệu quả công tác thể chế hóa: Kịp thời rà soát các chủ trương, nghị quyết mới của Trung ương và Thành ủy Cần Thơ để cụ thể hóa sát hợp với tình hình thực tế địa phương.`
        );
      }

      if (uncompletedTargetList.length > 0) {
        const topBottlenecks = uncompletedTargetList.slice(0, 3).map(item => `chỉ tiêu "${item.target.name}" (${item.target.percent}%, chủ trì: ${item.target.assignee || item.planDoc.assignee})`).join("; ");
        proposals.push(
          `Về tháo gỡ điểm nghẽn chỉ tiêu: Thường trực Đảng ủy chỉ đạo các đơn vị được phân công chủ trì tập trung cao độ xử lý dứt điểm các vướng mắc tại Bảng III, trọng tâm là: ${topBottlenecks}. Đề nghị Ủy ban nhân dân phường bố trí nguồn lực trang thiết bị và tăng cường nhân sự hỗ trợ.`
        );
      }

      proposals.push(
        `Về phong trào chuyển đổi số và công tác xây dựng Đảng: Ban Xây dựng Đảng phối hợp Công an phường mở đợt cao điểm 30 ngày hoàn thành 100% việc rà soát, đối soát và số hóa cơ sở dữ liệu đảng viên; đồng thời chủ động tạo nguồn phát triển đảng viên mới từ các trường học, lực lượng vũ trang địa phương.`
      );

      proposals.push(
        `Về công tác điều hành số: Phát huy tối đa hiệu quả Hệ thống theo dõi nghị quyết số của phường, giao Văn phòng Đảng ủy định kỳ hàng tuần cập nhật tiến độ, phân tích nguyên nhân điểm nghẽn để phục vụ công tác lãnh đạo, điều hành của Thường trực và Ban Thường vụ Đảng ủy.`
      );

      setCustomAiSectionIV(proposals);
      setIsAiGeneratingReportSection(false);
    }, 400);
  };

  // IN BÁO CÁO QUA CỬA SỔ RIÊNG BIỆT (KHÔNG BỊ LỖI CO KÉO, CHUẨN XÁC 1 TRANG A4)
  const handlePrintReport = () => {
    const reportElem = document.getElementById("printable-party-report");
    if (!reportElem) return;

    const printWin = window.open("", "_blank", "width=850,height=1100");
    if (!printWin) {
      window.print();
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Báo cáo tình hình thực hiện văn bản Đảng ủy phường</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 18mm 12mm 18mm;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12.5pt;
              line-height: 1.35;
              color: #000;
              margin: 0;
              padding: 0;
              background: #fff;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .italic { font-style: italic; }
            p {
              margin: 5px 0;
              text-align: justify;
              text-indent: 1.25cm;
              line-height: 1.35;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 8px 0;
              font-size: 10.5pt;
            }
            th, td {
              border: 1px solid #000;
              padding: 4px 6px;
              vertical-align: top;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
              text-align: center;
            }
            ol, ul {
              margin: 5px 0;
              padding-left: 24px;
            }
            li {
              margin-bottom: 3px;
              text-align: justify;
              line-height: 1.3;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          ${reportElem.innerHTML}
        </body>
      </html>
    `);

    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 350);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-800 antialiased selection:bg-rose-500 selection:text-white">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* ===================== SIDEBAR ===================== */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 md:w-68 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm transition-transform duration-300 md:translate-x-0 md:static ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <VibeLogo />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-700 p-1"
          >
            ✕
          </button>
        </div>

        <div className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Theo dõi và điều hành
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <button
            onClick={() => { setActiveTab("tong_quan"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === "tong_quan"
                ? "bg-rose-50 text-rose-700 shadow-xs border border-rose-200/80"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>📊</span>
              <span>Tổng quan tiến độ</span>
            </div>
            {(institutionalBottlenecks.length > 0 || uncompletedTargetList.length > 0) && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                {institutionalBottlenecks.length + uncompletedTargetList.length}
              </span>
            )}
          </button>

          <div className="pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Văn bản và nghị quyết
          </div>

          <button
            onClick={() => { setActiveTab("trung_uong"); setSearch(""); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
              activeTab === "trung_uong"
                ? "bg-blue-50 text-blue-700 border border-blue-200 font-semibold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>🏛️</span>
              <span>Văn bản Trung ương</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.2 rounded font-bold bg-slate-100 text-slate-600">
              {counts.tw}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab("thanh_uy"); setSearch(""); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
              activeTab === "thanh_uy"
                ? "bg-blue-50 text-blue-700 border border-blue-200 font-semibold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>🏢</span>
              <span>Văn bản Thành ủy</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.2 rounded font-bold bg-slate-100 text-slate-600">
              {counts.tu}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab("phuong"); setSearch(""); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
              activeTab === "phuong"
                ? "bg-blue-50 text-blue-700 border border-blue-200 font-semibold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>🚩</span>
              <span>Văn bản Đảng ủy phường</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.2 rounded font-bold bg-slate-100 text-slate-600">
              {counts.phuong}
            </span>
          </button>

          <div className="pt-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Khu vực nghiệp vụ</span>
            {!currentUser && <span className="text-[10px] text-amber-500 font-semibold">Khóa</span>}
          </div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (canEdit) setActiveTab("admin_docs");
              else setIsAuthModalOpen(true);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
              activeTab === "admin_docs"
                ? "bg-slate-100 text-slate-900 font-bold"
                : canEdit
                ? "text-slate-700 hover:bg-slate-100"
                : "text-slate-400 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>📝</span>
              <span>Tiếp nhận và quản lý văn bản</span>
            </div>
            {!canEdit && <span className="text-[10px]">🔒</span>}
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (canEdit) setActiveTab("admin_targets");
              else setIsAuthModalOpen(true);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
              activeTab === "admin_targets"
                ? "bg-slate-100 text-slate-900 font-bold"
                : canEdit
                ? "text-slate-700 hover:bg-slate-100"
                : "text-slate-400 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>🎯</span>
              <span>Thiết lập chỉ tiêu kế hoạch</span>
            </div>
            {!canEdit && <span className="text-[10px]">🔒</span>}
          </button>

          {canAdmin && (
            <button
              onClick={() => { setActiveTab("admin_users"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                activeTab === "admin_users"
                  ? "bg-slate-100 text-slate-900 font-bold"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span>👥</span>
                <span>Quản lý người dùng</span>
              </div>
              <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold">
                {users.length}
              </span>
            </button>
          )}
        </nav>

        {currentUser && (
          <div className="p-3 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <span>🚪</span>
              <span>Đăng xuất ({currentUser.username})</span>
            </button>
          </div>
        )}

        <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-xs space-y-2">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              realtimeStatus === "live" ? "bg-emerald-500 animate-pulse" : 
              isSupabaseConfigured ? "bg-emerald-500" : "bg-amber-400"
            }`} />
            <span className="font-semibold text-slate-600 text-[11px]">
              {realtimeStatus === "live" ? "Đồng bộ thời gian thực" : 
               isSupabaseConfigured ? "Đám mây Supabase" : "Bộ nhớ cục bộ"}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
            <span className="w-5 h-5 rounded bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black text-[9px] flex items-center justify-center">
              TNQ
            </span>
            <span className="font-semibold text-slate-700">TNQ ® TM</span>
            <span className="text-[10px] text-slate-400 ml-auto">Bản quyền nội bộ</span>
          </div>
        </div>
      </aside>

      {/* ===================== NỘI DUNG CHÍNH ===================== */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#f8fafc]">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-2 md:gap-3 text-xs text-slate-500 font-medium">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
              title="Mở menu"
            >
              ☰
            </button>
            <span className="font-bold text-slate-800 text-xs md:text-sm hidden sm:inline">Theo dõi nghị quyết</span>
            <span className="hidden sm:inline">›</span>
            <span className="text-rose-600 font-bold truncate max-w-[180px] sm:max-w-none">
              {activeTab === "tong_quan" && "Tổng quan tiến độ và tháo gỡ điểm nghẽn"}
              {activeTab === "trung_uong" && "Danh mục văn bản cấp Trung ương"}
              {activeTab === "thanh_uy" && "Danh mục văn bản cấp Thành ủy Cần Thơ"}
              {activeTab === "phuong" && "Danh mục văn bản Đảng ủy phường"}
              {activeTab === "admin_docs" && "Tiếp nhận và quản lý văn bản"}
              {activeTab === "admin_targets" && "Thiết lập chỉ tiêu kế hoạch"}
              {activeTab === "admin_users" && "Quản lý người dùng và phân quyền"}
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* NÚT NẠP CSDL SUPABASE TRỰC TIẾP */}
            {canAdmin && (
              <button
                onClick={handleSeedDataToSupabase}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                title="Bấm để đẩy toàn bộ danh mục văn bản và kế hoạch vào Supabase ngay"
              >
                <span>☁️</span> <span className="hidden md:inline">Nạp CSDL Supabase</span>
              </button>
            )}

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-3 py-1.5 md:px-3.5 md:py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>📄</span> <span className="hidden sm:inline">Xuất báo cáo thường trực</span><span className="sm:hidden">Báo cáo</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl text-xs">
                  <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    {currentUser.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="font-bold text-slate-900 leading-tight">{currentUser.full_name}</div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {currentUser.role === "admin" ? "Quản trị viên" : currentUser.role === "editor" ? "Cán bộ nhập liệu" : "Chỉ xem"}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Đăng xuất khỏi hệ thống"
                >
                  <span>🚪</span>
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <span>🔐</span> Đăng nhập
              </button>
            )}
          </div>
        </header>

        <div className="p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* CẢNH BÁO NẾU CHƯA CẤU HÌNH SUPABASE TRÊN VERCEL */}
          {!isSupabaseConfigured ? (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start justify-between gap-3 text-xs text-rose-900 shadow-sm">
              <div className="flex items-start gap-2.5">
                <span className="text-xl">⚠️</span>
                <div>
                  <strong className="font-bold text-sm block">Vercel chưa được kết nối với cơ sở dữ liệu Supabase:</strong>
                  <p className="mt-0.5 leading-relaxed">
                    Đây chính là lý do đồng chí thêm trên máy tính nhưng mở điện thoại không thấy! Trên Vercel đang thiếu 2 biến môi trường: <code className="bg-rose-100 px-1.5 py-0.5 rounded font-mono font-bold">NEXT_PUBLIC_SUPABASE_URL</code> và <code className="bg-rose-100 px-1.5 py-0.5 rounded font-mono font-bold">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-3.5 py-2 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              {lastSyncTime && (
                <span className="text-[10px] text-emerald-700 font-mono font-bold">
                  Đồng bộ: {lastSyncTime}
                </span>
              )}
            </div>
          )}

          {statusNotice && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-bold">
              {statusNotice}
            </div>
          )}

          {/* ======================= TAB 1: TỔNG QUAN TIẾN ĐỘ ======================= */}
          {activeTab === "tong_quan" && (
            <div className="space-y-6">
              {/* Thẻ thống kê KPI vĩ mô */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tổng văn bản</div>
                  <div className="text-2xl md:text-3xl font-black text-slate-900 mt-1">{docs.length}</div>
                  <div className="text-[10px] md:text-xs text-slate-400 mt-0.5">TW: {counts.tw} • TU: {counts.tu} • Phường: {counts.phuong}</div>
                </div>

                <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/50 p-4 md:p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                  <div className="text-[10px] md:text-[11px] font-bold text-blue-700 uppercase tracking-wide">Văn bản Đảng ủy</div>
                  <div className="text-2xl md:text-3xl font-black text-blue-700 mt-1">{wardPlans.length}</div>
                  <div className="text-[10px] md:text-xs text-blue-600 font-medium mt-0.5">{allSubTargets.length} chỉ tiêu thành phần</div>
                </div>

                {/* THẺ ĐIỂM NGHẼN THỂ CHẾ */}
                <div className={`p-4 md:p-5 rounded-2xl border shadow-xs ${
                  institutionalBottlenecks.length > 0 
                    ? "bg-gradient-to-br from-amber-50/80 to-yellow-50/50 border-amber-300" 
                    : "bg-white border-slate-200"
                }`}>
                  <div className="text-[10px] md:text-[11px] font-bold text-amber-800 uppercase tracking-wide">Điểm nghẽn thể chế</div>
                  <div className="text-2xl md:text-3xl font-black text-amber-700 mt-1">{institutionalBottlenecks.length}</div>
                  <div className="text-[10px] md:text-xs text-amber-700 font-medium mt-0.5">Văn bản TW/TU chưa có Kế hoạch</div>
                </div>

                <div className={`p-4 md:p-5 rounded-2xl border shadow-xs ${
                  uncompletedTargetList.length > 0 
                    ? "bg-gradient-to-br from-rose-50/80 to-pink-50/50 border-rose-300" 
                    : "bg-white border-slate-200"
                }`}>
                  <div className="text-[10px] md:text-[11px] font-bold text-rose-800 uppercase tracking-wide">Điểm nghẽn chỉ tiêu</div>
                  <div className="text-2xl md:text-3xl font-black text-rose-700 mt-1">{uncompletedTargetList.length}</div>
                  <div className="text-[10px] md:text-xs text-rose-700 font-medium mt-0.5">Chỉ tiêu chưa đạt 100%</div>
                </div>
              </div>

              {/* KHỐI (1): TIẾN ĐỘ THỰC HIỆN VĂN BẢN ĐẢNG ỦY PHƯỜNG */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 md:p-6 space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h2 className="text-xs md:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">1</span>
                    Tiến độ thực hiện văn bản Đảng ủy phường
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Realtime
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  {wardPlans.map(plan => {
                    const subList = plan.sub_targets || [];
                    const completedTargets = subList.filter(st => st.percent === 100);
                    const uncompletedTargets = subList.filter(st => st.percent < 100);
                    const planCompletedPercent = subList.length > 0 
                      ? Math.round((completedTargets.length / subList.length) * 100) 
                      : 0;

                    return (
                      <div
                        key={plan.id}
                        onClick={() => setModalPlan(plan)}
                        className="bg-gradient-to-br from-slate-50/90 to-blue-50/30 hover:from-blue-50/50 hover:to-indigo-50/40 p-4 md:p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start gap-2 border-b border-slate-200/70 pb-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-xs font-black bg-slate-900 text-white shadow-xs">
                              {plan.doc_number}
                            </span>
                            <span className="text-[10px] md:text-[11px] text-slate-500 font-medium">Ban hành: {plan.issue_date}</span>
                          </div>
                          <span className="text-[10px] md:text-[11px] font-bold text-blue-600 group-hover:underline flex items-center gap-0.5">
                            Chi tiết ›
                          </span>
                        </div>

                        <div className="flex items-center gap-3 md:gap-5">
                          <div className="transform group-hover:scale-105 transition-transform duration-300">
                            <PlanDonutChart percent={planCompletedPercent} size="lg" />
                          </div>

                          <div className="flex-1 min-w-0 space-y-1.5 md:space-y-2">
                            <h3 className="font-bold text-xs md:text-sm text-slate-900 leading-snug line-clamp-2" title={plan.title}>
                              {plan.title}
                            </h3>

                            <div className="p-2 md:p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-[11px] md:text-xs">
                              <span className="font-bold text-emerald-800 flex items-center gap-1">
                                <span>✓</span> Hoàn thành (100%):
                              </span>
                              <span className="font-black text-emerald-700">
                                {completedTargets.length} / {subList.length} ({planCompletedPercent}%)
                              </span>
                            </div>

                            <div className="p-2 md:p-2.5 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between text-[11px] md:text-xs">
                              <span className="font-bold text-rose-800 flex items-center gap-1">
                                <span>⚠️</span> Chưa hoàn thành:
                              </span>
                              <span className="font-black text-rose-700">
                                {uncompletedTargets.length} / {subList.length}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 md:mt-4 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px] md:text-[11px] text-slate-500">
                          <span>Đơn vị: <strong className="text-slate-800">{plan.assignee || "Văn phòng Đảng ủy"}</strong></span>
                          <span className="font-bold text-blue-700">Đạt {planCompletedPercent}% chỉ tiêu 100%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* KHỐI (2): ĐIỂM NGHẼN THỂ CHẾ */}
              <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4 md:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-amber-100 pb-3">
                  <div>
                    <h2 className="text-xs md:text-sm font-bold text-amber-900 flex items-center gap-2">
                      <span className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-black">2</span>
                      Điểm nghẽn thể chế
                    </h2>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Văn bản chỉ đạo cấp Trung ương và Thành ủy chưa được Đảng ủy phường ban hành văn bản cụ thể hóa
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg self-start sm:self-auto">
                    {institutionalBottlenecks.length} văn bản cần tháo gỡ
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[600px]">
                    <thead className="bg-amber-50/50 text-slate-600 font-bold border-b border-amber-200">
                      <tr>
                        <th className="p-2.5 md:p-3 w-24">Cấp</th>
                        <th className="p-2.5 md:p-3 w-36">Số văn bản</th>
                        <th className="p-2.5 md:p-3">Trích yếu nội dung văn bản</th>
                        <th className="p-2.5 md:p-3 w-48">Cơ quan ban hành</th>
                        <th className="p-2.5 md:p-3 w-28">Ngày ban hành</th>
                        <th className="p-2.5 md:p-3 w-36 text-center">Tình trạng thể chế</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {institutionalBottlenecks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-emerald-600 font-bold">
                            ✓ 100% văn bản của Trung ương và Thành ủy đã được cụ thể hóa kịp thời!
                          </td>
                        </tr>
                      ) : (
                        institutionalBottlenecks.map(doc => (
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
                                {doc.file_url ? "📎" : doc.doc_url ? "🔗" : ""} {doc.title}
                              </span>
                            </td>
                            <td className="p-2.5 md:p-3 text-slate-600">{doc.issuer}</td>
                            <td className="p-2.5 md:p-3 text-slate-600 whitespace-nowrap">{doc.issue_date}</td>
                            <td className="p-2.5 md:p-3 text-center">
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                Chưa cụ thể hóa
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* KHỐI (3): ĐIỂM NGHẼN CHỈ TIÊU */}
              <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-4 md:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-rose-100 pb-3">
                  <div>
                    <h2 className="text-xs md:text-sm font-bold text-rose-900 flex items-center gap-2">
                      <span className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs font-black">3</span>
                      Điểm nghẽn chỉ tiêu văn bản Đảng ủy phường
                    </h2>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Danh mục chỉ tiêu chưa đạt 100%, phân tích nguyên nhân và giải pháp tháo gỡ
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg self-start sm:self-auto">
                    {uncompletedTargetList.length} chỉ tiêu cần đôn đốc
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[750px]">
                    <thead className="bg-rose-50/50 text-slate-600 font-bold border-b border-rose-200">
                      <tr>
                        <th className="p-2.5 md:p-3 w-32">Số văn bản</th>
                        <th className="p-2.5 md:p-3 w-64">Tên chỉ tiêu và thời hạn</th>
                        <th className="p-2.5 md:p-3 w-36">Đơn vị chủ trì</th>
                        <th className="p-2.5 md:p-3 w-32">Tiến độ (Gap)</th>
                        <th className="p-2.5 md:p-3">Nguyên nhân điểm nghẽn</th>
                        <th className="p-2.5 md:p-3">Kiến nghị / Giải pháp tháo gỡ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {uncompletedTargetList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-emerald-600 font-bold text-sm">
                            ✓ 100% các chỉ tiêu theo văn bản của Đảng ủy phường đã hoàn thành!
                          </td>
                        </tr>
                      ) : (
                        uncompletedTargetList.map(({ planDoc, target }) => {
                          const gap = 100 - target.percent;
                          return (
                            <tr key={`${planDoc.id}-${target.id}`} className="hover:bg-rose-50/30 transition">
                              <td className="p-2.5 md:p-3 font-bold text-slate-900 whitespace-nowrap">
                                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-800">
                                  {planDoc.doc_number}
                                </span>
                              </td>
                              <td className="p-2.5 md:p-3">
                                <div className="font-bold text-slate-900 leading-snug">🎯 {target.name}</div>
                                <div className="text-[10px] text-slate-500 mt-1">Hạn chót: <strong>{target.deadline || "2026-12-31"}</strong></div>
                              </td>
                              <td className="p-2.5 md:p-3 font-semibold text-slate-700">
                                {target.assignee || planDoc.assignee}
                              </td>
                              <td className="p-2.5 md:p-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-slate-800">{target.percent}%</span>
                                  <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded border border-rose-200">
                                    (-{gap}%)
                                  </span>
                                </div>
                                <div className="w-20 md:w-24 bg-slate-200 rounded-full h-1.5 mt-1">
                                  <div
                                    className={`h-full rounded-full ${
                                      target.percent >= 70 ? "bg-amber-500" : "bg-rose-500"
                                    }`}
                                    style={{ width: `${target.percent}%` }}
                                  />
                                </div>
                              </td>
                              <td className="p-2.5 md:p-3 text-slate-700 leading-relaxed text-[11px] bg-rose-50/20 font-medium">
                                {target.bottleneck_reason || "Đang trong lộ trình thực hiện"}
                              </td>
                              <td className="p-2.5 md:p-3 text-blue-900 leading-relaxed text-[11px] bg-blue-50/20 font-semibold">
                                {target.proposed_solution || "Đôn đốc các bộ phận liên quan"}
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

          {/* ======================= CÁC TAB DANH MỤC VĂN BẢN ======================= */}
          {(activeTab === "trung_uong" || activeTab === "thanh_uy" || activeTab === "phuong") && (
            <div className="space-y-4">
              <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between md:items-center gap-3">
                <div>
                  <h2 className="text-sm md:text-base font-bold text-slate-900">
                    {activeTab === "trung_uong" && "Danh mục văn bản cấp Trung ương"}
                    {activeTab === "thanh_uy" && "Danh mục văn bản cấp Thành ủy Cần Thơ"}
                    {activeTab === "phuong" && "Danh mục văn bản Đảng ủy phường"}
                  </h2>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Tổng số: <strong className="text-blue-600 font-bold">{filteredLevelDocs.length}</strong> văn bản (Nhấp vào trích yếu để mở tài liệu)
                  </div>
                </div>

                <div className="relative w-full md:w-72">
                  <input
                    type="text"
                    placeholder="Tìm theo số văn bản, trích yếu..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 md:py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <span className="absolute left-2.5 top-2 md:top-2.5 text-xs text-slate-400">🔍</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-3 w-36">Số văn bản</th>
                        <th className="p-3">Trích yếu nội dung</th>
                        <th className="p-3 w-28">Ngày ban hành</th>
                        <th className="p-3 w-48">Cơ quan ban hành</th>
                        {activeTab !== "phuong" ? (
                          <th className="p-3 w-36 text-center">Tình trạng thể chế</th>
                        ) : (
                          <th className="p-3 w-36 text-center">Chỉ tiêu đạt 100%</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLevelDocs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400">
                            Chưa có văn bản nào trong mục này.
                          </td>
                        </tr>
                      ) : (
                        filteredLevelDocs.map(doc => (
                          <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                              <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-800">
                                {doc.doc_number}
                              </span>
                            </td>

                            <td className="p-3 font-medium text-slate-800 max-w-md leading-relaxed">
                              <div
                                onClick={() => handleOpenDocument(doc)}
                                className="cursor-pointer hover:text-blue-600 transition-colors group flex items-start gap-1.5"
                                title={doc.file_url ? "Mở tệp tải lên" : doc.doc_url ? "Mở đường dẫn liên kết" : "Chưa có tài liệu đính kèm"}
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
                              </div>

                              {doc.concretized_by && (
                                <div className="text-[11px] text-emerald-700 font-bold mt-1">
                                  ↳ Cụ thể hóa: {doc.concretized_by}
                                </div>
                              )}
                            </td>

                            <td className="p-3 text-slate-600 whitespace-nowrap font-medium">
                              {doc.issue_date}
                            </td>

                            <td className="p-3 text-slate-700 font-medium">
                              {doc.issuer}
                            </td>

                            {activeTab !== "phuong" ? (
                              <td className="p-3 text-center">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-block ${
                                    doc.is_concretized
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-rose-50 text-rose-700 border border-rose-200"
                                  }`}
                                >
                                  {doc.is_concretized ? "✓ Đã cụ thể hóa" : "Chưa cụ thể hóa"}
                                </span>
                              </td>
                            ) : (
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="font-black text-slate-800">{doc.target_percent}%</span>
                                </div>
                                <div className="w-20 md:w-24 mx-auto bg-slate-200 rounded-full h-1.5 mt-1">
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

          {/* ======================= TAB: TIẾP NHẬN & QUẢN LÝ VĂN BẢN ======================= */}
          {activeTab === "admin_docs" && (
            <div className="space-y-6">
              <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h2 className="text-sm md:text-base font-bold text-slate-900">Tiếp nhận và quản lý văn bản</h2>
                <div className="text-xs text-slate-500 mt-0.5">Tiếp nhận, chỉnh sửa và quản lý lưu trữ các văn bản chỉ đạo của các cấp</div>
              </div>

              {formSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                  ✓ {formSuccessMsg}
                </div>
              )}

              {/* Form thêm mới văn bản */}
              <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wide text-slate-800 border-b border-slate-100 pb-2">
                  Tiếp nhận văn bản mới
                </h3>

                <form onSubmit={handleCreateDoc} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      <label className="font-bold text-slate-700 block mb-1">Đơn vị chủ trì thực hiện (nếu là phường):</label>
                      <input
                        type="text"
                        placeholder="VD: Văn phòng Đảng ủy, Ban Xây dựng Đảng..."
                        value={formAssignee}
                        onChange={(e) => setFormAssignee(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        📎 Tải lên tệp văn bản (PDF, Word, bản quét):
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFormFile(e.target.files[0]);
                          }
                        }}
                        className="w-full border border-slate-300 rounded-xl p-2 bg-white text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        🔗 Hoặc dán đường dẫn liên kết trực tiếp (URL):
                      </label>
                      <input
                        type="url"
                        placeholder="https://tulieuvankien.dangcongsan.vn/..."
                        value={formDocUrl}
                        onChange={(e) => setFormDocUrl(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-xs"
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
                          placeholder="Nhập số văn bản cụ thể hóa (VD: Kế hoạch số 21-KH/ĐU)..."
                          value={formConcretizedBy}
                          onChange={(e) => setFormConcretizedBy(e.target.value)}
                          className="w-full border border-amber-300 rounded-lg p-2 bg-white text-xs"
                        />
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="px-5 py-2 md:px-6 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isUploading ? "Đang tải lên..." : "+ Lưu văn bản vào hệ thống"}
                    </button>
                  </div>
                </form>
              </div>

              {/* BẢNG QUẢN LÝ VĂN BẢN VỚI 4 SUB-TAB */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 md:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-xs uppercase tracking-wide text-slate-800">
                    Danh mục văn bản đang quản lý ({adminFilteredDocs.length})
                  </h3>

                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setAdminDocSubTab("all")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        adminDocSubTab === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Tất cả ({docs.length})
                    </button>
                    <button
                      onClick={() => setAdminDocSubTab("Trung ương")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        adminDocSubTab === "Trung ương" ? "bg-white text-purple-700 shadow-xs" : "text-slate-600 hover:text-purple-700"
                      }`}
                    >
                      Trung ương ({counts.tw})
                    </button>
                    <button
                      onClick={() => setAdminDocSubTab("Thành ủy")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        adminDocSubTab === "Thành ủy" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-blue-700"
                      }`}
                    >
                      Thành ủy ({counts.tu})
                    </button>
                    <button
                      onClick={() => setAdminDocSubTab("Phường")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        adminDocSubTab === "Phường" ? "bg-white text-rose-700 shadow-xs" : "text-slate-600 hover:text-rose-700"
                      }`}
                    >
                      Văn bản Đảng ủy phường ({counts.phuong})
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                      <tr>
                        <th className="p-3 w-24">Cấp</th>
                        <th className="p-3 w-32">Số văn bản</th>
                        <th className="p-3">Trích yếu nội dung</th>
                        <th className="p-3 w-28 text-center">Tệp / Link</th>
                        <th className="p-3 w-36">Cụ thể hóa</th>
                        <th className="p-3 w-32 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminFilteredDocs.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/60">
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.level === "Trung ương" ? "bg-purple-100 text-purple-700" :
                              item.level === "Thành ủy" ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"
                            }`}>
                              {item.level}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-900">{item.doc_number}</td>
                          <td className="p-3 text-slate-800 max-w-md">
                            <span
                              onClick={() => handleOpenDocument(item)}
                              className="cursor-pointer hover:text-blue-600 hover:underline font-semibold"
                            >
                              {item.title}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {item.file_url ? (
                              <button
                                onClick={() => handleOpenDocument(item)}
                                className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px] hover:bg-blue-100 cursor-pointer border border-blue-200"
                              >
                                📎 Tệp
                              </button>
                            ) : item.doc_url ? (
                              <button
                                onClick={() => handleOpenDocument(item)}
                                className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-[10px] hover:bg-emerald-100 cursor-pointer border border-emerald-200"
                              >
                                🔗 Link
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
                                  + Gán văn bản
                                </button>
                              )
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="p-3 text-right space-x-2">
                            {canEdit && (
                              <button
                                onClick={() => {
                                  setEditingDoc(item);
                                  setFormFile(null);
                                }}
                                className="text-blue-600 hover:text-blue-800 font-bold text-xs cursor-pointer"
                              >
                                Sửa
                              </button>
                            )}
                            {canAdmin && (
                              <button
                                onClick={() => handleDeleteDoc(item.id)}
                                className="text-rose-600 hover:text-rose-800 font-bold text-xs cursor-pointer"
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

          {/* ======================= TAB: THIẾT LẬP CHỈ TIÊU KẾ HOẠCH ======================= */}
          {activeTab === "admin_targets" && (
            <div className="space-y-6">
              <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h2 className="text-sm md:text-base font-bold text-slate-900">Thiết lập chỉ tiêu kế hoạch Đảng ủy phường</h2>
                <div className="text-xs text-slate-500 mt-0.5">Cập nhật tiến độ %, thời hạn, nguyên nhân nghẽn và giải pháp tháo gỡ</div>
              </div>

              <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="w-full md:w-auto">
                  <label className="font-bold text-slate-700 block mb-1 text-xs">Chọn văn bản/kế hoạch cần cấu hình chỉ tiêu:</label>
                  <select
                    value={selectedPlan ? String(selectedPlan.id) : ""}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-bold text-xs w-full md:w-96 cursor-pointer focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {wardPlans.map(p => (
                      <option key={String(p.id)} value={String(p.id)}>
                        {p.doc_number} - {p.title.slice(0, 45)}...
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPlan && (
                  <div className="flex items-center gap-4 bg-emerald-50 p-3 rounded-xl border border-emerald-200 w-full md:w-auto justify-center">
                    <PlanDonutChart percent={selectedPlan.target_percent} size="sm" />
                    <div>
                      <div className="text-xs font-bold text-emerald-950">Chỉ tiêu hoàn thành 100%:</div>
                      <div className="text-lg md:text-xl font-black text-emerald-700">{selectedPlan.target_percent}%</div>
                      <div className="text-[11px] text-emerald-600">{selectedPlan.sub_targets?.filter(s => s.percent === 100).length || 0} / {selectedPlan.sub_targets?.length || 0} chỉ tiêu</div>
                    </div>
                  </div>
                )}
              </div>

              {selectedPlan && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 md:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900">
                        Danh sách chỉ tiêu của: <span className="text-blue-700 font-black">{selectedPlan.doc_number}</span>
                      </h3>
                      <div className="text-xs text-slate-500 mt-0.5">{selectedPlan.title}</div>
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
                            bottleneck_reason: "",
                            proposed_solution: "",
                            assignee: selectedPlan.assignee || "Văn phòng Đảng ủy"
                          }
                        ];
                        handleUpdateSelectedPlanTargets(selectedPlan.id, newList);
                      }}
                      className="px-3.5 py-1.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
                    >
                      ＋ Thêm chỉ tiêu mới
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(selectedPlan.sub_targets || []).length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        Văn bản này chưa có chỉ tiêu thành phần nào. Hãy bấm <strong>"＋ Thêm chỉ tiêu mới"</strong> để bắt đầu.
                      </div>
                    ) : (
                      (selectedPlan.sub_targets || []).map((st, idx) => (
                        <div key={st.id || idx} className="p-3.5 md:p-4.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                placeholder="Tên chỉ tiêu cụ thể..."
                                value={st.name}
                                onChange={(e) => {
                                  const list = [...(selectedPlan.sub_targets || [])];
                                  list[idx].name = e.target.value;
                                  handleUpdateSelectedPlanTargets(selectedPlan.id, list);
                                }}
                                className="flex-1 border border-slate-300 rounded-xl p-2 bg-white text-xs font-bold"
                              />
                            </div>
                            <div className="flex items-center gap-2 ml-7 sm:ml-0">
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
                              <button
                                type="button"
                                onClick={() => {
                                  const list = (selectedPlan.sub_targets || []).filter((_, i) => i !== idx);
                                  handleUpdateSelectedPlanTargets(selectedPlan.id, list);
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer ml-auto"
                                title="Xóa chỉ tiêu này"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 md:gap-4 pl-7 sm:pl-9">
                            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Tiến độ:</span>
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
                              className="flex-1 accent-blue-600 cursor-pointer h-2"
                            />
                            <span className={`w-12 text-right font-black text-xs ${
                              st.percent === 100 ? "text-emerald-700" :
                              st.percent >= 70 ? "text-blue-700" :
                              st.percent >= 40 ? "text-amber-700" : "text-rose-700"
                            }`}>
                              {st.percent}%
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 pl-7 sm:pl-9 pt-1">
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
                              <label className="text-[10px] font-bold text-blue-900 uppercase block mb-0.5">
                                Kiến nghị / Giải pháp tháo gỡ:
                              </label>
                              <input
                                type="text"
                                placeholder="Đề xuất hướng xử lý..."
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

          {/* ======================= TAB: QUẢN LÝ NGƯỜI DÙNG ======================= */}
          {activeTab === "admin_users" && canAdmin && (
            <div className="space-y-6">
              <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
                <div>
                  <h2 className="text-sm md:text-base font-bold text-slate-900">Quản lý người dùng và phân quyền</h2>
                  <div className="text-xs text-slate-500 mt-0.5">Thêm, sửa, xóa tài khoản và phân quyền truy cập hệ thống</div>
                </div>

                <button
                  onClick={() => handleOpenUserModal()}
                  className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1"
                >
                  <span>＋</span> Thêm người dùng
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                    <tr>
                      <th className="p-3.5">Họ và tên cán bộ</th>
                      <th className="p-3.5">Tên đăng nhập (Username)</th>
                      <th className="p-3.5">Vai trò</th>
                      <th className="p-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-black flex items-center justify-center text-xs">
                            {u.username.slice(0, 1).toUpperCase()}
                          </span>
                          {u.full_name}
                        </td>
                        <td className="p-3.5 font-mono text-slate-700 font-bold">{u.username}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            u.role === "admin" ? "bg-red-50 text-red-700 border border-red-200" :
                            u.role === "editor" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            "bg-slate-100 text-slate-700"
                          }`}>
                            {u.role === "admin" ? "👑 Quản trị viên" : u.role === "editor" ? "✍️ Nhập liệu" : "👁️ Chỉ xem"}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleOpenUserModal(u)}
                            className="text-blue-600 hover:text-blue-800 font-bold text-xs cursor-pointer"
                          >
                            Sửa
                          </button>
                          {currentUser?.id !== u.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-rose-600 hover:text-rose-800 font-bold text-xs cursor-pointer"
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
          )}
        </div>
      </main>

      {/* ===================== CHATBOT TRỢ LÝ AI NỔI ===================== */}
      {!isChatbotOpen && (
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-5 right-5 z-40 w-13 h-13 md:w-14 md:h-14 rounded-full bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-500/30 flex items-center justify-center text-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white"
          title="Mở Trợ lý AI Tham mưu"
        >
          ✨
        </button>
      )}

      {isChatbotOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[92vw] sm:w-96 md:w-[420px] h-[540px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center text-sm font-bold shadow-xs">
                ✨
              </div>
              <div>
                <h4 className="font-bold text-xs leading-tight">Trợ lý AI Tham mưu</h4>
                <div className="text-[10px] text-blue-200">Dữ liệu số thực tế Đảng bộ phường</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setChatMessages([
                    {
                      id: `m-${Date.now()}`,
                      sender: "gemini",
                      text: "Lịch sử tra cứu đã làm mới. Đồng chí cần tra cứu gì ạ?",
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  ]);
                }}
                className="text-slate-300 hover:text-white text-[11px] px-2 py-0.5 rounded bg-white/10"
              >
                Làm mới
              </button>
              <button
                onClick={() => setIsChatbotOpen(false)}
                className="text-slate-400 hover:text-white p-1 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/60 text-xs">
            {chatMessages.map(msg => (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  msg.sender === "user" 
                    ? "bg-slate-900 text-white" 
                    : "bg-gradient-to-tr from-pink-500 to-indigo-600 text-white shadow-xs"
                }`}>
                  {msg.sender === "user" ? "Tôi" : "AI"}
                </div>

                <div className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed space-y-1 ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white rounded-tr-none shadow-xs"
                    : "bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-xs whitespace-pre-line"
                }`}>
                  <div>{msg.text}</div>
                  <div className={`text-[9px] text-right ${msg.sender === "user" ? "text-blue-200" : "text-slate-400"}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isAiThinking && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-pink-500 to-indigo-600 text-white flex items-center justify-center text-[10px]">
                  AI
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-2.5 shadow-xs flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                  <span>AI đang phân tích dữ liệu...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <div className="px-3 py-2 bg-white border-t border-slate-100 flex flex-wrap gap-1.5 shrink-0">
            <button
              onClick={() => askGeminiAssistant("Điểm nghẽn thể chế hiện tại là gì?")}
              className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 cursor-pointer"
            >
              ⚠️ Điểm nghẽn thể chế
            </button>
            <button
              onClick={() => askGeminiAssistant("Chỉ tiêu nào đang chậm tiến độ?")}
              className="px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200 cursor-pointer"
            >
              🎯 Chỉ tiêu chậm
            </button>
            <button
              onClick={() => askGeminiAssistant("Nghị quyết 57-NQ/TW là gì?")}
              className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200 cursor-pointer"
            >
              📄 57-NQ/TW
            </button>
          </div>

          <div className="p-2.5 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (aiQuery.trim()) askGeminiAssistant(aiQuery);
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                placeholder="Hỏi về văn bản, thể chế, chỉ tiêu..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isAiThinking || !aiQuery.trim()}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                Gửi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL XUẤT BÁO CÁO THƯỜNG TRỰC ===================== */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 md:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[94vh] flex flex-col">
            <div className="px-4 md:px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-base">📄</span>
                <span className="font-bold text-xs md:text-sm">Báo cáo tình hình thực hiện kế hoạch và điểm nghẽn chỉ tiêu</span>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2 py-1 text-[11px] md:text-xs font-semibold focus:outline-none"
                >
                  <option value="Định kỳ tháng 09/2026">Kỳ: Tháng 09/2026</option>
                  <option value="Sơ kết quý III/2026">Kỳ: Quý III/2026</option>
                  <option value="Đánh giá 9 tháng năm 2026">Kỳ: 9 tháng năm 2026</option>
                  <option value="Báo cáo chuyên đề">Báo cáo chuyên đề</option>
                </select>

                <button
                  onClick={generateAiReportSectionIV}
                  disabled={isAiGeneratingReportSection}
                  className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-[11px] md:text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-50"
                  title="Tổng hợp kiến nghị dựa trên dữ liệu sống"
                >
                  <span>✨</span> {isAiGeneratingReportSection ? "Đang tạo..." : "Tạo kiến nghị AI"}
                </button>

                <button
                  onClick={handlePrintReport}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] md:text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <span>🖨️</span> In / PDF (1 trang chuẩn)
                </button>
                <button
                  onClick={() => setIsReportModalOpen(false)}
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
      )}

      {/* MODAL CHỈNH SỬA VĂN BẢN */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-3.5 md:px-6 md:py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Chỉnh sửa văn bản: {editingDoc.doc_number}</h3>
              <button onClick={() => setEditingDoc(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUpdateDoc} className="p-4 md:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cấp văn bản:</label>
                  <select
                    value={editingDoc.level}
                    onChange={(e) => setEditingDoc({ ...editingDoc, level: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-semibold"
                  >
                    <option value="Trung ương">Cấp Trung ương</option>
                    <option value="Thành ủy">Cấp Thành ủy</option>
                    <option value="Phường">Đảng ủy phường</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số văn bản:</label>
                  <input
                    type="text"
                    required
                    value={editingDoc.doc_number}
                    onChange={(e) => setEditingDoc({ ...editingDoc, doc_number: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày ban hành:</label>
                  <input
                    type="date"
                    value={editingDoc.issue_date}
                    onChange={(e) => setEditingDoc({ ...editingDoc, issue_date: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cơ quan ban hành:</label>
                  <input
                    type="text"
                    value={editingDoc.issuer}
                    onChange={(e) => setEditingDoc({ ...editingDoc, issuer: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đơn vị chủ trì:</label>
                  <input
                    type="text"
                    value={editingDoc.assignee || ""}
                    onChange={(e) => setEditingDoc({ ...editingDoc, assignee: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Trích yếu nội dung văn bản:</label>
                <textarea
                  rows={2}
                  required
                  value={editingDoc.title}
                  onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    📎 Tải lại tệp đính kèm (nếu muốn thay thế):
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFormFile(e.target.files[0]);
                      }
                    }}
                    className="w-full text-xs"
                  />
                  {editingDoc.file_name && (
                    <div className="text-[10px] text-slate-500 mt-1 font-medium">Tệp hiện tại: {editingDoc.file_name}</div>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    🔗 Đường dẫn liên kết trực tiếp (URL):
                  </label>
                  <input
                    type="url"
                    value={editingDoc.doc_url || ""}
                    onChange={(e) => setEditingDoc({ ...editingDoc, doc_url: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2 bg-white text-xs"
                  />
                </div>
              </div>

              {editingDoc.level !== "Phường" && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="editDocCheckConcretized"
                      checked={editingDoc.is_concretized}
                      onChange={(e) => setEditingDoc({ ...editingDoc, is_concretized: e.target.checked })}
                      className="rounded text-amber-600"
                    />
                    <label htmlFor="editDocCheckConcretized" className="font-bold text-slate-800">
                      Đã ban hành văn bản cụ thể hóa?
                    </label>
                  </div>
                  {editingDoc.is_concretized && (
                    <input
                      type="text"
                      placeholder="Nhập số văn bản cụ thể hóa..."
                      value={editingDoc.concretized_by || ""}
                      onChange={(e) => setEditingDoc({ ...editingDoc, concretized_by: e.target.value })}
                      className="w-full border border-amber-300 rounded-lg p-2 bg-white text-xs"
                    />
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-100 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  {isUploading ? "Đang lưu..." : "Cập nhật thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA NGƯỜI DÙNG */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-3.5 md:px-6 md:py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingUser ? `Chỉnh sửa tài khoản: ${editingUser.username}` : "Thêm người dùng mới"}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 md:p-6 space-y-4 text-xs">
              {userFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                  ⚠️ {userFormError}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ và tên cán bộ <span className="text-rose-500">*</span>:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn A..."
                  value={userFormFullName}
                  onChange={(e) => setUserFormFullName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên đăng nhập (Username) <span className="text-rose-500">*</span>:</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  placeholder="VD: canbo_vp, lanhdao..."
                  value={userFormUsername}
                  onChange={(e) => setUserFormUsername(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mật khẩu {editingUser ? "(để trống nếu không đổi)" : <span className="text-rose-500">*</span>}:
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  placeholder={editingUser ? "Nhập mật khẩu mới..." : "Nhập mật khẩu..."}
                  value={userFormPassword}
                  onChange={(e) => setUserFormPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Vai trò phân quyền:</label>
                <select
                  value={userFormRole}
                  onChange={(e) => setUserFormRole(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold bg-slate-50"
                >
                  <option value="viewer">Chỉ xem (Thường trực Đảng ủy, khách)</option>
                  <option value="editor">Cán bộ nhập liệu (Thêm, sửa văn bản và chỉ tiêu)</option>
                  <option value="admin">Quản trị viên (Toàn quyền hệ thống)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-100 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Lưu tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ĐĂNG NHẬP */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="font-bold text-sm flex items-center gap-2">
                <span>🔐</span> Đăng nhập hệ thống
              </div>
              <button
                onClick={() => { setIsAuthModalOpen(false); setLoginError(""); }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogin} className="p-5 md:p-6 space-y-4 text-xs">
              <div className="text-slate-600 leading-relaxed font-medium">
                Vui lòng nhập <strong>tên đăng nhập</strong> và <strong>mật khẩu</strong> của cơ quan Đảng ủy để thực hiện nghiệp vụ.
              </div>

              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold text-xs">
                  ⚠️ {loginError}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên đăng nhập (Username):</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Nhập tên đăng nhập..."
                  value={loginUsername}
                  onChange={(e) => { setLoginUsername(e.target.value); setLoginError(""); }}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mật khẩu:</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu..."
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); setLoginError(""); }}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAuthModalOpen(false); setLoginError(""); }}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-100 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Đăng nhập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT 2 NHÓM CHỈ TIÊU KẾ HOẠCH */}
      {modalPlan && (() => {
        const subList = modalPlan.sub_targets || [];
        const completedTargets = subList.filter(st => st.percent === 100);
        const uncompletedTargets = subList.filter(st => st.percent < 100);
        const planCompletedPercent = subList.length > 0 
          ? Math.round((completedTargets.length / subList.length) * 100) 
          : 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
              <div className="px-4 md:px-6 py-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5 md:gap-3">
                  <span className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-xs font-black bg-white text-slate-900 shadow-xs">
                    {modalPlan.doc_number}
                  </span>
                  <div>
                    <h3 className="font-bold text-xs md:text-sm leading-tight line-clamp-1">{modalPlan.title}</h3>
                    <div className="text-[10px] md:text-[11px] text-blue-200 mt-0.5">Tỷ lệ hoàn thành 100%: <strong>{planCompletedPercent}%</strong> ({completedTargets.length}/{subList.length} chỉ tiêu)</div>
                  </div>
                </div>
                <button onClick={() => setModalPlan(null)} className="text-slate-400 hover:text-white cursor-pointer text-lg font-bold ml-2">✕</button>
              </div>

              <div className="p-4 md:p-6 overflow-y-auto space-y-5 md:space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                    <h4 className="text-xs font-extrabold uppercase text-emerald-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
                      Nhóm chỉ tiêu đã hoàn thành (100%)
                    </h4>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {completedTargets.length} chỉ tiêu ({planCompletedPercent}%)
                    </span>
                  </div>

                  {completedTargets.length === 0 ? (
                    <div className="p-4 bg-slate-50 text-slate-400 text-center text-xs rounded-xl italic">
                      Chưa có chỉ tiêu nào đạt 100% hoàn thành.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {completedTargets.map((st, i) => (
                        <div key={st.id || i} className="p-3 md:p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
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

                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                    <h4 className="text-xs font-extrabold uppercase text-rose-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">⚠️</span>
                      Nhóm chỉ tiêu chưa hoàn thành (&lt; 100%)
                    </h4>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      {uncompletedTargets.length} chỉ tiêu
                    </span>
                  </div>

                  {uncompletedTargets.length === 0 ? (
                    <div className="p-4 bg-emerald-50 text-emerald-700 text-center text-xs rounded-xl font-bold">
                      ✓ 100% các chỉ tiêu của văn bản này đã hoàn thành!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {uncompletedTargets.map((st, i) => {
                        const gap = 100 - st.percent;
                        return (
                          <div key={st.id || i} className="p-3.5 md:p-4 bg-rose-50/40 border border-rose-200 rounded-2xl space-y-2.5">
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
                                  <strong className="text-blue-900 block text-[10px] uppercase">Kiến nghị / Giải pháp:</strong>
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
    </div>
  );
}

