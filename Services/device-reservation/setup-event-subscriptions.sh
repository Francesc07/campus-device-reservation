#!/bin/bash
set -e

echo "========================================="
echo "Creating Event Grid Subscriptions"
echo "Loan Service → Reservation Service"
echo "========================================="

create_subscription() {
    ENV=$1
    RG=$2
    
    echo ""
    echo "📡 Creating $ENV subscription..."
    
    FUNC_NAME="devicereservation-$ENV-ab07-func"
    LOAN_TOPIC="deviceloan-$ENV-ab07-topic"
    SUB_NAME="loan-to-reservation-$ENV-sub"
    
    # Get Function App endpoint
    FUNC_ENDPOINT="https://$FUNC_NAME.azurewebsites.net/api/events/loan"
    
    # Get subscription ID
    SUBSCRIPTION_ID=$(az account show --query id -o tsv)
    TOPIC_RESOURCE_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RG/providers/Microsoft.EventGrid/topics/$LOAN_TOPIC"
    
    echo "  Topic: $LOAN_TOPIC"
    echo "  Endpoint: $FUNC_ENDPOINT"
    
    # Create or update subscription
    az eventgrid event-subscription create \
        --name $SUB_NAME \
        --source-resource-id $TOPIC_RESOURCE_ID \
        --endpoint $FUNC_ENDPOINT \
        --endpoint-type webhook \
        --included-event-types "Loan.Created" "Loan.Cancelled" \
        --output none 2>/dev/null || \
    az eventgrid event-subscription update \
        --name $SUB_NAME \
        --source-resource-id $TOPIC_RESOURCE_ID \
        --endpoint $FUNC_ENDPOINT \
        --output none
    
    echo "✅ $ENV subscription created"
}

# Create subscriptions for all environments
create_subscription "dev" "CampusDeviceLender-dev-Ab07-rg"
create_subscription "test" "CampusDeviceLender-test-Ab07-rg"
create_subscription "prod" "CampusDeviceLender-prod-Ab07-rg"

echo ""
echo "========================================="
echo "✅ All subscriptions created!"
echo "========================================="
