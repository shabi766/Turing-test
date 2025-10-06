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
            {/* Enhanced Card Design for better visual separation and modern look */}
            <div className="w-full max-w-sm space-y-7 p-8 md:p-10 bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-[0_0_40px_rgba(59,130,246,0.15)] transition duration-300 hover:shadow-[0_0_50px_rgba(59,130,246,0.25)]">
                
                {/* Logo and Header: Increased font size and spacing */}
                <div className="flex flex-col items-center space-y-2.5">
                    <div className="flex items-center space-x-3 text-4xl font-extrabold text-blue-400">
                        {/* Replaced Next.js Image with standard <img> */}
                        <img 
                            src="/gemin.png" 
                            alt="Gemini Logo" 
                            className="w-9 h-9 object-contain" // Slightly larger logo
                        />
                        <h1>Test with Turing</h1>
                    </div>
                    <p className="text-gray-400 text-base">Welcome back! Please sign in to continue.</p>
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
                            // Enhanced input styling: focus ring color adjusted, smoother border
                            className="w-full pl-10 pr-4 py-3.5 border border-gray-700/70 bg-gray-900/50 rounded-lg shadow-inner placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 text-white transition duration-200"
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
                            // Enhanced input styling
                            className="w-full pl-10 pr-4 py-3.5 border border-gray-700/70 bg-gray-900/50 rounded-lg shadow-inner placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 text-white transition duration-200"
                            disabled={loading}
                        />
                    </div>

                    {/* Submit Button: Added subtle hover effect and shadow */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center space-x-2 py-3.5 px-4 border border-transparent rounded-lg shadow-md text-base font-semibold text-gray-900 bg-blue-400 hover:bg-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 transition duration-200 ease-in-out transform hover:scale-[1.01]"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin h-5 w-5 border-t-2 border-r-2 border-gray-900 rounded-full"></span>
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

                {/* Separator: Clearer visual separation */}
                <div className="flex items-center space-x-3 my-4">
                    <div className="flex-grow border-t border-gray-700/50"></div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">or</span>
                    <div className="flex-grow border-t border-gray-700/50"></div>
                </div>

                {/* Social Login Buttons: More cohesive design, better hover effects */}
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => handleSocialLogin('Google')}
                        className="w-full flex justify-center items-center space-x-3 py-3 px-4 border border-gray-700/70 text-white rounded-lg shadow-inner text-base font-medium bg-gray-900/70 hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200 ease-in-out"
                        disabled={loading}
                    >
                        <Chrome className="w-5 h-5 text-red-500" />
                        <span>Sign in with Google</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSocialLogin('Apple')}
                        className="w-full flex justify-center items-center space-x-3 py-3 px-4 border border-gray-700/70 text-white rounded-lg shadow-inner text-base font-medium bg-gray-900/70 hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition duration-200 ease-in-out"
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
                            className="font-semibold text-blue-400 hover:text-blue-300 transition duration-150 cursor-pointer underline underline-offset-4"
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
