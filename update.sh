#!/usr/bin/env bash
# APP/update.sh — rebuild the SPA and push it to S3 + CloudFront.
# Skips npm install for fast iteration. If you added new dependencies, run create.sh again.
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
#                                  client cart / checkout.
#   AWS_REGION                     Region for the AWS CLI (uses configured default if unset).
set -euo pipefail

: "${VITE_API_BASE_URL:?Set VITE_API_BASE_URL (terraform output -raw http_api_endpoint, no trailing slash)}"
: "${S3_FRONTEND_BUCKET:?Set S3_FRONTEND_BUCKET (terraform output -raw s3_frontend_bucket)}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?Set CLOUDFRONT_DISTRIBUTION_ID (terraform output -raw cloudfront_distribution_id)}"

if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "ERROR: AWS credentials not available. Run 'aws configure' (or set AWS_PROFILE / env vars) and retry."
  exit 1
fi

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Preserve existing .env values for variables the user typically sets ONCE and
# does not re-export every run. The Stripe publishable key is stable across
# lab resets (it lives on stripe.com, not in AWS), so if the user pasted it
# into APP/.env manually we carry it over instead of clobbering it.
EXISTING_STRIPE_PK=""
if [[ -f "$APP_ROOT/.env" ]]; then
  EXISTING_STRIPE_PK="$(grep -E '^VITE_STRIPE_PUBLISHABLE_KEY=' "$APP_ROOT/.env" | head -n 1 | cut -d= -f2- || true)"
fi
STRIPE_PK="${VITE_STRIPE_PUBLISHABLE_KEY:-$EXISTING_STRIPE_PK}"

echo "==> Writing $APP_ROOT/.env"
{
  echo "VITE_API_BASE_URL=$VITE_API_BASE_URL"
  if [[ -n "$STRIPE_PK" ]]; then
    echo "VITE_STRIPE_PUBLISHABLE_KEY=$STRIPE_PK"
  else
    echo "WARNING: VITE_STRIPE_PUBLISHABLE_KEY is empty — client checkout will be disabled in the SPA." >&2
  fi
} > "$APP_ROOT/.env"

if [[ ! -d "$APP_ROOT/node_modules" ]]; then
  echo "node_modules missing — installing dependencies first"
  cd "$APP_ROOT"
  npm install
fi

echo "==> npm run build"
cd "$APP_ROOT"
npm run build

# Stay inside $APP_ROOT and pass `dist/` (a RELATIVE path). The AWS CLI binary
# on Windows (aws.exe invoked from Git Bash) cannot read Unix-style /d/… paths,
# so passing the bare folder name from the current directory sidesteps the
# entire path-translation problem on every platform.
echo "==> aws s3 sync dist/ s3://$S3_FRONTEND_BUCKET/"
aws s3 sync "dist/" "s3://$S3_FRONTEND_BUCKET/" --delete \
  ${AWS_REGION:+--region "$AWS_REGION"}

echo "==> CloudFront invalidation ($CLOUDFRONT_DISTRIBUTION_ID)"
aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*" \
  ${AWS_REGION:+--region "$AWS_REGION"} \
  >/dev/null

echo "Done. SPA published with VITE_API_BASE_URL=$VITE_API_BASE_URL"
