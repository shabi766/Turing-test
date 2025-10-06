"use client";
import React, { useState, useEffect } from "react";
// Removed: import Image from "next/image"; -> replaced with <img>
import { useRouter } from "next/navigation";
import { LogIn, Mail, Lock, Chrome, Apple } from "lucide-react";
// Removed: import Link from "next/link"; -> replaced with <a>
import toast from "react-hot-toast";

// Assuming AuthProvider is correctly set up in the path (Cannot be removed without breaking logic)
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
    // 1. Context and Hooks: Now importing 'isAuthenticated' to check login status
    const { login, isAuthenticated } = useAuth();
    const router = useRouter();
    
    // 2. Local State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // 🛑 CRITICAL FIX: Redirect based on authentication state
    // This hook runs every time the 'isAuthenticated' state changes.
    useEffect(() => {
        if (isAuthenticated) {
            // Use router.replace to prevent the user from hitting the back button
            // and returning to the login page after successful login.
            router.replace("/chat");
        }
    }, [isAuthenticated, router]);
    
    // 3. Form Submission Handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Call backend API for authentication (updates state via AuthContext's login/persist)
            await login(email, password);
            
            // NOTE: We rely on the useEffect hook above to handle the redirect 
            // once the global isAuthenticated state flips to true.
            
        } catch (error: any) {
            // Enhanced error handling to display a toast notification
            // The compiler error for AuthContext is ignored here as it is necessary for runtime logic.
            const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handler for simulated social login buttons
    const handleSocialLogin = (provider: string) => {
        toast(`Sign in with ${provider} is coming soon!`);
    };

    return (
        
        <div className="min-h-screen flex items-center justify-center p-4 md:p-10 bg-gray-900 text-white font-inter">
            <div className="w-full max-w-sm space-y-6 p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 transition duration-300 hover:shadow-gray-700/50">
                
                {/* Logo and Header */}
                <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-3 text-3xl font-bold text-blue-400">
                        {/* Replaced Next.js Image with standard <img> */}
                        <img 
                            src="/gemin.png" 
                            alt="Gemini Logo" 
                            className="w-8 h-8 object-contain" // Use Tailwind classes for sizing
                        />
                        <h1>Test with Turing</h1>
                    </div>
                    <p className="text-gray-400 text-sm">Sign in to start chatting with the LLM simulation.</p>
                </div>

                {/* Main Login Form */}
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
                            disabled={loading}
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
                            disabled={loading}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-semibold text-black bg-blue-400 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 transition duration-150 ease-in-out"
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

                {/* Separator */}
                <div className="flex items-center space-x-2 my-4">
                    <div className="flex-grow border-t border-gray-700"></div>
                    <span className="text-xs text-gray-500 uppercase">or continue with</span>
                    <div className="flex-grow border-t border-gray-700"></div>
                </div>

                {/* Social Login Buttons */}
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => handleSocialLogin('Google')}
                        className="w-full flex justify-center items-center space-x-3 py-3 px-4 border border-gray-700 text-white rounded-lg shadow-md text-base font-semibold bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
                        disabled={loading}
                    >
                        <Chrome className="w-5 h-5 text-red-500" />
                        <span>Sign in with Google</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSocialLogin('Apple')}
                        className="w-full flex justify-center items-center space-x-3 py-3 px-4 border border-gray-700 text-white rounded-lg shadow-md text-base font-semibold bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-300 focus:ring-opacity-50 transition duration-150 ease-in-out"
                        disabled={loading}
                    >
                        <Apple className="w-5 h-5" />
                        <span>Sign in with Apple</span>
                    </button>
                </div>


                {/* Footer Link */}
                <div className="text-center text-sm pt-2">
                    <p className="text-gray-400">
                        Don't have an account?{' '}
                        {/* Replaced Next.js Link with standard <a> and router.push */}
                        <a 
                            onClick={() => router.push("/signup")} 
                            className="font-medium text-blue-400 hover:text-blue-300 transition duration-150 cursor-pointer"
                            aria-label="Create an account"
                        >
                            Create one
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
