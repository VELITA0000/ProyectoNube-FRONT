import type { Portfolio, PortfolioClientSummary } from "@/types";
import { apiFetch } from "@/lib/api";

interface CreateInput {
  title: string;
  description?: string;
  /** Existing client UUIDs (typically from `photographerService.listClients`). */
  clientIds?: string[];
  /** Plain emails; the API resolves them to clients (must already be registered). */
  clientEmails?: string[];
}

interface CreateResult extends Portfolio {
  /** Emails the API could not match to a registered client. */
  unknownEmails: string[];
}

interface PublishResult {
  portfolio: Portfolio;
  enqueuedPhotos: number;
  notificationsSent: number;
}

interface AddClientsResult {
  clients: PortfolioClientSummary[];
  unknownEmails: string[];
}

export const portfolioService = {
  async listByPhotographer(photographerId: string): Promise<Portfolio[]> {
    return apiFetch<Portfolio[]>(
      `/portfolios?photographerId=${encodeURIComponent(photographerId)}`,
    );
  },

  /** Portfolios published to the authenticated client. */
  async listSharedWithMe(): Promise<Portfolio[]> {
    return apiFetch<Portfolio[]>("/portfolios/shared-with-me");
  },

  async getById(id: string): Promise<Portfolio | null> {
    try {
      return await apiFetch<Portfolio>(`/portfolios/${id}`);
    } catch {
      return null;
    }
  },

  async create(input: CreateInput): Promise<CreateResult> {
    return apiFetch<CreateResult>("/portfolios", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async update(
    id: string,
    patch: { title?: string; description?: string; coverPhotoId?: string },
  ): Promise<Portfolio> {
    return apiFetch<Portfolio>(`/portfolios/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  async remove(id: string): Promise<void> {
    await apiFetch<void>(`/portfolios/${id}`, { method: "DELETE" });
  },

  async addClients(
    portfolioId: string,
    payload: { clientIds?: string[]; clientEmails?: string[] },
  ): Promise<AddClientsResult> {
    return apiFetch<AddClientsResult>(`/portfolios/${portfolioId}/clients`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async removeClient(
    portfolioId: string,
    clientId: string,
  ): Promise<{ clients: PortfolioClientSummary[] }> {
    return apiFetch<{ clients: PortfolioClientSummary[] }>(
      `/portfolios/${portfolioId}/clients/${clientId}`,
      { method: "DELETE" },
    );
  },

  async publish(portfolioId: string): Promise<PublishResult> {
    return apiFetch<PublishResult>(`/portfolios/${portfolioId}/publish`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
};
