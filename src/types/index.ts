// Types aligned with API responses (Cognito + Postgres + S3 + Stripe).

export type UserRole = "photographer" | "client";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  studioName?: string;
  bio?: string;
  phone?: string;
  createdAt: string;
}

export interface Photographer extends User {
  role: "photographer";
  studioName?: string;
  bio?: string;
  phone?: string;
}

export interface Client extends User {
  role: "client";
  phone?: string;
}

export type PortfolioStatus = "draft" | "published";

export interface PortfolioClientSummary {
  id: string;
  name: string;
  email: string;
}

export interface Portfolio {
  id: string;
  photographerId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  status: PortfolioStatus;
  publishedAt?: string;
  clients: PortfolioClientSummary[];
  createdAt: string;
  updatedAt: string;
  /** Present in the client `shared-with-me` and detail responses. */
  photographerName?: string;
  photographerEmail?: string;
  photographerPhone?: string;
  photographerAvatarUrl?: string;
}

export type PhotoStatus = "uploaded" | "processing" | "ready" | "failed";

export interface Photo {
  id: string;
  portfolioId: string;
  originalKey: string;
  watermarkedUrl: string;
  thumbnailUrl: string;
  uploadedAt: string;
  status: PhotoStatus;
  /** True when the requesting client has already paid for this specific photo. */
  purchased: boolean;
}

export interface CartItem {
  photoId: string;
  portfolioId: string;
  unitPrice: number;
}

export interface Purchase {
  id: string;
  clientId: string;
  portfolioId: string;
  photoIds: string[];
  total: number;
  status: "pending" | "paid" | "failed";
  createdAt: string;
}

export interface CheckoutInitResult {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: "usd";
  pendingPurchases: Purchase[];
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  studioName?: string;
}

export interface AuthResult {
  user: User;
  idToken: string;
  refreshToken?: string;
}
