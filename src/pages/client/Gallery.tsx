import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { portfolioService } from "@/services/portfolioService";
import { photoService } from "@/services/photoService";
import { cartService } from "@/services/cartService";
import type { Photo, Portfolio } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Client-facing gallery for a single portfolio. The API already enforces:
//   - status === 'published'
//   - this client is in portfolio_clients
//   - only photos with status === 'ready' are returned
// so the SPA just renders whatever it receives.
export default function ClientGallery() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [cartIds, setCartIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refreshCart = async () => {
    if (!user || !id) return;
    const cart = await cartService.getCart(user.id);
    setCartIds(new Set(cart.map((c) => c.photoId)));
  };

  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [pf, ps] = await Promise.all([
        portfolioService.getById(id),
        photoService.listByPortfolio(id),
      ]);
      if (cancelled) return;
      setPortfolio(pf);
      setPhotos(ps);
      setLoading(false);
      void refreshCart();
    })();
    // Light polling so newly-watermarked photos appear within a few seconds of
    // the photographer publishing or re-publishing the portfolio.
    const poll = window.setInterval(async () => {
      if (cancelled || !id) return;
      const ps = await photoService.listByPortfolio(id);
      setPhotos(ps);
    }, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const ready = useMemo(() => photos.filter((p) => p.status === "ready"), [photos]);

  const toggleCart = async (photo: Photo) => {
    if (!user || !id) return;
    if (cartIds.has(photo.id)) {
      await cartService.removeItem(user.id, photo.id);
      await refreshCart();
      toast({ title: "Removed from cart" });
    } else {
      await cartService.addItem(user.id, { photoId: photo.id, portfolioId: id });
      await refreshCart();
      toast({ title: "Added to cart" });
    }
  };

  // Already-purchased photos: hit the API for a fresh presigned GET on the
  // ORIGINAL key and open it in a new tab. The API enforces `paid` status on
  // the purchase before signing the URL, so this stays safe even if a client
  // crafts a request for a photo they did not buy.
  const downloadOriginal = async (photo: Photo) => {
    try {
      const url = await photoService.getOriginalDownloadUrl(photo.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast({
        title: "Could not generate link",
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
        <p className="text-sm text-muted-foreground mb-4">Session not found.</p>
        <Link to="/client" className="text-sm text-primary underline underline-offset-2">
          ← Back to my sessions
        </Link>
      </div>
    );
  }
  if (portfolio.status !== "published") {
    return <p className="text-sm text-muted-foreground">This session is not published yet.</p>;
  }

  return (
    <div className="max-w-6xl">
      <Link to="/client" className="text-sm text-primary underline underline-offset-2">
        ← Back to my sessions
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mt-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">{portfolio.title}</h1>
          {portfolio.description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{portfolio.description}</p>
          )}
          <div className="text-sm text-muted-foreground mt-3 flex flex-wrap gap-4 items-center">
            {portfolio.photographerAvatarUrl && (
              <img
                src={portfolio.photographerAvatarUrl}
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-border"
              />
            )}
            <div>
              <div className="text-foreground">{portfolio.photographerName ?? "—"}</div>
              {portfolio.photographerEmail && (
                <div className="text-xs">{portfolio.photographerEmail}</div>
              )}
              {portfolio.photographerPhone && (
                <div className="text-xs">{portfolio.photographerPhone}</div>
              )}
            </div>
          </div>
        </div>
        <Link
          to="/client/cart"
          className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90"
        >
          Checkout ({cartIds.size})
        </Link>
      </div>

      {ready.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-8">
          No photos ready yet. The photographer just published — they should appear here within a
          few seconds.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ready.map((p) => {
            const inCart = cartIds.has(p.id);
            return (
              <div key={p.id} className="relative border border-border rounded-md overflow-hidden">
                <img
                  src={p.watermarkedUrl || p.thumbnailUrl}
                  alt=""
                  className="w-full aspect-square object-cover"
                />
                {p.purchased ? (
                  <button
                    type="button"
                    onClick={() => void downloadOriginal(p)}
                    title="Download original"
                    className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-medium bg-emerald-500/0 hover:bg-emerald-600/70 text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void toggleCart(p)}
                    className={`absolute inset-0 flex items-center justify-center text-sm font-medium ${
                      inCart
                        ? "bg-primary/85 text-primary-foreground"
                        : "bg-black/0 hover:bg-black/35 text-white"
                    }`}
                  >
                    {inCart ? "✓ In cart" : "Select"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {cartIds.size > 0 && (
        <div className="mt-8 flex justify-end">
          <Link
            to="/client/cart"
            className="px-4 py-2 text-sm rounded-md border border-foreground/80 hover:bg-foreground hover:text-background"
          >
            View selection ({cartIds.size} photos)
          </Link>
        </div>
      )}
    </div>
  );
}
