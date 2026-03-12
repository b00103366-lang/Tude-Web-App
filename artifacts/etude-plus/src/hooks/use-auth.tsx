import React, { createContext, useContext, useState, useEffect } from "react";
import { User, useGetMe, login, register, LoginRequest, RegisterRequest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginFn: (data: LoginRequest) => Promise<void>;
  registerFn: (data: RegisterRequest) => Promise<void>;
  logoutFn: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// DEMO MOCK DATA
const DEMO_USERS: Record<string, User> = {
  "admin@etude.tn": { id: 1, email: "admin@etude.tn", role: "admin", fullName: "Admin User", createdAt: new Date().toISOString() },
  "prof@etude.tn": { 
    id: 2, email: "prof@etude.tn", role: "professor", fullName: "Dr. Sami Trabelsi", createdAt: new Date().toISOString(),
    professorProfile: { id: 1, userId: 2, fullName: "Dr. Sami Trabelsi", subjects: ["Mathematics"], gradeLevels: ["Baccalauréat"], status: "approved", totalReviews: 45, totalStudents: 120, isVerified: true, createdAt: new Date().toISOString() }
  },
  "student@etude.tn": { 
    id: 3, email: "student@etude.tn", role: "student", fullName: "Amira Ben Ali", createdAt: new Date().toISOString(),
    studentProfile: { id: 1, userId: 3, preferredSubjects: ["Mathematics", "Physics"] }
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [localUser, setLocalUser] = useState<User | null>(null);
  
  // Try real API first
  const { data: apiUser, isLoading: isApiLoading, isError } = useGetMe({
    query: { retry: false, staleTime: Infinity }
  });

  // Fallback to local storage for demo
  useEffect(() => {
    if (isError || !apiUser) {
      const stored = localStorage.getItem("etude_demo_user");
      if (stored) {
        try {
          setLocalUser(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, [isError, apiUser]);

  const user = apiUser || localUser;
  const isLoading = isApiLoading && !localUser && !isError;

  const loginFn = async (data: LoginRequest) => {
    try {
      // Try real API
      const res = await login(data);
      queryClient.setQueryData([`/api/auth/me`], res.user);
    } catch (error) {
      // Fallback to demo
      if (DEMO_USERS[data.email]) {
        const u = DEMO_USERS[data.email];
        localStorage.setItem("etude_demo_user", JSON.stringify(u));
        setLocalUser(u);
        return;
      }
      throw new Error("Invalid credentials");
    }
  };

  const registerFn = async (data: RegisterRequest) => {
    try {
      const res = await register(data);
      queryClient.setQueryData([`/api/auth/me`], res.user);
    } catch (error) {
      // Fallback
      const newUser: User = {
        id: Math.floor(Math.random() * 1000),
        email: data.email,
        role: data.role as any,
        fullName: data.fullName,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("etude_demo_user", JSON.stringify(newUser));
      setLocalUser(newUser);
    }
  };

  const logoutFn = () => {
    localStorage.removeItem("etude_demo_user");
    setLocalUser(null);
    queryClient.setQueryData([`/api/auth/me`], null);
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
