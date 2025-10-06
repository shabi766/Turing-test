"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthAPI } from "@/lib/api"; // Assuming AuthAPI is correctly imported

// Define AuthUser type based on your structure
type AuthUser = { _id: string; email: string } | null;

// Define the shape of the context value
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

    // 1. Initial Load: Load state from localStorage once on mount
    useEffect(() => {
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem('auth') : null;
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as { user: AuthUser; token: string };
                setUser(parsed.user);
                setToken(parsed.token);
            } catch {
                // Ignore parsing errors, state remains null
            }
        }
    }, []);

    // 2. Helper to persist state (Memoized with useCallback)
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
    }, []); // Dependencies are empty, making this function stable

    // 3. Login function (Memoized with useCallback)
    const login = useCallback(async (email: string, password: string) => {
        const res = await AuthAPI.login(email, password);
        // Assuming AuthAPI.login returns { _id, email, token }
        persist({ _id: res._id, email: res.email }, res.token);
    }, [persist]); // Depends on the stable 'persist'

    // 4. Register function (Memoized with useCallback)
    const register = useCallback(async (email: string, password: string) => {
        const res = await AuthAPI.register(email, password);
        // Assuming AuthAPI.register returns { _id, email, token }
        persist({ _id: res._id, email: res.email }, res.token);
    }, [persist]); // Depends on the stable 'persist'

    // 5. Logout function (Memoized with useCallback) - **Crucial for the fix**
    const logout = useCallback(() => persist(null, null), [persist]); // Depends on the stable 'persist'

    // 6. Context Value (Memoized with useMemo)
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

// Custom hook for consuming the context
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}