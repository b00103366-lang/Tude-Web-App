import React, { createContext, useContext } from "react";
import { User, useGetMe, login, register, LoginRequest, RegisterRequest, saveToken, clearToken } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginFn: (data: LoginRequest) => Promise<void>;
  registerFn: (data: RegisterRequest) => Promise<void>;
  logoutFn: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user = null, isLoading } = useGetMe({
    query: { retry: false, staleTime: 5 * 60 * 1000 }
  });

  const loginFn = async (data: LoginRequest) => {
    const res = await login(data);
    saveToken(res.token);
    queryClient.setQueryData([`/api/auth/me`], res.user);
  };

  const registerFn = async (data: RegisterRequest) => {
    const res = await register(data);
    saveToken(res.token);
    queryClient.setQueryData([`/api/auth/me`], res.user);
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
