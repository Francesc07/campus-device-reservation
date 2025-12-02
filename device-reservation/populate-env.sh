#!/bin/bash

# =========================================================
#   POPULATE local.settings.json FOR RESERVATION SERVICE
# =========================================================

ENVIRONMENT=$1

if [[ -z "$ENVIRONMENT" ]]; then
  echo "❌ ERROR: Please provide an environment: dev | test | prod"
  exit 1
fi

if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "test" && "$ENVIRONMENT" != "prod" ]]; then
  echo "❌ ERROR: Invalid environment. Use: dev | test | prod"
  exit 1
fi

# =========================================================
# RESERVATION SERVICE CONFIG
# =========================================================

SERVICE_NAME="devicereservation"
SERVICE_NAME_SHORT="deviceres"
DB_NAME="DeviceReservationDB"
RES_CONTAINER="Reservations"

# =========================================================
# AUTO-GENERATE RESOURCE NAMES
# =========================================================

RG="CampusDeviceLender-$ENVIRONMENT-Ab07-rg"
COSMOS="${SERVICE_NAME}-${ENVIRONMENT}-ab07-cosmos"
STORAGE="${SERVICE_NAME_SHORT}${ENVIRONMENT}ab07sa"

# EVENT GRID (INBOUND + OUTBOUND)
TOPIC_LOAN="deviceloan-$ENVIRONMENT-ab07-topic"
TOPIC_CONFIRM="deviceconfirmation-$ENVIRONMENT-ab07-topic"

LOCAL_SETTINGS="./local.settings.json"

echo "🔍 Environment...............: $ENVIRONMENT"
echo "🔍 Resource Group............: $RG"
echo "🔍 Reservation Cosmos........: $COSMOS"
echo "🔍 Reservation Storage.......: $STORAGE"
echo ""
echo "🔍 Loan Events Topic.........: $TOPIC_LOAN   (INBOUND)"
echo "🔍 Confirmation Topic........: $TOPIC_CONFIRM (OUTBOUND)"
echo ""

# =========================================================
# COSMOS DB
# =========================================================

echo "🔄 Fetching Cosmos DB connection..."
COSMOS_CONN=$(az cosmosdb keys list \
  --name $COSMOS \
  --resource-group $RG \
  --type connection-strings \
  --query "connectionStrings[0].connectionString" -o tsv)

if [[ -z "$COSMOS_CONN" ]]; then
  echo "❌ ERROR: Failed to fetch Cosmos DB credentials"
  exit 1
fi

# =========================================================
# STORAGE ACCOUNT
# =========================================================

echo "🔄 Fetching Storage Account connection..."
STORAGE_CONN=$(az storage account show-connection-string \
  --name $STORAGE \
  --resource-group $RG \
  --query connectionString -o tsv)

if [[ -z "$STORAGE_CONN" ]]; then
  echo "❌ ERROR: Failed to fetch Storage credentials"
  exit 1
fi

# =========================================================
# EVENT GRID TOPICS (ENDPOINTS + KEYS)
# =========================================================

echo "🔄 Fetching Loan Topic endpoint..."
EG_LOAN_ENDPOINT=$(az eventgrid topic show \
  --name $TOPIC_LOAN \
  --resource-group $RG \
  --query endpoint -o tsv)

echo "🔄 Fetching Confirmation Topic endpoint..."
EG_CONFIRM_ENDPOINT=$(az eventgrid topic show \
  --name $TOPIC_CONFIRM \
  --resource-group $RG \
  --query endpoint -o tsv)

echo "🔄 Fetching Loan Topic key..."
EG_LOAN_KEY=$(az eventgrid topic key list \
  --name $TOPIC_LOAN \
  --resource-group $RG \
  --query key1 -o tsv)

echo "🔄 Fetching Confirmation Topic key..."
EG_CONFIRM_KEY=$(az eventgrid topic key list \
  --name $TOPIC_CONFIRM \
  --resource-group $RG \
  --query key1 -o tsv)

# =========================================================
# GENERATE local.settings.json
# =========================================================

echo "📝 Writing local.settings.json..."

cat > $LOCAL_SETTINGS <<EOF
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "ENVIRONMENT": "$ENVIRONMENT-local",

    "COSMOS_DB_CONNECTION_STRING": "$COSMOS_CONN",
    "COSMOS_DB_DATABASE_NAME": "$DB_NAME",
    "COSMOS_RESERVATION_CONTAINER": "$RES_CONTAINER",

    "AZURE_STORAGE_CONNECTION_STRING": "$STORAGE_CONN",

    "EVENTGRID_LOAN_TOPIC_ENDPOINT": "$EG_LOAN_ENDPOINT",
    "EVENTGRID_LOAN_TOPIC_KEY": "$EG_LOAN_KEY",

    "EVENTGRID_CONFIRM_TOPIC_ENDPOINT": "$EG_CONFIRM_ENDPOINT",
    "EVENTGRID_CONFIRM_TOPIC_KEY": "$EG_CONFIRM_KEY"
  }
}
EOF

echo "✅ SUCCESS: Reservation service local.settings.json generated for $ENVIRONMENT"
echo "📁 File: $LOCAL_SETTINGS"
