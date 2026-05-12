import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-2 rounded-md text-sm font-sans ${
    isActive ? "bg-lumiere-gold/25 text-amber-50" : "text-white/90 hover:bg-white/10"
  }`;

export function ClientSidebar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    if (!window.confirm("Sign out?")) return;
    await signOut();
    navigate("/");
  };

  return (
    <aside className="w-56 shrink-0 bg-lumiere-sidebar text-white min-h-screen flex flex-col p-4 border-r border-white/10">
      <div className="mb-8">
        <div className="text-xl font-serif font-semibold tracking-tight text-white">Lumière</div>
        <div className="text-xs text-white/55 mt-1 font-sans">Client dashboard</div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        <NavLink to="/client" end className={linkClass}>
          My sessions
        </NavLink>
        <NavLink to="/client/cart" className={linkClass}>
          Cart
        </NavLink>
        <NavLink to="/client/purchases" className={linkClass}>
          Purchases
        </NavLink>
      </nav>

      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="mt-6 text-left text-sm text-white/75 hover:text-white py-2 font-sans"
      >
        Sign out
      </button>
    </aside>
  );
}
