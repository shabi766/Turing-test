"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Chat, ChatAPI } from "@/lib/api";

export default function ChatListPage() {
    const { isAuthenticated, token, logout } = useAuth();
    const router = useRouter();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated || !token) {
            router.replace('/login');
            return;
        }
        let active = true;
        (async () => {
            try {
                const list = await ChatAPI.listChats(token);
                if (active) setChats(list);
            } catch (e: any) {
                setError(e?.message || 'Failed to load chats');
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [isAuthenticated, token, router]);

    async function onCreate() {
        if (!token) return;
        const chat = await ChatAPI.createChat(token);
        router.push(`/chat/${chat._id}`);
    }

    return (
        <div className="min-h-screen grid grid-cols-[280px_1fr]">
            <aside className="border-r p-4 space-y-2">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">Chats</h2>
                    <button className="text-sm underline" onClick={logout}>Logout</button>
                </div>
                <button className="w-full border rounded p-2 mb-4" onClick={onCreate}>New Chat</button>
                {loading ? (
                    <p className="text-sm text-gray-600">Loading...</p>
                ) : error ? (
                    <p className="text-sm text-red-600">{error}</p>
                ) : (
                    <ul className="space-y-1">
                        {chats.map(c => (
                            <li key={c._id}>
                                <button className="w-full text-left p-2 hover:bg-gray-50 rounded" onClick={() => router.push(`/chat/${c._id}`)}>
                                    {c.title}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </aside>
            <main className="p-6 flex items-center justify-center text-gray-500">
                Select a chat or create a new one.
            </main>
        </div>
    );
}


