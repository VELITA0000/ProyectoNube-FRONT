import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { portfolioService } from "@/services/portfolioService";
import { photographerService } from "@/services/photographerService";
import { photoService } from "@/services/photoService";
import type { Photo, Portfolio, Purchase } from "@/types";

interface Row {
  portfolio: Portfolio;
  photoCount: number;
  paidTotal: number;
  hasPaid: boolean;
}

function deliveryLabel(status: Portfolio["status"]) {
  return status === "published" ? "Ready" : "Draft";
}

export default function PhotographerHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [portfolios, purchases] = await Promise.all([
        portfolioService.listByPhotographer(user.id),
        photographerService.listPurchases(user.id),
      ]);
      const enriched: Row[] = await Promise.all(
        portfolios.map(async (portfolio) => {
          const photos: Photo[] = await photoService.listByPortfolio(portfolio.id);
          const portfolioPurchases = (purchases as Purchase[]).filter(
            (p) => p.portfolioId === portfolio.id,
          );
          const paidTotal = portfolioPurchases
            .filter((p) => p.status === "paid")
            .reduce((s, p) => s + p.total, 0);
          return {
            portfolio,
            photoCount: photos.length,
            paidTotal,
            hasPaid: paidTotal > 0,
          };
        }),
      );
      if (!cancelled) {
        setRows(
          enriched.sort(
            (a, b) =>
              new Date(b.portfolio.publishedAt ?? b.portfolio.createdAt).getTime() -
              new Date(a.portfolio.publishedAt ?? a.portfolio.createdAt).getTime(),
          ),
        );
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const totals = useMemo(() => {
    const sumPaid = rows.reduce((s, r) => s + r.paidTotal, 0);
    const numPaid = rows.filter((r) => r.hasPaid).length;
    return { sumPaid, numPaid };
  }, [rows]);

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-serif font-semibold">Work history</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Past portfolios and payment status — {totals.numPaid} paid · ${totals.sumPaid.toFixed(0)}{" "}
        total
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground mt-8">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-8 border border-border rounded-lg p-6 bg-card">
          No portfolios yet.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto border border-border rounded-lg bg-card">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/80 text-foreground">
              <tr>
                <th className="p-3 font-medium">Portfolio</th>
                <th className="p-3 font-medium">Clients</th>
                <th className="p-3 font-medium">Published</th>
                <th className="p-3 font-medium">Photos</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Payment</th>
                <th className="p-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ portfolio, photoCount, paidTotal, hasPaid }) => (
                <tr key={portfolio.id} className="border-t border-border">
                  <td className="p-3">
                    <Link
                      to={`/studio/portfolios/${portfolio.id}`}
                      className="text-primary underline underline-offset-2"
                    >
                      {portfolio.title}
                    </Link>
                  </td>
                  <td className="p-3">
                    {portfolio.clients.length === 0
                      ? "—"
                      : portfolio.clients.map((c) => c.name).join(", ")}
                  </td>
                  <td className="p-3">
                    {portfolio.publishedAt
                      ? new Date(portfolio.publishedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-3">{photoCount}</td>
                  <td className="p-3">{deliveryLabel(portfolio.status)}</td>
                  <td className="p-3">{hasPaid ? "Paid" : "Pending"}</td>
                  <td className="p-3">${paidTotal.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
