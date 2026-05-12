import { createContext, useEffect, useState, type ReactNode } from "react";
import type { SignInPayload, SignUpPayload, User } from "@/types";
import { authService } from "@/services/authService";

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (payload: SignInPayload) => Promise<User>;
  signUp: (payload: SignUpPayload) => Promise<User>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (payload: SignInPayload) => {
    const { user } = await authService.signIn(payload);
    setUser(user);
    return user;
  };

  const signUp = async (payload: SignUpPayload) => {
    const { user } = await authService.signUp(payload);
    setUser(user);
    return user;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { useAuth } from "@/hooks/useAuth";
