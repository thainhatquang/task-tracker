"use client";

import React, { useState, useEffect } from "react";

interface Task {
  id: string;
  title: string;
  assignee: string;
  deadline: string;
  priority: "Khẩn cấp" | "Bình thường";
  status: "Chưa thực hiện" | "Đang thực hiện" | "Hoàn thành";
}

export default function TaskTracker() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<"Khẩn cấp" | "Bình thường">("Bình thường");
  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [search, setSearch] = useState("");

  // Tự động tải dữ liệu từ bộ nhớ máy tính
  useEffect(() => {
    const saved = localStorage.getItem("my_tasks");
    if (saved) {
      try { setTasks(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  // Tự động lưu dữ liệu khi có thay đổi
  useEffect(() => {
    localStorage.setItem("my_tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      assignee: assignee || "Chưa phân công",
      deadline: deadline || "Không có",
      priority,
      status: "Chưa thực hiện",
    };
    setTasks([newTask, ...tasks]);
    setTitle("");
    setAssignee("");
    setDeadline("");
  };

  const updateStatus = (id: string, newStatus: Task["status"]) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const deleteTask = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa nhiệm vụ này?")) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filterStatus === "Tất cả" || task.status === filterStatus;
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
                          task.assignee.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "Hoàn thành").length;
  const inProgress = tasks.filter(t => t.status === "Đang thực hiện").length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-800 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="border-b pb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Trang Theo Dõi Nhiệm Vụ</h1>
          <p className="text-sm text-slate-500 mt-1">Hệ thống quản lý và giám sát tiến độ công việc</p>
        </header>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="text-xs text-slate-500 uppercase">Tổng nhiệm vụ</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="text-xs text-blue-500 uppercase">Đang thực hiện</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{inProgress}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="text-xs text-green-500 uppercase">Đã hoàn thành</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{completed}</div>
          </div>
        </div>

        {/* Form thêm mới */}
        <form onSubmit={addTask} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-3">
          <div className="font-semibold text-sm text-slate-700">Thêm nhiệm vụ mới</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Tên nhiệm vụ *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border p-2 rounded text-sm w-full md:col-span-2"
              required
            />
            <input
              type="text"
              placeholder="Người phụ trách"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="border p-2 rounded text-sm w-full"
            />
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="border p-2 rounded text-sm w-full"
            />
          </div>
          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Độ ưu tiên:</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="border p-1.5 rounded text-xs bg-white"
              >
                <option value="Bình thường">Bình thường</option>
                <option value="Khẩn cấp">Khẩn cấp</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
            >
              + Thêm nhiệm vụ
            </button>
          </div>
        </form>

        {/* Tìm kiếm và Lọc */}
        <div className="flex flex-col md:flex-row justify-between gap-3">
          <input
            type="text"
            placeholder="Tìm theo tên nhiệm vụ hoặc người phụ trách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded text-sm w-full md:w-80 bg-white"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Lọc trạng thái:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border p-2 rounded text-sm bg-white"
            >
              <option value="Tất cả">Tất cả</option>
              <option value="Chưa thực hiện">Chưa thực hiện</option>
              <option value="Đang thực hiện">Đang thực hiện</option>
              <option value="Đà hoàn thành">Đã hoàn thành</option>
            </select>
          </div>
        </div>

        {/* Danh sách nhiệm vụ */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 border-b">
              <tr>
                <th className="p-3">Nhiệm vụ</th>
                <th className="p-3">Người phụ trách</th>
                <th className="p-3">Hạn chót</th>
                <th className="p-3">Ưu tiên</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400">Không có nhiệm vụ nào</td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-800">{task.title}</td>
                    <td className="p-3 text-slate-600">{task.assignee}</td>
                    <td className="p-3 text-slate-600">{task.deadline}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${task.priority === "Khẩn cấp" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <select
                        value={task.status}
                        onChange={(e) => updateStatus(task.id, e.target.value as any)}
                        className={`text-xs border p-1 rounded font-medium ${
                          task.status === "Hoàn thành" ? "bg-green-50 text-green-700 border-green-200" :
                          task.status === "Đang thực hiện" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }`}
                      >
                        <option value="Chưa thực hiện">Chưa thực hiện</option>
                        <option value="Đang thực hiện">Đang thực hiện</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}