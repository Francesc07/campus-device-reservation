#!/bin/bash
#
# Device Reservation Service - Manual Deployment Script
#
# Usage:
#   ./deploy-all.sh              # Deploy to all environments
#   ./deploy-all.sh dev          # Deploy to specific environment
#
# Prerequisites:
#   - Azure CLI logged in
#   - Azure Functions Core Tools installed
#   - Correct permissions on target Function Apps
#
# Note: For automated deployment, use GitHub Actions CI/CD pipeline instead
#

set -e

# Parse environment argument
TARGET_ENV="${1:-all}"

if [[ ! "$TARGET_ENV" =~ ^(dev|test|prod|all)$ ]]; then
  echo "❌ Invalid environment. Use: dev | test | prod | all"
  exit 1
fi

echo "================================================="
echo " 🚀 Device Reservation Service Deployment"
echo "================================================="
echo "Target Environment: $TARGET_ENV"
echo ""

# Clean and build
echo "📦 Cleaning and building..."
npm run clean
npm run build

# Deploy to specified environment(s)
deploy_to_env() {
  ENV=$1
  FUNC_NAME="devicereservation-$ENV-ab07-func"
  
  echo ""
  echo "===================================="
  echo "🚀 Deploying to $ENV: $FUNC_NAME"
  echo "===================================="
  
  func azure functionapp publish "$FUNC_NAME" --typescript --nozip
  
  echo "✅ $ENV deployment completed"
}

# Deploy based on target
if [ "$TARGET_ENV" = "all" ]; then
  deploy_to_env "dev"
  deploy_to_env "test"
  deploy_to_env "prod"
else
  deploy_to_env "$TARGET_ENV"
fi

echo ""
echo "===================================="
echo "🎉 Deployment completed successfully!"
echo "===================================="
