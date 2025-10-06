"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { ChatAPI, Message } from "../../../lib/api";
import { Send, CornerUpLeft, Edit, Trash2, RefreshCw, Search } from "lucide-react";

export default function ChatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();

  // --- States ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<Message | null>(null);

  const streamBuffer = useRef("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Validation ---
  const isChatIdValid = useMemo(
    () => typeof id === "string" && id.length > 5 && id !== "list",
    [id]
  );

  // --- Auth Check ---
  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.replace("/login");
    }
  }, [isAuthenticated, token, router]);

  // --- Fetch Messages ---
  const fetchMessages = useCallback(async () => {
    if (!token || !isChatIdValid) return;
    try {
      const data = await ChatAPI.getMessages(token, id as string);
      setMessages(data);
      return data;
    } catch (e: any) {
      if (isChatIdValid) setError(e?.message || "Failed to load messages");
      return null;
    }
  }, [token, id, isChatIdValid]);

  useEffect(() => {
    if (isAuthenticated && token && isChatIdValid) fetchMessages();
  }, [fetchMessages, isAuthenticated, token, isChatIdValid]);

  // --- Auto scroll to bottom ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const canSend = useMemo(
    () => input.trim().length > 0 && !sending,
    [input, sending]
  );

  // --- Streaming Send ---
  async function sendMessage() {
    if (!token || !isChatIdValid || !canSend) return;
    setSending(true);
    setError(null);

    const userContent = input.trim();
    setInput("");

    const tempId = `temp-${Date.now()}`;
    const newUserMessage: Message = {
      _id: tempId,
      chatId: id as string,
      content: userContent,
      role: "user",
      userId: "me",
      createdAt: new Date().toISOString(),
    };

    const tempAiMessage: Message = {
      _id: `ai-temp-${Date.now()}`,
      chatId: id as string,
      content: "",
      role: "ai",
      userId: "ai",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMessage, tempAiMessage]);

    ChatAPI.streamMessage(
      token,
      id as string,
      userContent,
      (chunk) => {
        streamBuffer.current += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m._id === tempAiMessage._id
              ? { ...m, content: streamBuffer.current }
              : m
          )
        );
      },
      async () => {
        streamBuffer.current = "";
        setSending(false);
        await fetchMessages();
      },
      (err) => {
        setError("Streaming failed. Please retry.");
        setSending(false);
        setRetryMessage(newUserMessage);
      }
    );
  }

  // --- Retry failed send ---
  const retrySend = async () => {
    if (!retryMessage) return;
    setInput(retryMessage.content);
    setRetryMessage(null);
  };

  // --- Edit message ---
  const saveEdit = async (msgId: string, newContent: string) => {
    try {
      setMessages((prev) =>
        prev.map((m) => (m._id === msgId ? { ...m, content: newContent } : m))
      );
      setEditingId(null);
      // You can optionally call an API for updating message content
    } catch (err) {
      setError("Failed to update message.");
    }
  };

  // --- Delete message ---
  const deleteMessage = async (msgId: string) => {
    try {
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
      // Optionally call API to delete message
    } catch {
      setError("Failed to delete message.");
    }
  };

  // --- Search ---
  const filteredMessages = useMemo(() => {
    if (!searchTerm.trim()) return messages;
    const lower = searchTerm.toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(lower));
  }, [messages, searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canSend) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-200 font-inter">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        <button
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.push("/chat/list?ts=" + Date.now());
          }}
          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-gray-700/50 transition"
        >
          <CornerUpLeft className="w-5 h-5" />
          <span className="hidden sm:inline font-medium text-sm">
            Back to Chat History
          </span>
        </button>
        <div className="flex items-center gap-2 bg-gray-700/40 px-3 py-2 rounded-lg">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            className="bg-transparent outline-none text-sm text-gray-200 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {filteredMessages.map((m) => (
            <div
              key={m._id}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`relative group max-w-lg md:max-w-xl px-4 py-3 rounded-xl shadow-md transition-all duration-300 ${
                  m.role === "user"
                    ? "bg-blue-400 text-gray-900 rounded-br-none font-medium"
                    : "bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700"
                }`}
              >
                {editingId === m._id ? (
                  <input
                    type="text"
                    defaultValue={m.content}
                    className="bg-gray-700 text-gray-100 w-full p-2 rounded-lg"
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        saveEdit(m._id, (e.target as HTMLInputElement).value);
                    }}
                  />
                ) : (
                  m.content
                )}

                {m.role === "user" && (
                  <div className="absolute -top-6 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() =>
                        editingId === m._id
                          ? setEditingId(null)
                          : setEditingId(m._id)
                      }
                      className="text-gray-400 hover:text-blue-400"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMessage(m._id)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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

      {/* Footer */}
      <footer className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-800">
        <div className="max-w-4xl mx-auto">
          {error && (
            <p className="text-red-500 text-sm mb-3 bg-red-900/20 p-2 rounded-lg flex items-center justify-between">
              {error}
              {retryMessage && (
                <button
                  onClick={retrySend}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                >
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              )}
            </p>
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
              onClick={sendMessage}
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
