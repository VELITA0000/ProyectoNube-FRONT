import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useAuth } from "@/contexts/AuthContext";
import { cartService } from "@/services/cartService";
import { photoService } from "@/services/photoService";
import { portfolioService } from "@/services/portfolioService";
import type { CartItem, CheckoutInitResult, Photo, Portfolio } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface CartRow extends CartItem {
  photo?: Photo;
  portfolio?: Portfolio;
}

const stripePk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise = stripePk ? loadStripe(stripePk) : null;

function StripePayStep({
  onDone,
  onError,
}: {
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });
      if (error) {
        onError(error.message ?? "Payment declined");
        return;
      }
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 space-y-4 border border-border rounded-lg p-4 bg-card">
      <PaymentElement />
      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy || !stripe}
        className="w-full px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Processing…" : "Confirm payment"}
      </button>
    </div>
  );
}

export default function ClientCart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<CartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkout, setCheckout] = useState<CheckoutInitResult | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const items = await cartService.getCart(user.id);
    const portfolioIds = Array.from(new Set(items.map((i) => i.portfolioId)));
    // Fetch portfolio metadata + the photo list for each portfolio so we can
    // render the cart row with the right thumbnail and title.
    const portfolios = (
      await Promise.all(portfolioIds.map((pid) => portfolioService.getById(pid)))
    ).filter(Boolean) as Portfolio[];
    const allPhotos = (
      await Promise.all(portfolioIds.map((pid) => photoService.listByPortfolio(pid)))
    ).flat();
    setRows(
      items.map((i) => ({
        ...i,
        photo: allPhotos.find((p) => p.id === i.photoId),
        portfolio: portfolios.find((p) => p.id === i.portfolioId),
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [user]);

  const total = rows.reduce((sum, r) => sum + r.unitPrice, 0);

  const remove = async (photoId: string) => {
    if (!user) return;
    await cartService.removeItem(user.id, photoId);
    await load();
    toast({ title: "Removed from cart" });
  };

  const startCheckout = async () => {
    if (!user || rows.length === 0) return;
    if (!stripePromise) {
      toast({
        title: "Stripe not configured",
        description: "Set VITE_STRIPE_PUBLISHABLE_KEY in .env.",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await cartService.initCheckout(user.id);
      setCheckout(res);
    } catch {
      toast({ title: "Could not start payment", variant: "destructive" });
    }
  };

  const elementsOptions = useMemo(
    () =>
      checkout?.clientSecret
        ? { clientSecret: checkout.clientSecret, appearance: { theme: "stripe" as const } }
        : undefined,
    [checkout?.clientSecret],
  );

  return (
    <div className="max-w-3xl">
      <Link to="/client" className="text-sm text-primary underline underline-offset-2">
        ← Back
      </Link>
      <h1 className="text-2xl font-serif font-semibold mt-6">Order summary</h1>

      {loading ? (
        <p className="text-sm text-muted-foreground mt-8">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-8 border border-border rounded-lg p-6 bg-card">
          Cart is empty.{" "}
          <Link to="/client" className="text-primary underline underline-offset-2">
            My sessions
          </Link>
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {rows.map((r) => (
            <div
              key={r.photoId}
              className="flex flex-wrap items-center gap-4 border border-border rounded-lg p-4 bg-card"
            >
              {r.photo?.thumbnailUrl ? (
                <img src={r.photo.thumbnailUrl} alt="" className="w-16 h-16 object-cover rounded-md" />
              ) : (
                <div className="w-16 h-16 bg-muted rounded-md" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium font-serif">
                  {r.portfolio?.title ?? "Photo"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Digital photo without watermark
                </div>
              </div>
              <div className="text-sm">${r.unitPrice.toFixed(0)}</div>
              <button
                type="button"
                onClick={() => remove(r.photoId)}
                className="text-xs text-destructive underline"
              >
                Remove
              </button>
            </div>
          ))}

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <span className="font-medium font-serif">Total</span>
            <span className="text-xl font-serif font-semibold">${total.toFixed(0)}</span>
          </div>

          {!checkout ? (
            <button
              type="button"
              onClick={() => void startCheckout()}
              className="w-full mt-4 px-4 py-3 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90"
            >
              Pay ${total.toFixed(0)}
            </button>
          ) : stripePromise && elementsOptions ? (
            <Elements stripe={stripePromise} options={elementsOptions}>
              <StripePayStep
                onDone={async () => {
                  // Tell the API to verify the PaymentIntent and flip the
                  // purchases to `paid`. The Stripe webhook would normally
                  // do this, but configuring the webhook on stripe.com is a
                  // separate manual step; this client-driven confirm path
                  // makes the happy case work without it.
                  try {
                    const res = await cartService.confirmCheckout(checkout!.paymentIntentId);
                    if (res.status === "succeeded") {
                      toast({ title: "Payment confirmed" });
                    } else if (res.status === "processing") {
                      toast({
                        title: "Payment processing",
                        description: "We will mark it paid once Stripe finishes.",
                      });
                    } else if (res.status === "requires_action") {
                      toast({
                        title: "Additional verification required",
                        description: "Stripe asked for extra confirmation; check your bank.",
                        variant: "destructive",
                      });
                    } else {
                      toast({
                        title: `Stripe status: ${res.status}`,
                        variant: "destructive",
                      });
                    }
                  } catch (err) {
                    toast({
                      title: "Could not confirm payment",
                      description: err instanceof Error ? err.message : "Try again",
                      variant: "destructive",
                    });
                  } finally {
                    setCheckout(null);
                    navigate("/client/purchases");
                  }
                }}
                onError={(msg) => toast({ title: msg, variant: "destructive" })}
              />
            </Elements>
          ) : null}
        </div>
      )}
    </div>
  );
}
