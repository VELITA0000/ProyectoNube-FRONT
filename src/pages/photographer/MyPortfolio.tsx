import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { portfolioService } from "@/services/portfolioService";
import { photoService } from "@/services/photoService";
import type { Photo, Portfolio } from "@/types";

export default function MyPortfolio() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const list = await portfolioService.listByPhotographer(user.id);
      const first = list[0] ?? null;
      if (!first) {
        if (!cancelled) {
          setPortfolio(null);
          setPhotos([]);
          setLoading(false);
        }
        return;
      }
      const ph = await photoService.listByPortfolio(first.id);
      if (!cancelled) {
        setPortfolio(first);
        setPhotos(ph.filter((p) => p.status === "ready"));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-serif font-semibold">My portfolio</h1>
      <p className="text-sm text-muted-foreground mt-1">Your profile and sample photos</p>

      <div className="mt-8 border border-border rounded-lg p-6 bg-card">
        <div className="flex flex-wrap gap-6">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="w-24 h-24 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
              No photo
            </div>
          )}
          <div>
            <div className="text-xl font-serif font-medium">{user?.name}</div>
            {user?.studioName && (
              <div className="text-sm text-muted-foreground mt-1">{user.studioName}</div>
            )}
            {user?.bio && <p className="text-sm text-foreground/90 mt-3 max-w-xl">{user.bio}</p>}
            <div className="text-sm text-muted-foreground mt-3">{user?.email}</div>
            {user?.phone && <div className="text-sm text-muted-foreground">{user.phone}</div>}
          </div>
        </div>
      </div>

      <h2 className="text-lg font-serif font-medium mt-10 mb-4">Personal portfolio</h2>

      {!portfolio ? (
        <p className="text-sm text-muted-foreground border border-border rounded-lg p-4 bg-card">
          Create a portfolio under{" "}
          <Link to="/studio/portfolios" className="text-primary underline underline-offset-2">
            Portfolios
          </Link>{" "}
          and upload photos to show them here.
        </p>
      ) : photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No ready photos in “{portfolio.title}”.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.map((p) => (
            <img
              key={p.id}
              src={p.thumbnailUrl}
              alt=""
              className="w-full aspect-square object-cover rounded-md border border-border"
            />
          ))}
        </div>
      )}
    </div>
  );
}
