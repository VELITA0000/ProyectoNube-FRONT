import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cartService } from "@/services/cartService";
import { portfolioService } from "@/services/portfolioService";
import { photoService } from "@/services/photoService";
import type { Photo, Portfolio, Purchase } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface PurchaseRow extends Purchase {
  portfolio?: Portfolio;
  photos: Photo[];
}

export default function ClientPurchases() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const purchases = await cartService.listPurchases(user.id);
      const enriched = await Promise.all(
        purchases.map(async (p) => {
          const portfolio = await portfolioService.getById(p.portfolioId);
          const allPhotos = await photoService.listByPortfolio(p.portfolioId);
          return {
            ...p,
            portfolio: portfolio ?? undefined,
            photos: allPhotos.filter((ph) => p.photoIds.includes(ph.id)),
          };
        }),
      );
      if (!cancelled) {
        setRows(enriched.reverse());
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Originals are private; we get a short-lived presigned URL per click and
  // open it in a new tab. The API only signs it after verifying status='paid'.
  const download = async (photo: Photo, purchase: PurchaseRow) => {
    if (purchase.status !== "paid") {
      toast({ title: "Payment pending" });
      return;
    }
    try {
      const url = await photoService.getOriginalDownloadUrl(photo.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast({ title: "Could not generate link", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-serif font-semibold">Your purchases</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Click any thumbnail to download the original (without watermark).
      </p>
      {loading ? (
        <p className="text-sm text-muted-foreground mt-8">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-8 border border-border rounded-lg p-6 bg-card">
          No purchases yet.
        </p>
      ) : (
        <ul className="mt-8 space-y-6">
          {rows.map((p) => (
            <li key={p.id} className="border border-border rounded-lg p-4 bg-card">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <div className="font-medium font-serif">{p.portfolio?.title ?? "Portfolio"}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {p.photoIds.length} photos · {p.status}
                  </div>
                </div>
                <div className="font-serif font-semibold">${p.total.toFixed(0)}</div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {p.photos.map((ph) => (
                  <button
                    key={ph.id}
                    type="button"
                    onClick={() => void download(ph, p)}
                    title="Download original"
                    className="w-16 h-16 border border-border rounded-md overflow-hidden hover:ring-2 hover:ring-primary"
                  >
                    <img src={ph.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
