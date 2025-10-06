"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
// These types and APIs are required for application logic:
import { Chat, ChatAPI } from "../../lib/api"; 
import { Plus, LogOut, MessageSquare } from "lucide-react"; // Imported Lucide icons

// Define the component using the improved UI/UX
export default function ChatListPage() {
    const { isAuthenticated, token, logout } = useAuth();
    const router = useRouter();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Authentication and Data Fetching Logic
    useEffect(() => {
        if (!isAuthenticated || !token) {
            router.replace('/login');
            return;
        }

        let active = true;
        
        // Function to fetch the chat list
        const fetchChats = async () => {
            try {
                const list = await ChatAPI.listChats(token);
                if (active) setChats(list);
            } catch (e: any) {
               
                if (e?.response?.status === 401) {
                
                    logout();
                    router.replace('/login');
                } else {
                    setError(e?.message || 'Failed to load chats');
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchChats();

        return () => { active = false; };
    }, [isAuthenticated, token, router, logout]);

    // Handler for creating a new chat
    async function onCreate() {
        if (!token) return;
        try {
            const chat = await ChatAPI.createChat(token);
            router.push(`/chat/${chat._id}`);
        } catch (e) {
            // Error handling for chat creation
            setError('Failed to create new chat.');
        }
    }

    return (
        // Main container: full screen height, dark background, responsive grid
        <div className="min-h-screen flex bg-gray-900 text-gray-200 font-inter">
            
            {/* Sidebar (Chat List) */}
            {/* Uses bg-gray-800 for contrast with main background */}
            <aside className="w-64 flex-shrink-0 bg-gray-800 border-r border-gray-700 p-5 space-y-6 flex flex-col h-screen md:w-72">
                
                {/* Sidebar Header and Logout Button */}
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
                
                {/* New Chat Button (Primary Accent CTA) */}
                <button 
                    className="w-full flex items-center justify-center space-x-2 bg-blue-400 text-gray-900 font-bold py-3 rounded-xl shadow-lg shadow-blue-400/20 hover:bg-blue-300 transition duration-200 transform hover:scale-[1.01] disabled:opacity-50" 
                    onClick={onCreate}
                    disabled={loading}
                >
                    <Plus className="w-5 h-5" />
                    <span>New Chat</span>
                </button>
                
                {/* Chat List */}
                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                    {loading ? (
                        <div className="flex items-center space-x-2 text-sm text-gray-500 pt-4">
                            <span className="animate-spin h-4 w-4 border-t-2 border-blue-400 rounded-full"></span>
                            <p>Loading chats...</p>
                        </div>
                    ) : error ? (
                        <p className="text-sm text-red-500 bg-red-900/20 p-3 rounded-lg border border-red-800 mt-4">{error}</p>
                    ) : (
                        <ul className="space-y-1">
                            {chats.length > 0 ? (
                                chats.map(c => (
                                    <li key={c._id}>
                                        <button 
                                            // Highlighted hover state with a blue accent border
                                            className="w-full text-left p-3 text-sm truncate rounded-lg hover:bg-gray-700/70 transition duration-150 cursor-pointer text-gray-300 border border-transparent hover:border-blue-400/50" 
                                            onClick={() => router.push(`/chat/${c._id}`)}
                                        >
                                            {c.title || `Untitled Chat (${c._id.substring(0, 4)}...)`}
                                        </button>
                                    </li>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 pt-4 text-center">No chats yet. Start a new one!</p>
                            )}
                        </ul>
                    )}
                </div>
            </aside>
            
            {/* Main Content Area (Default View) */}
            <main className="flex-grow p-6 flex flex-col items-center justify-center text-center text-gray-500 bg-gray-900">
                <div className="space-y-4">
                    <MessageSquare className="w-16 h-16 text-gray-700 mx-auto" />
                    <h1 className="text-2xl font-semibold text-gray-400">LLM Simulation Dashboard</h1>
                    <p className="text-base text-gray-500 max-w-md">
                        Your conversation history is on the left. To begin, click **New Chat** or select an existing conversation.
                    </p>
                </div>
            </main>
        </div>
    );
}
