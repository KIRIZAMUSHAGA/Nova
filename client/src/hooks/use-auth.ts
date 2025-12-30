import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
        if (res.status === 401) return null;
        if (!res.ok) throw new Error("Failed to get user");
        return res.json();
      } catch {
        return null;
      }
    },
    retry: false,
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
    onSuccess: (data) => {
      localStorage.setItem("authToken", data.token);
      setLocation("/");
    },
  });

  // Login mutation (accepts email OR phone)
  const loginMutation = useMutation({
    mutationFn: async (data: { emailOrPhone: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json() as Promise<AuthResponse>;
    },
    onSuccess: (data) => {
      localStorage.setItem("authToken", data.token);
      setLocation("/");
    },
  });

  // Logout function
  const logout = () => {
    localStorage.removeItem("authToken");
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
