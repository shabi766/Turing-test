"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { ChatAPI, Message } from "../../../lib/api";
import { Send, CornerUpLeft, Trash2, Edit2, Check, X, Search } from "lucide-react";

export default function ChatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isChatIdValid = useMemo(() => typeof id === "string" && id.length > 5 && id !== "list", [id]);

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated || !token) router.replace("/login");
  }, [isAuthenticated, token, router]);

  // Cleanup polling
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!token || !isChatIdValid) return;
    try {
      const data = await ChatAPI.getMessages(token, id as string);
      setMessages(data);
    } catch (e: any) {
      if (isChatIdValid) setError(e?.message || "Failed to load messages");
    }
  }, [token, id, isChatIdValid]);

  useEffect(() => {
    if (isAuthenticated && token && isChatIdValid) fetchMessages();
  }, [fetchMessages, isAuthenticated, token, isChatIdValid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

  // --- STREAMING + RETRY SEND ---
  async function send() {
    if (!token || !isChatIdValid || !canSend) return;

    setSending(true);
    setError(null);
    const userMessage = input.trim();
    const tempId = `temp-${Date.now()}`;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { _id: tempId, chatId: id!, userId: "me", role: "user", content: userMessage, createdAt: new Date().toISOString() },
    ]);

    try {
      // Create streaming placeholder
      const aiTempId = `ai-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { _id: aiTempId, chatId: id!, userId: "ai", role: "ai", content: "", createdAt: new Date().toISOString() },
      ]);

      await ChatAPI.streamMessage(
        token,
        id as string,
        userMessage,
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) => (m._id === aiTempId ? { ...m, content: m.content + chunk } : m))
          );
        },
        async () => {
          await fetchMessages(); // refresh after stream ends
          setSending(false);
        },
        (err) => {
          console.error(err);
          setError("Streaming failed, please try again.");
          setSending(false);
        }
      );
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to send message");
      setSending(false);
    }
  }

  const handleRetry = async () => {
    setError(null);
    await send();
  };

  // --- Message Edit/Delete Handlers ---
  const handleEdit = (m: Message) => {
    setEditingId(m._id);
    setEditText(m.content);
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    setMessages((prev) =>
      prev.map((m) => (m._id === editingId ? { ...m, content: editText } : m))
    );
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setMessages((prev) => prev.filter((m) => m._id !== id));
  };

  const filteredMessages = useMemo(() => {
    if (!search.trim()) return messages;
    return messages.filter((m) => m.content.toLowerCase().includes(search.toLowerCase()));
  }, [search, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canSend) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-200 font-inter">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) router.back();
            else router.push("/chat/list?ts=" + Date.now());
          }}
          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition p-2 rounded-lg hover:bg-gray-700/50"
        >
          <CornerUpLeft className="w-5 h-5" />
          <span className="font-medium text-sm hidden sm:inline">Back to Chat History</span>
        </button>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-sm focus:ring-2 focus:ring-blue-400"
            placeholder="Search messages..."
          />
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {filteredMessages.map((m, index) => (
            <div key={m._id || index} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`group relative max-w-lg px-4 py-3 rounded-xl transition-all duration-300 shadow-md ${
                  m.role === "user"
                    ? "bg-blue-400 text-gray-900 rounded-br-none font-medium"
                    : "bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700"
                }`}
              >
                {editingId === m._id ? (
                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 bg-transparent border-b border-gray-500 focus:outline-none text-sm"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <button onClick={handleSaveEdit} className="text-green-400 hover:text-green-300">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    {m.content}
                    {m.role === "user" && (
                      <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 flex gap-2 text-gray-400 text-xs">
                        <button onClick={() => handleEdit(m)} className="hover:text-blue-400">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(m._id)} className="hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="max-w-xl px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 animate-pulse text-gray-500">
                AI is thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-800">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="text-red-500 text-sm mb-3 bg-red-900/20 p-2 rounded-lg flex items-center justify-between">
              <span>{error}</span>
              <button onClick={handleRetry} className="underline hover:text-red-300">
                Retry
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <input
              className="flex-1 w-full p-4 rounded-xl text-gray-200 bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 transition"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              disabled={sending}
            />
            <button
              disabled={!canSend}
              onClick={send}
              className="flex items-center justify-center bg-blue-400 text-gray-900 rounded-xl px-5 py-3 font-bold transition duration-200 transform hover:scale-[1.02] disabled:opacity-50"
            >
              {sending ? (
                <span className="animate-spin h-5 w-5 border-t-2 border-gray-900 rounded-full"></span>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
