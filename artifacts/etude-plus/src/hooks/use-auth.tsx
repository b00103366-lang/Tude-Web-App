import React, { createContext, useContext } from "react";
import { User, useGetMe, getGetMeQueryKey, login, register, LoginRequest, RegisterRequest, saveToken, clearToken, getToken } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginFn: (data: LoginRequest) => Promise<User>;
  registerFn: (data: RegisterRequest) => Promise<User>;
  logoutFn: () => void;
  refreshUser: () => Promise<void>;
  startImpersonation: (token: string, targetUser: any) => void;
  exitImpersonation: () => void;
  impersonating: ImpersonationState | null;
}

export interface ImpersonationState {
  adminToken: string;
  adminUser: { fullName: string; email: string; id: number };
  targetUser: { fullName: string; email: string; role: string; id: number };
}

const IMPERSONATION_KEY = "etude_impersonation";

export function getImpersonationState(): ImpersonationState | null {
  try {
    const raw = localStorage.getItem(IMPERSONATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
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
  if (role === "admin" || role === "super_admin") return "/admin/dashboard";
  return "/student/dashboard";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user = null, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false, staleTime: 5 * 60 * 1000 }
  });

  const impersonating = getImpersonationState();

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
    // If impersonating, exit that first
    const imp = getImpersonationState();
    if (imp) {
      localStorage.removeItem(IMPERSONATION_KEY);
      saveToken(imp.adminToken);
    }
    clearToken();
    queryClient.setQueryData([`/api/auth/me`], null);
    queryClient.clear();
    window.location.href = "/";
  };

  const refreshUser = async () => {
    await queryClient.invalidateQueries({ queryKey: [`/api/auth/me`] });
  };

  const startImpersonation = (token: string, targetUser: any) => {
    const adminToken = getToken();
    if (!adminToken || !user) return;

    const state: ImpersonationState = {
      adminToken,
      adminUser: { fullName: user.fullName, email: user.email, id: (user as any).id },
      targetUser: { fullName: targetUser.fullName, email: targetUser.email, role: targetUser.role, id: targetUser.id },
    };
    localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(state));
    saveToken(token);
    queryClient.setQueryData([`/api/auth/me`], { ...targetUser, passwordHash: undefined });
    queryClient.invalidateQueries();
    window.location.href = getDashboardPath(targetUser.role);
  };

  const exitImpersonation = () => {
    const imp = getImpersonationState();
    if (!imp) return;
    localStorage.removeItem(IMPERSONATION_KEY);
    saveToken(imp.adminToken);
    queryClient.setQueryData([`/api/auth/me`], null);
    queryClient.clear();
    window.location.href = "/admin/users";
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginFn, registerFn, logoutFn, refreshUser, startImpersonation, exitImpersonation, impersonating }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
