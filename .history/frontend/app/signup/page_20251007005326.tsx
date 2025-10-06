"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
    const { register } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await register(email, password);
            router.replace("/chat");
        } catch (err: any) {
            setError(err?.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
                <h1 className="text-2xl font-semibold">Signup</h1>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <input className="w-full border rounded p-2" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                <input className="w-full border rounded p-2" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                <button disabled={loading} className="w-full bg-black text-white rounded p-2 disabled:opacity-50">
                    {loading ? "Creating account..." : "Create account"}
                </button>
                <button type="button" className="w-full border rounded p-2" onClick={() => router.push("/login")}>Go to Login</button>
            </form>
        </div>
    );
}


