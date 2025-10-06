"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ChatAPI, Message } from "@/lib/api";1


export default function ChatDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { token, isAuthenticated } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isAuthenticated || !token) {
            router.replace('/login');
        }
    }, [isAuthenticated, token, router]);

    const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

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


    useEffect(() => {
        let active = true;
        fetchMessages();
        return () => { active = false; };
    }, [fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function send() {
        if (!token || !id || !canSend) return;
        setSending(true);
        setError(null);
        
 
        if (pollRef.current) clearInterval(pollRef.current);


        const initialMessageCount = messages.length + 1; // Expecting user message immediately

        try {
            const res = await ChatAPI.sendMessage(token, id, input.trim());
            
            setInput("");
         
            setMessages(prev => [...prev, res.userMessage]);
            
         
            const startedAt = Date.now();
            const MAX_POLL_TIME = 25000; // Increase max poll time to be safer than 22s for a 20s delay
            
            pollRef.current = setInterval(async () => {
                const list = await ChatAPI.getMessages(token, id);
                
                const isAiReplyReceived = list.length >= initialMessageCount && list[list.length - 1].role === 'ai';
                
                setMessages(list);

       
                if (isAiReplyReceived || Date.now() - startedAt > MAX_POLL_TIME) {
                    if (pollRef.current) clearInterval(pollRef.current);
                    if (!isAiReplyReceived) {
                       
                         setError('AI response timed out. Please try sending your message again.');
                    }
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
            <main className="p-6 flex flex-col h-screen">
                <div className="flex-1 overflow-y-auto space-y-3">
                    {messages.map(m => (
                        <div key={m._id} className={`max-w-xl ${m.role === 'user' ? 'ml-auto text-right' : ''}`}>
                            <div className={`inline-block rounded px-3 py-2 ${m.role === 'user' ? 'bg-black text-white' : 'bg-gray-100'}`}>
                                {m.content}
                            </div>
                        </div>
                    ))}
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
