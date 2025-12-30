import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface User {
  id: string;
  email?: string;
  phoneNumber?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

export function useAuth() {
  const [, setLocation] = useLocation();

  // Check if user is logged in
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return null;

        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.status === 401) {
          localStorage.removeItem("authToken");
          return null;
        }
        if (!res.ok) throw new Error("Failed to get user");
        return res.json();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 0, // Ensure we always have fresh auth state after signup/login
  });

  // Signup mutation (supports email OR phone)
  const signupMutation = useMutation({
    mutationFn: async (data: {
      email?: string;
      phoneNumber?: string;
      password: string;
      confirmPassword: string;
    }) => {
      const res = await apiRequest("POST", "/api/auth/signup", {
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      return res.json() as Promise<AuthResponse>;
    },
    onSuccess: async (data) => {
      console.log("Signup success, setting token", data.token);
      localStorage.setItem("authToken", data.token);
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  // Login mutation (accepts email OR phone)
  const loginMutation = useMutation({
    mutationFn: async (data: { emailOrPhone: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json() as Promise<AuthResponse>;
    },
    onSuccess: async (data) => {
      console.log("Login success, setting token", data.token);
      localStorage.setItem("authToken", data.token);
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  // Logout function
  const logout = () => {
    localStorage.removeItem("authToken");
    queryClient.setQueryData(["/api/auth/me"], null);
    setLocation("/welcome");
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signup: signupMutation,
    login: loginMutation,
    logout,
  };
}
