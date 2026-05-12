import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await signIn({ email, password });
      const target =
        from ?? (user.role === "photographer" ? "/studio" : "/client");
      navigate(target, { replace: true });
    } catch (err) {
      toast({
        title: "Could not sign in",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <Link to="/" className="text-sm text-primary underline underline-offset-2 mb-8">
        ← Home
      </Link>
      <div className="w-full max-w-md border border-border rounded-lg p-8 bg-card shadow-sm">
        <h1 className="text-xl font-serif font-semibold">Sign in</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
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
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-sm text-muted-foreground mt-6 text-center">
          No account?{" "}
          <Link to="/register" className="text-primary underline underline-offset-2">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
