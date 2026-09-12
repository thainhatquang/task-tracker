"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { DocItem, DocLevel, SubTarget, TabType, UserAccount, UserRole } from "@/types";
import { useDocumentAI } from "@/hooks/useDocumentAI";
import { TrackerDashboard } from "@/components/TrackerDashboard";
import { TrackerSidebar } from "@/components/TrackerSidebar";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import { useUserManagement } from "@/hooks/useUserManagement";
import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";
import { AdminDocumentsTab, type AdminDocSubTab } from "@/components/admin/AdminDocumentsTab";
import { AdminTargetsTab } from "@/components/admin/AdminTargetsTab";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { ReportModal } from "@/components/reports/ReportModal";
import { PlanDetailModal } from "@/components/documents/PlanDetailModal";

export default function DocumentTaskTracker() {
  const { user: authUser, signIn: signInAuth, signOut: signOutAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("tong_quan");
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [adminDocSubTab, setAdminDocSubTab] = useState<AdminDocSubTab>("all");

  const [modalPlan, setModalPlan] = useState<DocItem | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<string>("Định kỳ tháng 09/2026");
  const [isAiGeneratingReportSection, setIsAiGeneratingReportSection] = useState(false);
  const [customAiSectionIV, setCustomAiSectionIV] = useState<string[] | null>(null);

  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [userFormUsername, setUserFormUsername] = useState("");
  const [userFormFullName, setUserFormFullName] = useState("");
  const [userFormRole, setUserFormRole] = useState<UserRole>("editor");

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "live" | "off">(() => (isSupabaseConfigured && supabase ? "connecting" : "off"));
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [statusNotice, setStatusNotice] = useState<string>("");

  const [formLevel, setFormLevel] = useState<DocLevel>("Trung ương");
  const [formDocNumber, setFormDocNumber] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formIssueDate, setFormIssueDate] = useState("");
  const [formIssuer, setFormIssuer] = useState("Ban Chấp hành Trung ương");
  const [formAssignee, setFormAssignee] = useState("");
  const [formDocUrl, setFormDocUrl] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
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
        const savedUser = JSON.parse(savedUserStr) as UserAccount | null;
        if (savedUser?.username) setCurrentUser(savedUser);
      }
    } catch {
      localStorage.removeItem("party_current_user_v21");
    }
  }, []);

  useEffect(() => {
    if (authUser) {
      setCurrentUser(authUser);
      localStorage.setItem("party_current_user_v21", JSON.stringify(authUser));
    }
  }, [authUser]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const uInput = loginUsername.trim().toLowerCase();
    const pInput = loginPassword.trim();

    if (!uInput || !pInput) {
      setLoginError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    if (isSupabaseConfigured) {
      void signInAuth(uInput, pInput)
        .then(() => {
          setIsAuthModalOpen(false);
          setLoginUsername("");
          setLoginPassword("");
          setShowLoginPassword(false);
          setLoginError("");
        })
        .catch((error: unknown) => {
          setLoginError(error instanceof Error ? error.message : "Đăng nhập Supabase thất bại.");
        });
      return;
    }

    setLoginError("Supabase Auth chưa được cấu hình. Không thể đăng nhập bằng mật khẩu cục bộ không an toàn.");
  };

  const handleLogout = () => {
    if (confirm("Đồng chí có chắc chắn muốn đăng xuất khỏi tài khoản hiện tại?")) {
      void signOutAuth();
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
  const {
    users,
    editingUser,
    isUserModalOpen,
    userFormError,
    setIsUserModalOpen,
    openUserModal,
    saveUser,
    deleteUser,
  } = useUserManagement({ canAdmin, currentUser });

  const sampleData = useMemo<DocItem[]>(() => [
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
  ], []);

  const {
    docs: remoteDocs,
    loading: remoteLoading,
    realtimeStatus: remoteRealtimeStatus,
    lastSyncTime: remoteLastSyncTime,
    statusNotice: remoteStatusNotice,
    isFetched: remoteFetched,
    refreshDocs,
  } = useTasks();
  const effectiveLoading = loading || remoteLoading;
  const effectiveRealtimeStatus = isSupabaseConfigured ? remoteRealtimeStatus : realtimeStatus;
  const effectiveLastSyncTime = remoteLastSyncTime || lastSyncTime;
  const effectiveStatusNotice = remoteStatusNotice || statusNotice;

  const loadData = useCallback(async () => {
    setLoading(true);
    if (isSupabaseConfigured) {
      await refreshDocs();
    } else {
      const saved = localStorage.getItem("party_documents_v21");
      if (saved) {
        try {
          setDocs(JSON.parse(saved) as DocItem[]);
        } catch {
          setDocs(sampleData);
        }
      } else {
        setDocs(sampleData);
      }
    }
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setLoading(false);
  }, [refreshDocs, sampleData]);

  const {
    isUploading,
    createDocument,
    updateDocument,
    deleteDocument,
    updatePlanTargets,
    setDocumentConcretized,
  } = useTaskMutations({
    docs,
    setDocs,
    setLoading,
    setLastSyncTime,
    setFormSuccessMsg,
    setSelectedPlanId,
    reload: loadData,
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      void loadData();
    }
  }, [loadData]);

  useEffect(() => {
    if (remoteFetched && isSupabaseConfigured) {
      setDocs(remoteDocs);
      setLoading(false);
    }
  }, [remoteDocs, remoteFetched]);

  useEffect(() => {
    if (!isSupabaseConfigured && docs.length > 0) {
      localStorage.setItem("party_documents_v21", JSON.stringify(docs));
    }
  }, [docs]);

  const syncFormIssuer = (level: DocLevel) => {
    if (level === "Trung ương") return "Ban Chấp hành Trung ương";
    if (level === "Thành ủy") return "Ban Thường vụ Thành ủy Cần Thơ";
    return "Đảng ủy phường Trung Nhứt";
  };

  const handleFormLevelChange = (nextLevel: DocLevel) => {
    setFormLevel(nextLevel);
    setFormIssuer(syncFormIssuer(nextLevel));
  };

  const handleOpenDocument = (doc: DocItem) => {
    const target = doc.file_url || doc.doc_url;
    if (target) {
      window.open(target, "_blank", "noopener,noreferrer");
    } else {
      alert(`Văn bản "${doc.doc_number}" hiện chưa được đính kèm tệp tải lên hoặc đường dẫn liên kết.`);
    }
  };

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await createDocument({
      canEdit,
      docNumber: formDocNumber,
      title: formTitle,
      issueDate: formIssueDate,
      issuer: formIssuer,
      level: formLevel,
      assignee: formAssignee,
      docUrl: formDocUrl,
      file: formFile,
      isConcretized: formIsConcretized,
      concretizedBy: formConcretizedBy,
      subTargets: formSubTargets,
    });
    if (!created) return;
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

  const handleUpdateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !canEdit) return;
    await updateDocument(editingDoc, formFile);
    setEditingDoc(null);
    setFormFile(null);
  };

  const handleDeleteDoc = (id: string | number) => deleteDocument(id, canAdmin);

  const handleUpdateSelectedPlanTargets = (docId: string | number, newSubTargets: SubTarget[]) =>
    updatePlanTargets(docId, newSubTargets, canEdit);

  const handleSetConcretized = (id: string | number) => setDocumentConcretized(id, canEdit);

  const handleOpenUserModal = (user?: UserAccount) => {
    const values = openUserModal(user);
    if (!values) return;
    setUserFormUsername(values.username);
    setUserFormFullName(values.fullName);
    setUserFormRole(values.role);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveUser({
      username: userFormUsername,
      fullName: userFormFullName,
      role: userFormRole,
    });
  };

  const handleDeleteUser = (id: string) => deleteUser(id);

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

  const { askAssistant } = useDocumentAI({
    docs,
    counts,
    wardPlans,
    allSubTargets,
    institutionalBottlenecks,
    uncompletedTargetList,
  });

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
    <div className="app-shell flex min-h-screen font-sans text-slate-800 antialiased selection:bg-rose-500 selection:text-white">
      {effectiveLoading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/20 backdrop-blur-[1px]">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg text-xs font-bold text-slate-700">
            Đang tải dữ liệu...
          </div>
        </div>
      )}
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      <TrackerSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        counts={counts}
        institutionalBottlenecksCount={institutionalBottlenecks.length}
        uncompletedTargetsCount={uncompletedTargetList.length}
        currentUser={currentUser}
        users={users}
        canEdit={canEdit}
        canAdmin={canAdmin}
        realtimeStatus={effectiveRealtimeStatus}
        isSupabaseConfigured={isSupabaseConfigured}
        onClearSearch={() => setSearch("")}
        onLoginRequired={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="h-[4.75rem] bg-white/80 backdrop-blur-xl border-b border-slate-200/70 px-4 md:px-7 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-2 md:gap-3 text-xs text-slate-500 font-medium">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
              title="Mở menu"
            >
              ☰
            </button>
            <span className="font-black text-slate-950 text-xs md:text-sm hidden sm:inline tracking-tight">Theo dõi nghị quyết</span>
            <span className="hidden sm:inline">›</span>
            <span className="text-rose-700 font-bold truncate max-w-[180px] sm:max-w-none">
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
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="palette-coral-button px-3 py-1.5 md:px-3.5 md:py-2 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
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
                className="palette-primary-button px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <span>🔐</span> Đăng nhập
              </button>
            )}
          </div>
        </header>

        <div className="p-4 md:p-7 max-w-[90rem] w-full mx-auto space-y-6">
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
              {effectiveLastSyncTime && (
                <span className="text-[10px] text-emerald-700 font-mono font-bold">
                  Đồng bộ: {effectiveLastSyncTime}
                </span>
              )}
            </div>
          )}

          {effectiveStatusNotice && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-bold">
              {effectiveStatusNotice}
            </div>
          )}

          {effectiveLoading && docs.length === 0 && (
            <div className="space-y-4" aria-label="Đang tải dữ liệu">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-24 w-full bg-slate-200" />
                <Skeleton className="h-24 w-full bg-slate-200" />
                <Skeleton className="h-24 w-full bg-slate-200" />
              </div>
              <SkeletonTable rows={6} />
            </div>
          )}

          <TrackerDashboard
            activeTab={activeTab}
            docs={docs}
            counts={counts}
            wardPlans={wardPlans}
            allSubTargets={allSubTargets}
            institutionalBottlenecks={institutionalBottlenecks}
            uncompletedTargetList={uncompletedTargetList}
            handleOpenDocument={handleOpenDocument}
            onOpenPlan={setModalPlan}
          />

          {(activeTab === "trung_uong" || activeTab === "thanh_uy" || activeTab === "phuong") && (
            <div className="space-y-4">
              <div className="modern-surface p-4 md:p-5 flex flex-col md:flex-row justify-between md:items-center gap-3">
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

              <div className="modern-surface overflow-hidden">
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
            <AdminDocumentsTab
              docs={docs}
              counts={counts}
              adminDocSubTab={adminDocSubTab}
              setAdminDocSubTab={setAdminDocSubTab}
              adminFilteredDocs={adminFilteredDocs}
              canEdit={canEdit}
              canAdmin={canAdmin}
              isUploading={isUploading}
              formSuccessMsg={formSuccessMsg}
              formLevel={formLevel}
              setFormLevel={setFormLevel}
              formDocNumber={formDocNumber}
              setFormDocNumber={setFormDocNumber}
              formTitle={formTitle}
              setFormTitle={setFormTitle}
              formIssueDate={formIssueDate}
              setFormIssueDate={setFormIssueDate}
              formIssuer={formIssuer}
              setFormIssuer={setFormIssuer}
              formAssignee={formAssignee}
              setFormAssignee={setFormAssignee}
              formDocUrl={formDocUrl}
              setFormDocUrl={setFormDocUrl}
              setFormFile={setFormFile}
              formIsConcretized={formIsConcretized}
              setFormIsConcretized={setFormIsConcretized}
              formConcretizedBy={formConcretizedBy}
              setFormConcretizedBy={setFormConcretizedBy}
              handleFormLevelChange={handleFormLevelChange}
              handleCreateDoc={handleCreateDoc}
              handleOpenDocument={handleOpenDocument}
              handleSetConcretized={handleSetConcretized}
              handleDeleteDoc={handleDeleteDoc}
              setEditingDoc={setEditingDoc}
            />
          )}

          {activeTab === "admin_targets" && (
            <AdminTargetsTab
              wardPlans={wardPlans}
              selectedPlan={selectedPlan}
              selectedPlanId={selectedPlanId}
              setSelectedPlanId={setSelectedPlanId}
              handleUpdateSelectedPlanTargets={handleUpdateSelectedPlanTargets}
            />
          )}

          {activeTab === "admin_users" && canAdmin && (
            <AdminUsersTab
              users={users}
              currentUser={currentUser}
              handleOpenUserModal={handleOpenUserModal}
              handleDeleteUser={handleDeleteUser}
            />
          )}
        </div>
      </main>

      {!isChatbotOpen && (
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-5 right-5 z-40 w-13 h-13 md:w-14 md:h-14 rounded-full bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-500/30 flex items-center justify-center text-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white"
          title="Mở Trợ lý AI Tham mưu"
        >
          ✨
        </button>
      )}
      <ChatInterface isOpen={isChatbotOpen} setIsOpen={setIsChatbotOpen} docs={docs} onAskAI={askAssistant} />

      <ReportModal
        isOpen={isReportModalOpen}
        reportPeriod={reportPeriod}
        onReportPeriodChange={setReportPeriod}
        isAiGenerating={isAiGeneratingReportSection}
        onGenerateAi={generateAiReportSectionIV}
        onPrint={handlePrintReport}
        onClose={() => setIsReportModalOpen(false)}
        wardPlans={wardPlans}
        counts={counts}
        allSubTargets={allSubTargets}
        completedTargetList={completedTargetList}
        uncompletedTargetList={uncompletedTargetList}
        institutionalBottlenecks={institutionalBottlenecks}
        customAiSectionIV={customAiSectionIV}
      />

      {/* MODAL CHỈNH SỬA VĂN BẢN */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-950/20 max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
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
                    onChange={(e) => setEditingDoc({ ...editingDoc, level: e.target.value as DocLevel })}
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
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-950/20 max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
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
                <label className="font-bold text-slate-700 block mb-1">Email đăng nhập <span className="text-rose-500">*</span>:</label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser}
                  placeholder="canbo@trungnhut.com"
                  value={userFormUsername}
                  onChange={(e) => setUserFormUsername(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold disabled:bg-slate-100"
                />
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
                Mật khẩu không được lưu trong bảng ứng dụng. Hãy tạo hoặc đặt lại mật khẩu cho email này tại Supabase
                Authentication → Users.
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Vai trò phân quyền:</label>
                <select
                  value={userFormRole}
                  onChange={(e) => setUserFormRole(e.target.value as UserRole)}
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
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-950/20 max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
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
                <label className="font-bold text-slate-700 block mb-1">
                  Email hoặc tên đăng nhập:
                </label>
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
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    placeholder="Nhập mật khẩu..."
                    value={loginPassword}
                    onChange={(e) => { setLoginPassword(e.target.value); setLoginError(""); }}
                    className="w-full border border-slate-300 rounded-xl p-2.5 pr-14 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-3 text-[11px] font-bold text-slate-500 hover:text-blue-600"
                    aria-label={showLoginPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                  >
                    {showLoginPassword ? "Ẩn" : "Hiện"}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <a
                  href="/forgot-password"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Quên mật khẩu?
                </a>
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

      <PlanDetailModal plan={modalPlan} onClose={() => setModalPlan(null)} />
    </div>
  );
}
