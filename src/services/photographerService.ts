import type { Purchase, User } from "@/types";
import { apiFetch } from "@/lib/api";

export const photographerService = {
  async listClients(photographerId: string): Promise<User[]> {
    return apiFetch<User[]>(
      `/photographer/clients?photographerId=${encodeURIComponent(photographerId)}`,
    );
  },

  /** Add a client to the photographer's roster. The client must have a `client` account already. */
  async addClient(email: string): Promise<User> {
    return apiFetch<User>("/photographer/clients", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async removeClient(clientId: string): Promise<void> {
    await apiFetch<void>(`/photographer/clients/${clientId}`, { method: "DELETE" });
  },

  async listPurchases(photographerId: string): Promise<Purchase[]> {
    return apiFetch<Purchase[]>(
      `/photographer/purchases?photographerId=${encodeURIComponent(photographerId)}`,
    );
  },
};
