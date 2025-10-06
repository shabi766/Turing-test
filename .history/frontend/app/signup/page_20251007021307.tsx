"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Gem, UserPlus, Mail, Lock, Chrome, Apple } from "lucide-react"; 
import Link from "next/link";
import toast from "react-hot-toast";

import { AuthAPI } from "@/lib/api";

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {

            await AuthAPI.register(email, password);

            toast.success('Registration successful! Please sign in.');
            router.push('/login'); 
            
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Registration failed. The user may already exist.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };


    const handleSocialSignup = (provider: string) => {
    toast(`Sign up with ${provider} is coming soon!`);
    };

    return (

        <div className="min-h-screen flex items-center justify-center p-4 md:p-10 bg-gray-900 text-white font-inter">
            <div className="w-full max-w-sm space-y-6 p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 transition duration-300 hover:shadow-gray-700/50">
                
  
                <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-3 text-3xl font-bold text-white">
                        <Image src="/gemin.png" alt="Turing Logo" width={32} height={32} className="w-8 h-8" />
                        <h1>Test with Turing</h1>
                    </div>
                    <p className="text-gray-400 text-sm">Create your account to access the LLM simulation.</p>
                </div>


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
                            className="w-full pl-10 pr-3 py-3 border border-gray-700 bg-gray-900 rounded-lg shadow-inner placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-white transition"
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
                            className="w-full pl-10 pr-3 py-3 border border-gray-700 bg-gray-900 rounded-lg shadow-inner placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 text-white transition"
                        />
                    </div>

                    {/* Submit Button (Email/Password) */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-semibold text-white bg-white hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 transition duration-150 ease-in-out"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin h-5 w-5 border-t-2 border-r-2 border-white rounded-full"></span>
                                <span>Creating Account...</span>
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-5 h-5" />
                                <span>Sign Up</span>
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

                {/* Social Signup Buttons */}
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => handleSocialSignup('Google')}
                        className="w-full flex justify-center items-center space-x-3 py-3 px-4 border border-gray-700 text-white rounded-lg shadow-md text-base font-semibold bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
                    >
                        <Chrome className="w-5 h-5 text-red-500" />
                        <span>Sign up with Google</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSocialSignup('Apple')}
                        className="w-full flex justify-center items-center space-x-3 py-3 px-4 border border-gray-700 text-white rounded-lg shadow-md text-base font-semibold bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-300 focus:ring-opacity-50 transition duration-150 ease-in-out"
                    >
                        <Apple className="w-5 h-5" />
                        <span>Sign up with Apple</span>
                    </button>
                </div>


                {/* Footer Link */}
                <div className="text-center text-sm pt-2">
                    <p className="text-gray-400">
                        Already have an account?{' '}
                        <Link href="/login" className="font-medium text-green-400 hover:text-green-300 transition duration-150">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
