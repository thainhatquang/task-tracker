import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, DocItem } from '@/types';

interface ChatInterfaceProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  docs: DocItem[];
  onAskAI?: (query: string) => Promise<string | void>;
}

export const ChatInterface = ({ isOpen, setIsOpen, docs, onAskAI }: ChatInterfaceProps) => {
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

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isAiThinking]);

  const handleSendMessage = async (query: string) => {
    if (!query.trim()) return;
    
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setAiQuery("");
    setIsAiThinking(true);
    const aiMsgId = `gemini-${Date.now()}`;
    
    try {
      // Create an empty AI message that we will update as chunks arrive
      setChatMessages(prev => [...prev, {
        id: aiMsgId,
        sender: "gemini",
        text: "",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      if (onAskAI) {
        const reply = await onAskAI(query);
        setChatMessages(prev => prev.map(msg =>
          msg.id === aiMsgId ? { ...msg, text: reply || "Không có dữ liệu trả lời." } : msg
        ));
      } else {
        const response = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, docs })
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;

          setChatMessages(prev => prev.map(msg =>
            msg.id === aiMsgId ? { ...msg, text: accumulatedText } : msg
          ));
        }
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setChatMessages(prev => prev.map(msg => 
        msg.id === aiMsgId ? { ...msg, text: "Có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại." } : msg
      ));
    } finally {
      setIsAiThinking(false);
    }
  };

  const clearChat = () => {
    setChatMessages([
      {
        id: `m-${Date.now()}`,
        sender: "gemini",
        text: "Lịch sử tra cứu đã làm mới. Đồng chí cần tra cứu gì ạ?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-[calc(100vw-2rem)] md:w-96 h-[min(36rem,calc(100vh-2rem))] bg-white rounded-[1.75rem] shadow-2xl shadow-slate-950/20 border border-slate-200 flex flex-col z-50 animate-in slide-in-from-bottom-10 duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold">AI</div>
          <div>
            <h4 className="font-bold text-xs leading-tight">Trợ lý AI Tham mưu</h4>
            <div className="text-[9px] text-blue-200">Dữ liệu số thực tế Đảng bộ phường</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="text-slate-300 hover:text-white text-[11px] px-2.5 py-1 rounded-lg bg-white/10 transition"
          >
            Làm mới
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white p-1 text-base font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-slate-50 to-blue-50/30 text-xs">
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

      {/* Quick Actions */}
      <div className="px-3 py-2 bg-white border-t border-slate-100 flex flex-wrap gap-1.5 shrink-0">
        <button
          onClick={() => handleSendMessage("Điểm nghẽn thể chế hiện tại là gì?")}
          className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 cursor-pointer transition"
        >
          ⚠️ Điểm nghẽn thể chế
        </button>
        <button
          onClick={() => handleSendMessage("Chỉ tiêu nào đang chậm tiến độ?")}
          className="px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200 cursor-pointer transition"
        >
          🎯 Chỉ tiêu chậm
        </button>
        <button
          onClick={() => handleSendMessage("Nghị quyết 57-NQ/TW là gì?")}
          className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200 cursor-pointer transition"
        >
          📄 57-NQ/TW
        </button>
      </div>

      {/* Input Area */}
      <div className="p-2.5 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(aiQuery);
          }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            placeholder="Hỏi về văn bản, thể chế, chỉ tiêu..."
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
          />
          <button
            type="submit"
            disabled={isAiThinking || !aiQuery.trim()}
            className="palette-primary-button px-3.5 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  );
};
