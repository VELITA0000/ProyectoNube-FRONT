#!/usr/bin/env bash
# APP/create.sh — first-time deploy of the SPA to S3 + CloudFront.
# Installs npm deps, writes APP/.env with the API URL (and optional Stripe key),
# builds, syncs, invalidates CloudFront.
#
# Required environment variables (export before running):
#   VITE_API_BASE_URL              HTTP API base URL (no trailing slash).
#                                  INFRA: terraform output -raw http_api_endpoint
#   S3_FRONTEND_BUCKET             Bucket where the static build is uploaded.
#                                  INFRA: terraform output -raw s3_frontend_bucket
#   CLOUDFRONT_DISTRIBUTION_ID     Distribution to invalidate after upload.
#                                  INFRA: terraform output -raw cloudfront_distribution_id
#
# Optional:
#   VITE_STRIPE_PUBLISHABLE_KEY    Public Stripe key (pk_...). Required for the
#                                  client cart / checkout. If empty, the Cart
#                                  page shows a "Stripe not configured" error
#                                  but the rest of the SPA still works.
#   AWS_REGION                     Region for the AWS CLI (uses configured default if unset).
#
# Use update.sh for subsequent deploys (skips npm install).
set -euo pipefail

: "${VITE_API_BASE_URL:?Set VITE_API_BASE_URL (terraform output -raw http_api_endpoint, no trailing slash)}"
: "${S3_FRONTEND_BUCKET:?Set S3_FRONTEND_BUCKET (terraform output -raw s3_frontend_bucket)}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?Set CLOUDFRONT_DISTRIBUTION_ID (terraform output -raw cloudfront_distribution_id)}"

if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "ERROR: AWS credentials not available. Run 'aws configure' (or set AWS_PROFILE / env vars) and retry."
  exit 1
fi

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Always start from a clean slate.
#
# create.sh is the FIRST-TIME publish script. Use update.sh for incremental
# rebuilds (which keeps build artifacts where possible). Wiping the previous
# build protects against the two most common failure modes when the lab
# resets or VITE_API_BASE_URL changes:
#   - Vite INLINES VITE_* values into the bundle at build time. A stale
#     dist/ left over from a previous run still has the OLD API URL baked
#     into the JS chunks; if `npm run build` fails partway through, the
#     subsequent `aws s3 sync` would upload those stale assets.
#   - A half-written .env from a crashed previous run.
#
# Files removed:
#   - dist/                   (compiled SPA assets)
#   - .env                    (regenerated below; values not present in the
#                             shell env are carried over from the previous
#                             .env — see "Preserve existing .env values" below)
#
# Files KEPT:
#   - node_modules/           (dep cache; reinstall is slow). If you really
#                             need a pristine install, delete it manually.
#   - package-lock.json       (committed, defines the dep tree)

# Preserve existing .env values for variables the user typically sets ONCE and
# does not re-export every run (Stripe publishable key is the canonical case:
# it is stable across lab resets, so the user pastes it into APP/.env and
# expects subsequent create.sh / update.sh runs to keep it intact).
EXISTING_STRIPE_PK=""
if [[ -f "$APP_ROOT/.env" ]]; then
  EXISTING_STRIPE_PK="$(grep -E '^VITE_STRIPE_PUBLISHABLE_KEY=' "$APP_ROOT/.env" | head -n 1 | cut -d= -f2- || true)"
fi
STRIPE_PK="${VITE_STRIPE_PUBLISHABLE_KEY:-$EXISTING_STRIPE_PK}"

echo "==> Cleaning previous build artifacts"
rm -rf "$APP_ROOT/dist"
rm -f "$APP_ROOT/.env"

echo "==> Writing $APP_ROOT/.env"
{
  echo "VITE_API_BASE_URL=$VITE_API_BASE_URL"
  if [[ -n "$STRIPE_PK" ]]; then
    echo "VITE_STRIPE_PUBLISHABLE_KEY=$STRIPE_PK"
  else
    echo "WARNING: VITE_STRIPE_PUBLISHABLE_KEY is empty — client checkout will be disabled in the SPA." >&2
  fi
} > "$APP_ROOT/.env"

echo "==> npm install"
cd "$APP_ROOT"
npm install

echo "==> npm run build"
npm run build

# Stay inside $APP_ROOT and pass `dist/` (a RELATIVE path). The AWS CLI binary
# on Windows (aws.exe invoked from Git Bash) cannot read Unix-style /d/… paths,
# so passing the bare folder name from the current directory sidesteps the
# entire path-translation problem on every platform.
echo "==> aws s3 sync dist/ s3://$S3_FRONTEND_BUCKET/"
cd "$APP_ROOT"
aws s3 sync "dist/" "s3://$S3_FRONTEND_BUCKET/" --delete \
  ${AWS_REGION:+--region "$AWS_REGION"}

echo "==> CloudFront invalidation ($CLOUDFRONT_DISTRIBUTION_ID)"
aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*" \
  ${AWS_REGION:+--region "$AWS_REGION"} \
  >/dev/null

echo "Done. SPA published with VITE_API_BASE_URL=$VITE_API_BASE_URL"
