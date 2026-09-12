"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UserAccount } from "@/types";

interface AuthContextType {
  user: UserAccount | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      return;
    }
    const initAuth = async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (session) {
          const { data: userDataById } = await client
            .from("app_users")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();
          let userData = userDataById;
          if (!userData && session.user.email) {
            const { data } = await client
              .from("app_users")
              .select("*")
              .ilike("auth_email", session.user.email)
              .maybeSingle();
            userData = data;
          }
          if (userData) setUser(userData as UserAccount);
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        setLoading(false);
      }
    };

    void initAuth();
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (session) {
        void (async () => {
          const { data: userDataById } = await client
            .from("app_users")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();
          let userData = userDataById;
          if (!userData && session.user.email) {
            const { data } = await client
              .from("app_users")
              .select("*")
              .ilike("auth_email", session.user.email)
              .maybeSingle();
            userData = data;
          }
          if (userData) setUser(userData as UserAccount);
        })();
      } else {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  };

  const signIn = async (username: string, password: string) => {
    if (!supabase) throw new Error("Supabase chưa được cấu hình.");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const result = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      error?: string;
    };
    if (!response.ok || !result.access_token || !result.refresh_token) {
      throw new Error(result.error || "Không thể xác định tài khoản.");
    }
    const { error } = await supabase.auth.setSession({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
