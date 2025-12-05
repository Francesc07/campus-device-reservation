#!/bin/bash
set -e

echo "========================================="
echo "Creating Fresh Reservation Resources"
echo "========================================="

# Function to create resources for one environment
create_env() {
    ENV=$1
    RG=$2
    
    echo ""
    echo "📦 Creating $ENV environment..."
    
    # Storage account name (lowercase, no hyphens)
    if [ "$ENV" = "dev" ]; then
        STORAGE_NAME="deviceresdevab07sa"
    elif [ "$ENV" = "test" ]; then
        STORAGE_NAME="devicerestestab07sa"
    else
        STORAGE_NAME="deviceresprodab07sa"
    fi
    
    FUNC_NAME="devicereservation-$ENV-ab07-func"
    COSMOS_NAME="devicereservation-$ENV-ab07-cosmos"
    
    echo "  Creating Cosmos DB..."
    az cosmosdb create \
        --name $COSMOS_NAME \
        --resource-group $RG \
        --locations regionName=uksouth \
        --default-consistency-level Session \
        --output none
    
    echo "  Creating Cosmos DB database and container..."
    az cosmosdb sql database create \
        --account-name $COSMOS_NAME \
        --resource-group $RG \
        --name DeviceReservationDB \
        --output none
    
    az cosmosdb sql container create \
        --account-name $COSMOS_NAME \
        --resource-group $RG \
        --database-name DeviceReservationDB \
        --name Reservations \
        --partition-key-path "/id" \
        --output none
    
    echo "  Creating Function App..."
    az functionapp create \
        --name $FUNC_NAME \
        --resource-group $RG \
        --storage-account $STORAGE_NAME \
        --consumption-plan-location uksouth \
        --runtime node \
        --runtime-version 22 \
        --functions-version 4 \
        --os-type Linux \
        --output none
    
    echo "  Getting connection strings..."
    COSMOS_CONN=$(az cosmosdb keys list --name $COSMOS_NAME --resource-group $RG --type connection-strings --query "connectionStrings[0].connectionString" -o tsv)
    
    # Get confirmation topic endpoint and key
    CONFIRM_TOPIC_ENDPOINT=$(az eventgrid topic show --name deviceconfirmation-$ENV-ab07-topic --resource-group $RG --query "endpoint" -o tsv)
    CONFIRM_TOPIC_KEY=$(az eventgrid topic key list --name deviceconfirmation-$ENV-ab07-topic --resource-group $RG --query "key1" -o tsv)
    
    echo "  Configuring Function App settings..."
    az functionapp config appsettings set \
        --name $FUNC_NAME \
        --resource-group $RG \
        --settings \
            "ENVIRONMENT=$ENV-cloud" \
            "COSMOS_DB_CONNECTION_STRING=$COSMOS_CONN" \
            "COSMOS_DB_DATABASE_NAME=DeviceReservationDB" \
            "COSMOS_DB_CONTAINER_NAME=Reservations" \
            "EVENTGRID_TOPIC_ENDPOINT=$CONFIRM_TOPIC_ENDPOINT" \
            "EVENTGRID_TOPIC_KEY=$CONFIRM_TOPIC_KEY" \
        --output none
    
    echo "✅ $ENV environment created successfully!"
}

# Create DEV
create_env "dev" "CampusDeviceLender-dev-Ab07-rg"

# Create TEST  
create_env "test" "CampusDeviceLender-test-Ab07-rg"

# Create PROD
create_env "prod" "CampusDeviceLender-prod-Ab07-rg"

echo ""
echo "========================================="
echo "✅ All environments created successfully!"
echo "========================================="
