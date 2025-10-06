"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ChatAPI, Message } from "@/lib/api";
import { Send, CornerUpLeft } from "lucide-react";

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

    // Helper to check if the ID is definitely a valid chat ID (not the string 'list')
    // We assume a valid chat ID is longer than a short word like 'list'.
    const isChatIdValid = useMemo(() => {
        return typeof id === 'string' && id.length > 5 && id !== 'list';
    }, [id]);

    // --- Effects ---

    // 1. Initial Auth Guard
    useEffect(() => {
        if (!isAuthenticated || !token) {
            router.replace('/login');
        }
    }, [isAuthenticated, token, router]);

    // 2. Cleanup Polling Interval on Component Unmount (Prevents memory leaks/navigation blocking)
    useEffect(() => {
        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, []);

    // 3. Memoized function to handle fetching and setting messages
    const fetchMessages = useCallback(async () => {
        // FIX: Strict validation of the ID to prevent API calls with invalid slugs like 'list'
        if (!token || !isChatIdValid) return; 

        try {
            const data = await ChatAPI.getMessages(token, id as string);
            setMessages(data);
            return data;
        } catch (e: any) {
            // Only set error if it's not a generic Bad Request from a temporary invalid ID
            if (isChatIdValid) {
                setError(e?.message || 'Failed to load messages');
            }
            return null;
        }
    }, [token, id, isChatIdValid]); // Dependency updated to include isChatIdValid

    // 4. Initial Messages Load
    useEffect(() => {
        // Only fetch if authenticated and the ID is confirmed valid
        if (isAuthenticated && token && isChatIdValid) {
            fetchMessages();
        }
    }, [fetchMessages, isAuthenticated, token, isChatIdValid]);

    // 5. Scroll to bottom whenever messages are updated
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // --- Functions ---

    const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

    async function send() {
        // FIX: Use isChatIdValid for the most reliable check before sending
        if (!token || !isChatIdValid || !canSend) return; 

        setSending(true);
        setError(null);
        
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }

        const initialMessageCount = messages.length + 1;
        const userMessageContent = input.trim();
        setInput("");

        try {
            const tempId = `temp-${Date.now()}`; 
            setMessages(prev => [
                ...prev,
                {
                    _id: tempId,
                    chatId: id as string,
                    content: userMessageContent,
                    role: "user",
                    userId: "me",
                    createdAt: new Date().toISOString()
                } as Message
            ]);
            
            await ChatAPI.sendMessage(token, id as string, userMessageContent);
            
            const startedAt = Date.now();
            const MAX_POLL_TIME = 25000;
            
            // Start polling for AI response
            pollRef.current = setInterval(async () => {
                // Ensure we don't accidentally call API if component is halfway unmounting
                if (!isChatIdValid) {
                    if (pollRef.current) clearInterval(pollRef.current);
                    return;
                }
                
                const list = await ChatAPI.getMessages(token, id as string);
                
                const isAiReplyReceived = list.length >= initialMessageCount && list[list.length - 1].role === 'ai';
                
                setMessages(list);

                if (isAiReplyReceived || Date.now() - startedAt > MAX_POLL_TIME) {
                    if (pollRef.current) {
                        clearInterval(pollRef.current);
                        pollRef.current = null;
                    }
                    setSending(false);

                    if (!isAiReplyReceived && Date.now() - startedAt > MAX_POLL_TIME) {
                        setError('AI response timed out. Please try sending your message again.');
                    }
                }
            }, 3000);

        } catch (e: any) {
            setError(e?.message || 'Failed to send message.');
            setSending(false);
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        }
    }

    // Helper for keydown event (e.g., Enter key)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && canSend) {
            e.preventDefault();
            send();
        }
    };

    // --- Render ---

    return (
        <div className="min-h-screen flex flex-col bg-gray-900 text-gray-200 font-inter">
            
            {/* Header / Back Button */}
            <header className="flex-shrink-0 flex items-center p-4 border-b border-gray-700 bg-gray-800">
                <button 
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition duration-150 p-2 rounded-lg hover:bg-gray-700/50" 
                    onClick={() => router.push('/chat/list')}
                    aria-label="Go back to chat list"
                >
                    <CornerUpLeft className="w-5 h-5" />
                    <span className="font-medium text-sm hidden sm:inline">Back to Chat History</span>
                </button>
            </header>

            {/* Main Chat Area */}
            <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    {messages.map((m, index) => (
                        <div key={m._id || index} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {/* Message Bubble */}
                            <div className={`
                                max-w-lg md:max-w-xl
                                px-4 py-3 rounded-xl 
                                shadow-md transition-all duration-300
                                ${m.role === 'user' 
                                    ? 'bg-blue-400 text-gray-900 rounded-br-none font-medium' 
                                    : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
                                }
                            `}>
                                {m.content}
                            </div>
                        </div>
                    ))}
                    
                    {/* Visual cue for pending AI response (while polling is active) */}
                    {sending || (pollRef.current && messages.length > 0 && messages[messages.length - 1].role === 'user') ? (
                        <div className="flex justify-start">
                            <div className="max-w-xl px-4 py-3 rounded-xl rounded-tl-none bg-gray-800 border border-gray-700 animate-pulse text-gray-500">
                                AI is thinking...
                            </div>
                        </div>
                    ) : null}

                    {/* Div to trigger auto-scrolling */}
                    <div ref={messagesEndRef} />
                </div>
            </main>
            
            {/* Input Footer */}
            <footer className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-800">
                <div className="max-w-4xl mx-auto">
                    {error && <p className="text-red-500 text-sm mb-3 bg-red-900/20 p-2 rounded-lg">{error}</p>}
                    
                    <div className="flex gap-3">
                        <input 
                            className="flex-1 w-full p-4 rounded-xl text-gray-200 bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 transition" 
                            value={input} 
                            onChange={e => setInput(e.target.value)} 
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message here..." 
                            disabled={sending}
                        />
                        <button 
                            disabled={!canSend} 
                            onClick={send} 
                            className="flex items-center justify-center bg-blue-400 text-gray-900 rounded-xl px-5 py-3 font-bold transition duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                            aria-label={sending ? 'Sending message' : 'Send message'}
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
