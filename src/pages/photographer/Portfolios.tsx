import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { portfolioService } from "@/services/portfolioService";
import { photographerService } from "@/services/photographerService";
import type { Portfolio, User } from "@/types";
import { PortfolioFormModal } from "@/components/modals/PortfolioFormModal";
import { ChevronRight, FolderOpen, ImageIcon } from "lucide-react";

const STATUS_LABEL: Record<Portfolio["status"], string> = {
  draft: "DRAFT",
  published: "PUBLISHED",
};

export default function Portfolios() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPortfolioOpen, setNewPortfolioOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [p, c] = await Promise.all([
      portfolioService.listByPhotographer(user.id),
      photographerService.listClients(user.id),
    ]);
    setPortfolios(p);
    setClients(c);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Portfolios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Group photos by event and share them with the right clients
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewPortfolioOpen(true)}
          className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90"
        >
          New portfolio
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <h2 className="text-lg font-serif font-medium mb-3 flex items-center gap-2">
            <FolderOpen className="w-4 h-4" /> Your portfolios ({portfolios.length})
          </h2>
          {portfolios.length === 0 ? (
            <p className="text-sm text-muted-foreground border border-border rounded-lg p-6 bg-card">
              No portfolios yet. Use “New portfolio” to create one.
            </p>
          ) : (
            <ul className="border border-border rounded-lg divide-y divide-border bg-card">
              {portfolios.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/studio/portfolios/${p.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-muted/40 text-sm"
                  >
                    {p.coverUrl ? (
                      <img
                        src={p.coverUrl}
                        alt=""
                        className="w-10 h-10 rounded-md object-cover border border-border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-muted/60 grid place-items-center text-muted-foreground">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium font-serif truncate">{p.title}</span>
                        <span
                          className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                            p.status === "published"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {STATUS_LABEL[p.status]}
                        </span>
                        {p.clients.length > 0 && (
                          <span className="flex flex-wrap gap-1">
                            {p.clients.slice(0, 3).map((c) => (
                              <span
                                key={c.id}
                                className="text-[11px] px-2 py-0.5 rounded-full bg-accent text-foreground/80 border border-border"
                                title={c.email}
                              >
                                {c.name}
                              </span>
                            ))}
                            {p.clients.length > 3 && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent text-foreground/80 border border-border">
                                +{p.clients.length - 3}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      {p.description && (
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {p.description}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <PortfolioFormModal
        open={newPortfolioOpen}
        onOpenChange={setNewPortfolioOpen}
        availableClients={clients}
        onCreated={() => {
          void load();
        }}
      />
    </div>
  );
}
