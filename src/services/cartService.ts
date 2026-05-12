import type { CartItem, CheckoutInitResult, Purchase } from "@/types";
import { apiFetch } from "@/lib/api";

export const cartService = {
  async getCart(clientId: string): Promise<CartItem[]> {
    return apiFetch<CartItem[]>(`/cart?clientId=${encodeURIComponent(clientId)}`);
  },

  async addItem(
    clientId: string,
    item: { photoId: string; portfolioId: string; unitPrice?: number },
  ): Promise<CartItem[]> {
    await apiFetch("/cart/items", {
      method: "POST",
      body: JSON.stringify({ clientId, ...item }),
    });
    return this.getCart(clientId);
  },

  async removeItem(clientId: string, photoId: string): Promise<CartItem[]> {
    await apiFetch(`/cart/items/${photoId}?clientId=${encodeURIComponent(clientId)}`, {
      method: "DELETE",
    });
    return this.getCart(clientId);
  },

  async clear(clientId: string): Promise<void> {
    await apiFetch(`/cart?clientId=${encodeURIComponent(clientId)}`, { method: "DELETE" });
  },

  async initCheckout(clientId: string): Promise<CheckoutInitResult> {
    return apiFetch<CheckoutInitResult>("/cart/checkout", {
      method: "POST",
      body: JSON.stringify({ clientId }),
    });
  },

  /**
   * Called right after `stripe.confirmPayment` succeeds on the SPA. The API
   * retrieves the PaymentIntent from Stripe, verifies the caller owns it,
   * and flips the matching `purchases` rows to `paid` (or `failed`). This
   * lets the happy flow finish even when the Stripe webhook is not
   * configured — and remains idempotent with the webhook in production.
   */
  async confirmCheckout(paymentIntentId: string): Promise<{ status: string }> {
    return apiFetch<{ status: string }>("/cart/checkout/confirm", {
      method: "POST",
      body: JSON.stringify({ paymentIntentId }),
    });
  },

  async listPurchases(clientId: string): Promise<Purchase[]> {
    return apiFetch<Purchase[]>(`/purchases?clientId=${encodeURIComponent(clientId)}`);
  },
};
