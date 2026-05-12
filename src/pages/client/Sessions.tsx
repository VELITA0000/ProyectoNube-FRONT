import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { portfolioService } from "@/services/portfolioService";
import type { Portfolio } from "@/types";

// Client-facing "My sessions" view. Internally these are still portfolios
// (`portfolio_clients` join, status='published'); the SPA simply uses the
// client-friendlier label "session" everywhere a client sees them.
export default function ClientPortfolios() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const list = await portfolioService.listSharedWithMe();
      if (!cancelled) {
        setPortfolios(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-serif font-semibold">My sessions</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Browse the photo galleries your photographers have published for you
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground mt-8">Loading…</p>
      ) : portfolios.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-8 border border-border rounded-lg p-6 bg-card">
          When your photographer publishes a session to your account, it will appear here.
        </p>
      ) : (
        <div className="mt-8 flex flex-wrap gap-4">
          {portfolios.map((p) => (
            <Link
              key={p.id}
              to={`/client/portfolios/${p.id}`}
              className="block w-64 border border-border rounded-lg overflow-hidden bg-card hover:border-primary shadow-sm"
            >
              {p.coverUrl ? (
                <img src={p.coverUrl} alt="" className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-muted" />
              )}
              <div className="p-3">
                <div className="font-medium font-serif">{p.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {p.photographerName ?? "Photographer"}
                  {p.publishedAt
                    ? ` · ${new Date(p.publishedAt).toLocaleDateString()}`
                    : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
