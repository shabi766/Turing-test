"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthAPI } from "@/lib/api";

type AuthUser = { _id: string; email: string } | null;

type AuthContextValue = {
    user: AuthUser;
    token: string | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem('auth') : null;
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as { user: AuthUser; token: string };
                setUser(parsed.user);
                setToken(parsed.token);
            } catch {}
        }
    }, []);

    const persist = useCallback((nextUser: AuthUser, nextToken: string | null) => {
        setUser(nextUser);
        setToken(nextToken);
        if (typeof window !== 'undefined') {
            if (nextUser && nextToken) {
                window.localStorage.setItem('auth', JSON.stringify({ user: nextUser, token: nextToken }));
            } else {
                window.localStorage.removeItem('auth');
            }
        }
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res = await AuthAPI.login(email, password);
        persist({ _id: res._id, email: res.email }, res.token);
    }, [persist]);

    const register = useCallback(async (email: string, password: string) => {
        const res = await AuthAPI.register(email, password);
        persist({ _id: res._id, email: res.email }, res.token);
    }, [persist]);

    const logout = useCallback(() => persist(null, null), [persist]);

    const value = useMemo<AuthContextValue>(() => ({
        user,
        token,
        isAuthenticated: Boolean(user && token),
        login,
        register,
        logout,
    }), [user, token, login, register, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}


