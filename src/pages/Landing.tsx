import { Link } from "react-router-dom";
import { Camera, User } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-foreground">
      <div className="text-center max-w-lg mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight">Lumière</h1>
        <p className="text-sm text-muted-foreground mt-3 font-sans">
          Portfolio and photo delivery platform
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl justify-center">
        <Link
          to="/register/details?type=photographer"
          className="flex-1 border border-border rounded-xl p-8 bg-lumiere-card hover:bg-accent/80 text-center transition-colors shadow-sm"
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-accent flex items-center justify-center mb-4">
            <Camera className="w-7 h-7 text-primary" />
          </div>
          <div className="text-lg font-serif font-semibold">Photographer</div>
          <p className="text-sm text-muted-foreground mt-2 font-sans">Manage clients and portfolios</p>
        </Link>

        <Link
          to="/register/details?type=client"
          className="flex-1 border border-border rounded-xl p-8 bg-lumiere-card hover:bg-accent/80 text-center transition-colors shadow-sm"
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-accent flex items-center justify-center mb-4">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div className="text-lg font-serif font-semibold">Client</div>
          <p className="text-sm text-muted-foreground mt-2 font-sans">View and buy your photos</p>
        </Link>
      </div>

      <p className="text-sm text-muted-foreground mt-12 font-sans">
        Already have an account?{" "}
        <Link to="/login" className="text-primary underline underline-offset-2 hover:opacity-80">
          Sign in
        </Link>
      </p>
    </div>
  );
}
