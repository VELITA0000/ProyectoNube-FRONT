import type { AuthResult, SignInPayload, SignUpPayload, User } from "@/types";
import { apiFetch, setToken } from "@/lib/api";

export const authService = {
  async signUp(payload: SignUpPayload): Promise<AuthResult> {
    const result = await apiFetch<AuthResult>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setToken(result.idToken);
    return result;
  },

  async signIn(payload: SignInPayload): Promise<AuthResult> {
    const result = await apiFetch<AuthResult>("/auth/signin", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setToken(result.idToken);
    return result;
  },

  async signOut(): Promise<void> {
    try {
      await apiFetch<void>("/auth/signout", { method: "POST" });
    } catch {
      /* ignore already-invalid session */
    }
    setToken(null);
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      return await apiFetch<User>("/auth/me");
    } catch {
      return null;
    }
  },
};
