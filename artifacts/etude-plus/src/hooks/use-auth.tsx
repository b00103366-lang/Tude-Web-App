import React, { createContext, useContext } from "react";
import { User, useGetMe, login, register, LoginRequest, RegisterRequest, saveToken, clearToken } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginFn: (data: LoginRequest) => Promise<User>;
  registerFn: (data: RegisterRequest) => Promise<User>;
  logoutFn: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const RECENT_ACCOUNTS_KEY = "etude_recent_accounts";

export interface RecentAccount {
  email: string;
  fullName: string;
  role: string;
}

export function getSavedAccounts(): RecentAccount[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_ACCOUNTS_KEY) || "[]");
  } catch { return []; }
}

function saveAccount(user: User) {
  try {
    const existing = getSavedAccounts().filter(a => a.email !== user.email);
    const updated = [{ email: user.email, fullName: user.fullName, role: user.role }, ...existing].slice(0, 5);
    localStorage.setItem(RECENT_ACCOUNTS_KEY, JSON.stringify(updated));
  } catch {}
}

export function getDashboardPath(role: string) {
  if (role === "professor") return "/professor/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/student/dashboard";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user = null, isLoading } = useGetMe({
    query: { retry: false, staleTime: 5 * 60 * 1000 }
  });

  const loginFn = async (data: LoginRequest): Promise<User> => {
    const res = await login(data);
    saveToken(res.token);
    saveAccount(res.user);
    queryClient.setQueryData([`/api/auth/me`], res.user);
    return res.user;
  };

  const registerFn = async (data: RegisterRequest): Promise<User> => {
    const res = await register(data);
    saveToken(res.token);
    saveAccount(res.user);
    queryClient.setQueryData([`/api/auth/me`], res.user);
    return res.user;
  };

  const logoutFn = () => {
    clearToken();
    queryClient.setQueryData([`/api/auth/me`], null);
    queryClient.clear();
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginFn, registerFn, logoutFn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
