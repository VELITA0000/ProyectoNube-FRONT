import { Link, useNavigate } from "react-router-dom";
import { Camera, User } from "lucide-react";
import type { UserRole } from "@/types";

export default function RegisterType() {
  const navigate = useNavigate();

  const choose = (role: UserRole) => {
    navigate(`/register/details?type=${role}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <Link to="/" className="text-sm text-primary underline underline-offset-2 mb-8">
        ← Home
      </Link>
      <h1 className="text-2xl font-serif font-semibold text-center mb-8">Register</h1>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
        <button
          type="button"
          onClick={() => choose("photographer")}
          className="flex-1 border border-border rounded-xl p-6 bg-card hover:bg-accent/50 text-left shadow-sm"
        >
          <Camera className="w-8 h-8 text-primary mb-3" />
          <div className="font-serif font-semibold">Photographer</div>
          <p className="text-sm text-muted-foreground mt-1">Account to deliver sessions</p>
        </button>
        <button
          type="button"
          onClick={() => choose("client")}
          className="flex-1 border border-border rounded-xl p-6 bg-card hover:bg-accent/50 text-left shadow-sm"
        >
          <User className="w-8 h-8 text-primary mb-3" />
          <div className="font-serif font-semibold">Client</div>
          <p className="text-sm text-muted-foreground mt-1">View and buy photos</p>
        </button>
      </div>
      <p className="text-sm text-muted-foreground mt-10">
        Already have an account?{" "}
        <Link to="/login" className="text-primary underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}
