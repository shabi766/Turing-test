"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { Chat, ChatAPI } from "../../lib/api";
import { Plus, LogOut, MessageSquare, Search } from "lucide-react";

export default function ChatListPage() {
  const { isAuthenticated, token, logout } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); // 👈 new state for search input
  const [searchLoading, setSearchLoading] = useState(false);

  // 🔹 Fetch user chats
  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.replace("/login");
      return;
    }

    let active = true;

    const fetchChats = async (query?: string) => {
      try {
        setLoading(true);
        const list = await ChatAPI.listChats(token, query);
        if (active) setChats(list);
      } catch (e: any) {
        if (e?.response?.status === 401) {
          logout();
          router.replace("/login");
        } else {
          setError(e?.message || "Failed to load chats");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchChats();

    return () => {
      active = false;
    };
  }, [isAuthenticated, token, router, logout]);

  // 🔹 Debounced search logic
  useEffect(() => {
    if (!token || searchTerm.trim() === "") return;
    const delay = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const results = await ChatAPI.listChats(token, searchTerm);
        setChats(results);
      } catch (e) {
        setError("Failed to search chats");
      } finally {
        setSearchLoading(false);
      }
    }, 400); // debounce by 400ms

    return () => clearTimeout(delay);
  }, [searchTerm, token]);

  // 🔹 Create new chat handler
  async function onCreate() {
    if (!token) return;
    try {
      const chat = await ChatAPI.createChat(token);
      router.push(`/chat/${chat._id}`);
    } catch {
      setError("Failed to create new chat.");
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-900 text-gray-200 font-inter">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-gray-800 border-r border-gray-700 p-5 space-y-6 flex flex-col h-screen md:w-72">
        {/* Header + Logout */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-700/50">
          <h2 className="text-xl font-bold text-blue-400 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Chat History</span>
          </h2>
          <button
            className="text-sm font-medium text-gray-400 hover:text-red-400 transition duration-150 flex items-center space-x-1 p-1 rounded hover:bg-gray-700"
            onClick={logout}
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

        {/* New Chat */}
        <button
          className="w-full flex items-center justify-center space-x-2 bg-blue-400 text-gray-900 font-bold py-3 rounded-xl shadow-lg shadow-blue-400/20 hover:bg-blue-300 transition duration-200 transform hover:scale-[1.01] disabled:opacity-50"
          onClick={onCreate}
          disabled={loading}
        >
          <Plus className="w-5 h-5" />
          <span>New Chat</span>
        </button>

        {/* 🔍 Search Input */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 text-gray-200 placeholder-gray-400 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {searchLoading && (
            <span className="absolute right-3 top-3 h-3 w-3 border-t-2 border-blue-400 rounded-full animate-spin"></span>
          )}
        </div>

        {/* Chat List */}
        <div className="flex-grow overflow-y-auto space-y-2 pr-2">
          {loading ? (
            <div className="flex items-center space-x-2 text-sm text-gray-500 pt-4">
              <span className="animate-spin h-4 w-4 border-t-2 border-blue-400 rounded-full"></span>
              <p>Loading chats...</p>
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 bg-red-900/20 p-3 rounded-lg border border-red-800 mt-4">
              {error}
            </p>
          ) : (
            <ul className="space-y-1">
              {chats.length > 0 ? (
                chats.map((c) => (
                  <li key={c._id}>
                    <button
                      className="w-full text-left p-3 text-sm truncate rounded-lg hover:bg-gray-700/70 transition duration-150 cursor-pointer text-gray-300 border border-transparent hover:border-blue-400/50"
                      onClick={() => router.push(`/chat/${c._id}`)}
                    >
                      {c.title || `Untitled Chat (${c._id.substring(0, 4)}...)`}
                    </button>
                  </li>
                ))
              ) : (
                <p className="text-sm text-gray-500 pt-4 text-center">
                  No chats found.
                </p>
              )}
            </ul>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 flex flex-col items-center justify-center text-center text-gray-500 bg-gray-900">
        <div className="space-y-4">
          <MessageSquare className="w-16 h-16 text-gray-700 mx-auto" />
          <h1 className="text-2xl font-semibold text-gray-400">
            LLM Simulation Dashboard
          </h1>
          <p className="text-base text-gray-500 max-w-md">
            Your conversation history is on the left. Click{" "}
            <strong>New Chat</strong> or select an existing conversation to
            begin.
          </p>
        </div>
      </main>
    </div>
  );
}
