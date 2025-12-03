#!/bin/bash

# Make the file Executable
# chmod +x deploy-all.sh

# Deploy Ch
# ./deploy-all.sh


#!/bin/bash
set -e

echo "================================================="
echo " 🚀 Deploying devicereservation to DEV, TEST, and PROD"
echo "================================================="

# 1) Clean & build TypeScript locally
echo "📦 Cleaning & Building..."
npm run clean
npm run build

# 2) DEV
echo "===================================="
echo "🌱 Deploying to DEV: devicereservation-dev-ab07-func"
echo "===================================="
func azure functionapp publish devicereservation-dev-ab07-func --typescript --nozip

# 3) TEST
echo "===================================="
echo "🧪 Deploying to TEST: devicereservation-test-ab07-func"
echo "===================================="
func azure functionapp publish devicereservation-test-ab07-func --typescript --nozip

# 4) PROD
echo "===================================="
echo "🏭 Deploying to PROD: devicereservation-prod-ab07-func"
echo "===================================="
func azure functionapp publish devicereservation-prod-ab07-func --typescript --nozip

echo "===================================="
echo "🎉 All deployments completed!"
echo "===================================="
