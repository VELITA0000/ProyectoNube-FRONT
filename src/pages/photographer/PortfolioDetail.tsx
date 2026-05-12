import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { portfolioService } from "@/services/portfolioService";
import { photoService } from "@/services/photoService";
import { photographerService } from "@/services/photographerService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhotoUploader } from "@/components/photographer/PhotoUploader";
import { PublishPortfolioModal } from "@/components/modals/PublishPortfolioModal";
import { ArrowLeft, ImageIcon, Send, Trash2, UserPlus, X } from "lucide-react";
import type { Photo, Portfolio, PortfolioClientSummary, User } from "@/types";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABEL: Record<Portfolio["status"], string> = {
  draft: "DRAFT",
  published: "PUBLISHED",
};

export default function PortfolioDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [roster, setRoster] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishOpen, setPublishOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  // Pull portfolio + photos. The poll keeps the photo statuses fresh so the
  // gallery reflects the watermark Lambda's transitions (uploaded -> processing
  // -> ready) without forcing the photographer to refresh manually.
  const reloadPhotos = async () => {
    if (!id) return;
    const list = await photoService.listByPortfolio(id);
    setPhotos(list);
  };

  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [p, ps, rs] = await Promise.all([
        portfolioService.getById(id),
        photoService.listByPortfolio(id),
        photographerService.listClients(user.id),
      ]);
      if (cancelled) return;
      setPortfolio(p);
      setPhotos(ps);
      setRoster(rs);
      setLoading(false);
    })();
    const poll = window.setInterval(() => {
      if (!cancelled) void reloadPhotos();
    }, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  const counts = useMemo(() => {
    let uploaded = 0;
    let processing = 0;
    let ready = 0;
    let failed = 0;
    for (const p of photos) {
      if (p.status === "uploaded") uploaded++;
      else if (p.status === "processing") processing++;
      else if (p.status === "ready") ready++;
      else if (p.status === "failed") failed++;
    }
    return { uploaded, processing, ready, failed };
  }, [photos]);

  const associatedIds = useMemo(
    () => new Set((portfolio?.clients ?? []).map((c) => c.id)),
    [portfolio?.clients],
  );

  const availableForPicker = useMemo(
    () => roster.filter((c) => !associatedIds.has(c.id)),
    [roster, associatedIds],
  );

  const onDeletePhoto = async (photoId: string) => {
    if (!confirm("Delete this photo? It will also be removed from the originals bucket.")) return;
    await photoService.remove(photoId);
    await reloadPhotos();
    toast({ title: "Photo deleted" });
  };

  const onDeletePortfolio = async () => {
    if (!portfolio) return;
    if (!confirm(`Delete portfolio "${portfolio.title}"?`)) return;
    await portfolioService.remove(portfolio.id);
    toast({ title: "Portfolio deleted" });
    navigate("/studio/portfolios");
  };

  const onAddClientById = async (clientId: string) => {
    if (!portfolio) return;
    try {
      const res = await portfolioService.addClients(portfolio.id, { clientIds: [clientId] });
      setPortfolio({ ...portfolio, clients: res.clients });
      setPickerOpen(false);
    } catch (err) {
      toast({
        title: "Could not associate client",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const onAddClientByEmail = async () => {
    if (!portfolio) return;
    const e = emailDraft.trim().toLowerCase();
    if (!e) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      toast({ title: "Invalid email", variant: "destructive" });
      return;
    }
    try {
      const res = await portfolioService.addClients(portfolio.id, { clientEmails: [e] });
      setPortfolio({ ...portfolio, clients: res.clients });
      setEmailDraft("");
      if (res.unknownEmails.length > 0) {
        toast({
          title: "Email not registered",
          description: `${e} is not a client account yet. Ask them to sign up first.`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Client associated", description: e });
      }
    } catch (err) {
      toast({
        title: "Could not associate by email",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const onRemoveClient = async (c: PortfolioClientSummary) => {
    if (!portfolio) return;
    if (!confirm(`Remove ${c.name} from "${portfolio.title}"?`)) return;
    try {
      const res = await portfolioService.removeClient(portfolio.id, c.id);
      setPortfolio({ ...portfolio, clients: res.clients });
    } catch (err) {
      toast({
        title: "Could not remove",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (!portfolio) {
    return (
      <div>
        <p className="text-sm text-muted-foreground mb-4">Portfolio not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/studio/portfolios">Back</Link>
        </Button>
      </div>
    );
  }
  if (portfolio.photographerId !== user?.id) {
    return <p className="text-sm text-muted-foreground">Access denied.</p>;
  }

  return (
    <div className="max-w-6xl">
      <Link
        to="/studio/portfolios"
        className="text-sm text-primary underline underline-offset-2 inline-flex items-center gap-1"
      >
        <ArrowLeft className="w-3 h-3" /> Portfolios
      </Link>

      <div className="mt-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-serif font-semibold">{portfolio.title}</h1>
            <span
              className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                portfolio.status === "published"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {STATUS_LABEL[portfolio.status]}
            </span>
          </div>
          {portfolio.description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{portfolio.description}</p>
          )}

          <div className="mt-5">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              Associated clients ({portfolio.clients.length})
            </div>
            {portfolio.clients.length === 0 ? (
              <p className="text-xs text-muted-foreground border border-dashed border-border rounded p-3">
                No clients yet. Associate at least one before publishing — the portfolio is only
                visible to its associated clients.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {portfolio.clients.map((c) => (
                  <span
                    key={c.id}
                    className="text-xs px-2.5 py-1 rounded-full bg-accent border border-border flex items-center gap-1.5"
                    title={c.email}
                  >
                    {c.name}
                    <button
                      type="button"
                      onClick={() => void onRemoveClient(c)}
                      aria-label={`Remove ${c.name}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2 items-start">
              <div className="relative">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPickerOpen((o) => !o)}
                  disabled={availableForPicker.length === 0}
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  {availableForPicker.length === 0
                    ? "Roster empty"
                    : `Pick from roster (${availableForPicker.length})`}
                </Button>
                {pickerOpen && (
                  <div className="absolute z-20 mt-1 w-64 max-h-60 overflow-y-auto bg-card border border-border rounded-md shadow">
                    {availableForPicker.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => void onAddClientById(c.id)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/40"
                      >
                        <div className="font-medium">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-1 min-w-[260px]">
                <Input
                  type="email"
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void onAddClientByEmail();
                    }
                  }}
                  placeholder="add by email…"
                />
                <Button type="button" size="sm" variant="outline" onClick={() => void onAddClientByEmail()}>
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            <Button
              onClick={() => setPublishOpen(true)}
              disabled={
                portfolio.clients.length === 0 ||
                counts.uploaded + counts.failed + counts.processing === 0
              }
              size="sm"
            >
              <Send className="w-4 h-4 mr-1" />
              {portfolio.status === "published" ? "Re-publish" : "Publish"}
            </Button>
            <Button variant="outline" size="sm" onClick={onDeletePortfolio}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-8">
        Photos: {photos.length} · Uploaded: {counts.uploaded} · Processing: {counts.processing} ·
        Ready: {counts.ready}
        {counts.failed > 0 && (
          <span className="text-destructive"> · Failed: {counts.failed}</span>
        )}
      </p>
      <p className="text-[11px] text-muted-foreground mt-1">
        Originals are private — they stay invisible to the associated clients until you hit
        Publish. This gallery always shows the originals, even after publishing.
      </p>

      <div className="mt-4">
        <PhotoUploader portfolioId={portfolio.id} onUploaded={reloadPhotos} />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-medium text-foreground mb-3">Gallery</h2>
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground border border-border rounded-lg p-6 bg-card">
            No photos yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {photos.map((p) => (
              <div
                key={p.id}
                className="group relative aspect-square border border-border rounded-md overflow-hidden bg-card"
              >
                {p.thumbnailUrl ? (
                  <img
                    src={p.thumbnailUrl}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-muted-foreground">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                {p.status !== "ready" && (
                  <span
                    className={`absolute top-1 left-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wide rounded ${
                      p.status === "failed"
                        ? "bg-destructive/90 text-destructive-foreground"
                        : "bg-card/90 text-muted-foreground border border-border"
                    }`}
                  >
                    {p.status}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void onDeletePhoto(p.id)}
                  className="absolute top-1 right-1 px-1 text-xs bg-card/95 border border-border rounded opacity-0 group-hover:opacity-100"
                  aria-label="Delete photo"
                >
                  <X className="w-3 h-3 inline" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <PublishPortfolioModal
        open={publishOpen}
        onOpenChange={setPublishOpen}
        portfolio={portfolio}
        onPublished={(p) => setPortfolio(p)}
      />
    </div>
  );
}
