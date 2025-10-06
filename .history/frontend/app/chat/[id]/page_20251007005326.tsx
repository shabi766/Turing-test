"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ChatAPI, Message } from "@/lib/api";

export default function ChatDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { token, isAuthenticated } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isAuthenticated || !token) {
            router.replace('/login');
        }
    }, [isAuthenticated, token, router]);

    const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

    useEffect(() => {
        if (!token || !id) return;
        let active = true;
        const fetchMessages = async () => {
            try {
                const data = await ChatAPI.getMessages(token, id);
                if (active) setMessages(data);
            } catch (e: any) {
                setError(e?.message || 'Failed to load messages');
            }
        };
        fetchMessages();
        return () => { active = false; };
    }, [token, id]);

    async function send() {
        if (!token || !id || !canSend) return;
        setSending(true);
        setError(null);
        try {
            const res = await ChatAPI.sendMessage(token, id, input.trim());
            setInput("");
            setMessages(prev => [...prev, res.userMessage]);
            // Begin polling for AI reply for a short period
            if (pollRef.current) clearInterval(pollRef.current);
            const startedAt = Date.now();
            pollRef.current = setInterval(async () => {
                const list = await ChatAPI.getMessages(token, id);
                setMessages(list);
                if (Date.now() - startedAt > 22000) {
                    if (pollRef.current) clearInterval(pollRef.current);
                }
            }, 3000);
        } catch (e: any) {
            setError(e?.message || 'Failed to send');
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="min-h-screen grid grid-cols-[280px_1fr]">
            <aside className="border-r p-4">
                <button className="text-sm underline" onClick={() => router.push('/chat')}>Back</button>
            </aside>
            <main className="p-6 flex flex-col">
                <div className="flex-1 overflow-auto space-y-3">
                    {messages.map(m => (
                        <div key={m._id} className={`max-w-xl ${m.role === 'user' ? 'ml-auto text-right' : ''}`}>
                            <div className={`inline-block rounded px-3 py-2 ${m.role === 'user' ? 'bg-black text-white' : 'bg-gray-100'}`}>
                                {m.content}
                            </div>
                        </div>
                    ))}
                </div>
                {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
                <div className="mt-4 flex gap-2">
                    <input className="flex-1 border rounded p-2" value={input} onChange={e => setInput(e.target.value)} placeholder="Type your message..." />
                    <button disabled={!canSend} onClick={send} className="bg-black text-white rounded px-4 disabled:opacity-50">
                        {sending ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </main>
        </div>
    );
}


