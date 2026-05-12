import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { UserRole } from "@/types";

export default function Register() {
  const [params] = useSearchParams();
  const role = params.get("type") as UserRole | null;
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [studioName, setStudioName] = useState("");
  const [loading, setLoading] = useState(false);

  if (role !== "photographer" && role !== "client") {
    return <Navigate to="/register" replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Use at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const user = await signUp({
        name,
        email,
        password,
        role,
        phone: phone || undefined,
        studioName: role === "photographer" ? studioName || undefined : undefined,
      });
      toast({ title: "Account created", description: `Welcome, ${user.name}` });
      navigate(role === "photographer" ? "/studio" : "/client", { replace: true });
    } catch (err) {
      toast({
        title: "Could not create account",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <Link to="/register" className="text-sm text-primary underline underline-offset-2 mb-6">
        ← Change account type
      </Link>
      <div className="w-full max-w-md border border-border rounded-lg p-8 bg-card shadow-sm">
        <h1 className="text-xl font-serif font-semibold">
          Create account · {role === "photographer" ? "Photographer" : "Client"}
        </h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          {role === "photographer" && (
            <div>
              <Label htmlFor="studio">Studio (optional)</Label>
              <Input
                id="studio"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Password (min. 8)</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="text-sm text-neutral-600 mt-6 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-primary underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
