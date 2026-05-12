# APP - Lumiere SPA Frontend (React + Vite)

## Introduction

### Resume 

Lumière is a cloud-native photography marketplace that lets photographers sell session-based portfolios online without managing any infrastructure of their own. Photographers sign up, create portfolios, upload originals, and invite specific clients to private galleries. Behind the scenes the originals land in a private S3 bucket and trigger an asynchronous SQS + Lambda pipeline that generates watermarked previews and thumbnails. Clients only ever see the watermarked variants until they pay, at which point Stripe Checkout fires a webhook, the purchase is recorded in PostgreSQL (Neon), and the original images become downloadable for that client only.

The whole stack runs serverless on AWS and is provisioned end-to-end with Terraform: Cognito for authentication, API Gateway + Lambda for the Express API, S3 + CloudFront for the React SPA, SQS for the watermark queue, SNS + CloudWatch for transactional notifications and operational alarms, and Neon Postgres for relational state. Three independent repositories (INFRA, API, APP) ship through GitHub Actions — linting and validation on every push, plus automated aws lambda update-function-code and aws s3 sync + CloudFront invalidations on every merge to main — so the same codebase can be torn down and redeployed cleanly into the AWS Academy lab whenever the four-hour session expires.

### Frontend Integration

Single-page app served from S3 + CloudFront. Talks only to the API in (Cognito tokens are injected by the API; the SPA never calls AWS services directly).

The API and Infraestructure are build from these repositories, these need to be launched before uploading the app.
- https://github.com/VELITA0000/ProyectoNube-INFRA
- https://github.com/VELITA0000/ProyectoNube-BACK

## Description

### Technology Stack

| Technology | Purpose |
|---|---|
| **Vite 5** | Fast development and bundling |
| **TypeScript** | Typing and API contracts |
| **React 18** | User interface |
| **Tailwind CSS 3** | Styling and design |
| **React Router v6** | Navigation and nested routes |
| **shadcn/ui + Radix** | Reusable accessible components |
| **@tanstack/react-query** | Server state (future use) |
| **AuthContext + Cognito** | Authentication with tokens |
| **Stripe** | Payments (Elements and PaymentElement) |
| **lucide-react** | Icons |

### Source map

| Technology / Path | Purpose |
|---|---|
| **`index.html`** | Root HTML that loads `/src/main.tsx` |
| **`src/main.tsx`** | React 18 mount point (`createRoot` on `#root`) |
| **`src/App.tsx`** | Providers, router setup, and route table |
| **`src/contexts/AuthContext.tsx`** | Auth provider with signIn/signUp/signOut; loads user from `/auth/me` |
| **`src/hooks/useAuth.ts`** | Auth hook that throws if used outside provider |
| **`src/components/ProtectedRoute.tsx`** | Handles loading, login redirect, and role mismatch |
| **`src/lib/api.ts`** | `apiFetch<T>()` — base URL + Bearer token + error handling |
| **`src/lib/utils.ts`** | `cn()` utility (clsx + tailwind-merge) |
| **`src/types/index.ts`** | Shared TypeScript types mirroring the API |
| **`src/services/*.ts`** | One service per resource — all API calls go here |
| **`src/components/layout/`** | Authenticated shell + role-specific sidebars |
| **`src/components/photographer/PhotoUploader.tsx`** | Drag-and-drop upload (presigned URL -> S3 PUT) |
| **`src/components/modals/`** | Modals for portfolio, session, and publishing |
| **`src/components/ui/*.tsx`** | shadcn/ui primitive components |
| **`src/pages/*`** | One file per route |

### Routing

Defined in `src/App.tsx`. Public routes are at the root, the photographer and client areas live under nested layouts and require `ProtectedRoute`.

```
/                        Landing (role picker)
/login                   Login
/register                RegisterType (alternate role picker)
/register/details        Register form (?type=photographer|client)

/studio (photographer)
  ├── /                  Clients (index)
  ├── /my-portfolio      MyPortfolio
  ├── /portfolios        Portfolios (list + sessions per client)
  ├── /portfolios/:id    PortfolioDetail (sessions + create)
  ├── /sessions/:id      SessionDetail (upload + publish + delete)
  └── /history           History (revenue / status table)

/client (client)
  ├── /                  Sessions (published list)
  ├── /sessions/:id      Gallery (select + add to cart)
  ├── /cart              Cart (Stripe checkout)
  └── /purchases         Purchases (download originals)

*                        NotFound
```

### Authorization & API Contract

**Token & Auth**
- Cognito ```ID token``` stored in ```localStorage["lumiere.idToken"]``` -> sent as ```Authorization: Bearer``` on every request.
- No auto-refresh. ```401``` = logout -> ```ProtectedRoute``` redirects.
- ```signIn/signUp``` write the Cognito token and set the user. Redirect based on ```user.role```.
- ```signOut``` calls ```POST /auth/signout``` (best effort) + clears the Cognito token regardless.
- Errors: ```apiFetch``` throws ```ApiError```. Pages catch and show toast.

**Services**
- ```authService```: ```POST /auth/signup```, ```POST /auth/signin```, ```POST /auth/signout```, ```GET /auth/me```
- ```portfolioService```: ```GET /portfolios?photographerId=```, ```GET /portfolios/:id```, ```POST /portfolios```, ```PATCH /portfolios/:id```, ```DELETE /portfolios/:id```
- ```sessionService```: ```GET /sessions?(photographerId|clientId|portfolioId)=```, ```GET /sessions/:id```, ```POST /sessions```, ```PATCH /sessions/:id```, ```POST /sessions/:id/publish```, ```DELETE /sessions/:id```
- ```photoService```: ```POST /photos/presign```, S3 ```PUT``` (presigned, raw ```fetch```), ```GET /photos/:id```, ```GET /photos?(sessionId|portfolioId)=```, ```GET /photos/:id/original```, ```DELETE /photos/:id```, ```waitForReady()``` polling helper
- ```cartService```: ```GET/DELETE /cart```, ```POST/DELETE /cart/items[/photoId]```, ```POST /cart/checkout```, ```GET /purchases?clientId=```
- ```photographerService```: ```GET /photographer/clients```, ```GET /photographer/purchases```

### Views 

**Public**
- ```Landing.tsx```: Role picker (Photographer/Client) -> sign-up. Sign-in link at bottom.
- ```Login.tsx```: Email + password form, calls ```signIn```, stores token, redirects to ```/studio``` or ```/client```.
- ```Register.tsx```: Form calls ```signUp```.

**Photographer (```/studio/*```)**
- ```Clients.tsx```: Lists registered clients. "+ Add client" asks for email -> creates draft session.
- ```Portfolios.tsx```: Two sections: your portfolios list + sessions by client (pick client -> see their sessions).
- ```PortfolioDetail.tsx```: Portfolio cover, description, sessions list. "New session" button, delete portfolio option.
- ```SessionDetail.tsx```: Photos grid + drag-drop uploader. Polls every 3s for photo processing. Delete photos, publish/resend button (enabled when any photo ```ready```), delete session.
- ```History.tsx```: Table: project, client, date, photo count, status, payment status, total paid.

**Client (```/client/*```)**
- ```Sessions.tsx```: List of published sessions. Card shows first thumbnail, photographer name, date.
- ```Gallery.tsx```: Session photos, polls every 2s for processing. Toggle photos to cart. Header shows photographer contact info
- ```Cart.tsx```: Thumbnails per item. "Pay" -> Stripe PaymentElement -> confirm payment -> redirect to purchases.
- ```Purchases.tsx```: List of paid purchases. Each photo has download button, presigned URL in new tab

**Errors**
- ```NotFound.tsx```: 404 page with link back to home.

**Photo Upload UX**
- For each dropped file: get presigned URL -> PUT directly to S3 -> refetch photo to show immediately.
- Watermark Lambda processes SQS message: creates watermarked + thumbnail versions, updates status to ```ready```.
- Polling (3s in ```SessionDetail```, 2s in ```Gallery```) picks up the new state.

### State Management

**Authentication (login status):** 
- React Context (`AuthProvider`) keeps track of ```{ user, loading, signIn, signUp, signOut }```. When the app starts, it calls ```GET /auth/me``` to reload the user's information.

**Server data:** 
- Each page manages its own data using ```useEffect``` + ```useState``` (simple React hooks). A ```QueryClient``` from ```@tanstack/react-query``` is set up in ```App.tsx``` but not actively used yet — it's ready for future improvements.

**Polling (auto-refresh):** 
- Pages check for new data automatically every few seconds using ```setInterval```:
  ```SessionDetail```: every 3 seconds
  ```Gallery```: every 2 seconds
  ```photoService.waitForReady``` helper: configurable interval (default 1.5 seconds, max 60 attempts)

**Shopping cart:** 
- Stored on the server, not in the browser. The ```Gallery``` keeps a local ```Set<string>``` of photo IDs for quick "in cart?" checks, but always refreshes from ```GET /cart``` after any add/remove action to stay in sync.

## Launch

### Prerequisites

**1. AWS credentials**   
```bash
aws configure
aws sts get-caller-identity
```

**2. Node + npm (build the bundle)**    
```bash
node --version
npm --version
```

**4. INFRA already applied**            
The frontend bucket + CloudFront distribution must exist. From ```INFRA/environments/prod```

**5. API already deployed**    
```bash
curl "<http_api_endpoint>/health"
```

Should return ```{"ok":true}```

### First deploy (Standalone)

**1. Execution permission for the scripts**    
```bash
chmod +x APP/*.sh
```

**2. Setup variables**   
Copy from ```.env.example```
```
VITE_API_BASE_URL
VITE_STRIPE_PUBLISHABLE_KEY
```

Private variables (can't be in the frontend)
```bash
export VITE_API_BASE_URL=""
export S3_FRONTEND_BUCKET=""
export CLOUDFRONT_DISTRIBUTION_ID=""
```

**3. Run create.sh**   
```bash
APP/create.sh
```

The script executes the following sequence internally:
- Verifies ```AWS_credentials``` work (```aws sts get-caller-identity```).
- Verifies ```VITE_API_BASE_URL```, ```S3_FRONTEND_BUCKET``` and ```CLOUDFRONT_DISTRIBUTION_ID``` are exported.
- Writes ```APP/.env``` with ```VITE_API_BASE_URL``` (and ```VITE_STRIPE_PUBLISHABLE_KEY``` if exported); warns to ```stderr``` when Stripe is missing.
- Runs ```npm install``` in ```APP/``` (full install).
- Runs ```npm run build``` (Vite production build -> ```APP/dist/```).
- Calls ```aws s3 sync APP/dist/ s3://$S3_FRONTEND_BUCKET/ --delete``` so the bucket mirrors ```dist/``` exactly.
- Calls ```aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*"``` so the CDN serves the new bundle right away.

**4. Smoke test**       
With this link you can also enter to the application 

```bash
curl -I "<CLOUDFRONT_ORIGIN_URL>"
```

### Changes

The script reuses ```node_modules``` if present, regenerates ```dist/``` and re-uploads.

**1. Edit**  
- Modify ```APP/src/**``` (pages, components, services), use ```APP/create.sh```
- Bump ```APP/package.json``` if you add a dependency, use```create.sh```

**2. Apply changes**    
```bash
bash APP/update.sh
bash APP/create.sh
```

Internal sequence of ```update.sh```:
- Verifies AWS credentials and the three required env vars.
- Rewrites ```APP/.env```.
- Runs ```npm install``` only if ```node_modules/``` is missing.
- Runs ```npm run build```.
- Syncs ```dist/``` to S3 with ```--delete``` (removes obsolete files).
- Invalidates ```/*``` on CloudFront so users do not get the cached old hash.

**3. When INFRA is recreated**     
Reexport

```bash
export VITE_API_BASE_URL=""
export S3_FRONTEND_BUCKET=""
export CLOUDFRONT_DISTRIBUTION_ID=""
```

Update
```bash APP/update.sh```

**Update APP contract**      
If the backend changes a response shape, sync it in ```APP/src/types/index.ts``` and the matching ```APP/src/services/*.ts```

Run
```bash APP/update.sh```