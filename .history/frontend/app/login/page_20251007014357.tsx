"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Gem, LogIn, Mail, Lock } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

// Assuming AuthProvider is correctly set up in the path
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Call backend API for authentication
            const response = await api.post('/auth/login', { email, password });
            
            const { token, _id, email: userEmail } = response.data;

            // 2. Use AuthProvider to set session and redirect
            login(token, { _id, email: userEmail });
            
            // Redirection is handled inside AuthProvider for consistency, 
            // but we can manually push to /chats for immediate feedback if needed.
            // router.push("/chats"); 
            
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        // Full screen, black background, white text
        <div className="min-h-screen flex items-center justify-center p-4 md:p-10 bg-gray-900 text-white font-inter">
            <div className="w-full max-w-sm space-y-6 p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 transition duration-300 hover:shadow-gray-700/50">
                
                {/* Header Section */}
                <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-3 text-3xl font-bold text-blue-400">
                        <Gem className="w-8 h-8 text-blue-500" />
                        <h1>Test with Turing</h1>
                    </div>
                    <p className="text-gray-400 text-sm">Sign in to start chatting with the LLM simulation.</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email Input */}
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="email"
                            required
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-3 py-3 border border-gray-700 bg-gray-900 rounded-lg shadow-inner placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white transition"
                        />
                    </div>
                    
                    {/* Password Input */}
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="password"
                            required
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-3 py-3 border border-gray-700 bg-gray-900 rounded-lg shadow-inner placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white transition"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 transition duration-150 ease-in-out"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin h-5 w-5 border-t-2 border-r-2 border-white rounded-full"></span>
                                <span>Signing In...</span>
                            </>
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                <span>Sign In</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Footer Link */}
                <div className="text-center text-sm pt-2">
                    <p className="text-gray-400">
                        Don't have an account?{' '}
                        <Link href="/signup" className="font-medium text-blue-400 hover:text-blue-300 transition duration-150">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
