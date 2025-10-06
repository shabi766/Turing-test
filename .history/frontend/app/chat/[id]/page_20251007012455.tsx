"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ChatAPI, Message } from "@/lib/api";1
 import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

export default function ChatDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { token, isAuthenticated } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    // 💡 Improvement: Ref for auto-scrolling to the bottom of the chat area
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Auth Guard
    useEffect(() => {
        if (!isAuthenticated || !token) {
            router.replace('/login');
        }
    }, [isAuthenticated, token, router]);

    const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

    // Function to handle fetching and setting messages
    const fetchMessages = useCallback(async () => {
        if (!token || !id) return;
        try {
            const data = await ChatAPI.getMessages(token, id);
            setMessages(data);
            return data; // Return data for polling check
        } catch (e: any) {
            setError(e?.message || 'Failed to load messages');
            return null;
        }
    }, [token, id]);


    // Initial Messages Load
    useEffect(() => {
        let active = true;
        fetchMessages();
        return () => { active = false; };
    }, [fetchMessages]);

    // 💡 Improvement: Scroll to bottom whenever messages are updated
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function send() {
        if (!token || !id || !canSend) return;
        setSending(true);
        setError(null);
        
        // Clear any existing polling interval
        if (pollRef.current) clearInterval(pollRef.current);

        // Capture the message count BEFORE sending the new message
        const initialMessageCount = messages.length + 1; // Expecting user message immediately

        try {
            const res = await ChatAPI.sendMessage(token, id, input.trim());
            
            setInput("");
            // Optimistically update the UI with the user's message
            setMessages(prev => [...prev, res.userMessage]);
            
            // Start polling for AI reply
            const startedAt = Date.now();
            const MAX_POLL_TIME = 25000; // Increase max poll time to be safer than 22s for a 20s delay
            
            pollRef.current = setInterval(async () => {
                const list = await ChatAPI.getMessages(token, id);
                
                // 💡 Smart Polling Check
                const isAiReplyReceived = list.length >= initialMessageCount && list[list.length - 1].role === 'ai';
                
                setMessages(list);

                // 🛑 Stop Polling if AI message is received OR timeout is reached
                if (isAiReplyReceived || Date.now() - startedAt > MAX_POLL_TIME) {
                    if (pollRef.current) clearInterval(pollRef.current);
                    if (!isAiReplyReceived) {
                         // Optional: Handle scenario where response timed out
                         setError('AI response timed out. Please try sending your message again.');
                    }
                }
            }, 3000); // Poll every 3 seconds

        } catch (e: any) {
            setError(e?.message || 'Failed to send');
        } finally {
            // NOTE: setSending(false) should only happen when we are confident the whole process is done,
            // but for simplicity and to re-enable the send button quickly, we place it here.
            // A more complex solution might keep 'sending' true until the AI reply is detected.
            setSending(false);
        }
    }

    return (
        <div className="min-h-screen grid grid-cols-[280px_1fr]">
            <aside className="border-r p-4">
                <button className="text-sm underline" onClick={() => router.push('/chat')}>Back</button>
                {/* NOTE: In a full app, you would list other chats here 
                    (e.g., fetch the list from the parent chat/page.tsx or context)
                */}
            </aside>
            <main className="p-6 flex flex-col h-screen">
                <div className="flex-1 overflow-y-auto space-y-3">
                    {messages.map(m => (
                        <div key={m._id} className={`max-w-xl ${m.role === 'user' ? 'ml-auto text-right' : ''}`}>
                            <div className={`inline-block rounded px-3 py-2 ${m.role === 'user' ? 'bg-black text-white' : 'bg-gray-100'}`}>
                                {m.content}
                            </div>
                        </div>
                    ))}
                    {/* 💡 Improvement: Div to trigger auto-scrolling */}
                    <div ref={messagesEndRef} />
                </div>
                
                {/* Visual cue for pending AI response (while polling is active) */}
                {pollRef.current && !sending && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                    <div className="max-w-xl mt-3">
                        <div className="inline-block rounded px-3 py-2 bg-gray-200 animate-pulse text-gray-500">
                            AI is thinking...
                        </div>
                    </div>
                )}

                {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
                
                <div className="mt-4 flex gap-2">
                    <input 
                        className="flex-1 border rounded p-2" 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        placeholder="Type your message..." 
                        disabled={sending} // Disable input while sending
                    />
                    <button disabled={!canSend} onClick={send} className="bg-black text-white rounded px-4 disabled:opacity-50">
                        {sending ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </main>
        </div>
    );
}

// NOTE: You will need to add useCallback import to the top of the file:
// import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";