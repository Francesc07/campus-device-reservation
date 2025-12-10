#!/bin/bash

# Azure Environment Resources Summary Script
# Displays all resources for Device Reservation System across all environments

echo "=========================================="
echo "Device Reservation System - Azure Resources"
echo "=========================================="
echo ""

echo "📦 RESOURCE GROUPS"
echo "------------------------------------------"
az group list --query "[?contains(name, 'devicereservation')].{Name:name, Location:location}" -o table
echo ""

echo "🗄️  COSMOS DB ACCOUNTS"
echo "------------------------------------------"
az cosmosdb list --query "[?contains(name, 'devicereservation')].{Name:name, ResourceGroup:resourceGroup, Location:location, ServerlessCapability:capabilities[?name=='EnableServerless'].name | [0]}" -o table
echo ""

echo "📢 EVENT GRID TOPICS"
echo "------------------------------------------"
az eventgrid topic list --query "[?contains(name, 'devicereservation')].{Name:name, ResourceGroup:resourceGroup, Endpoint:endpoint}" -o table
echo ""

echo "💾 STORAGE ACCOUNTS"
echo "------------------------------------------"
az storage account list --query "[?contains(name, 'devres')].{Name:name, ResourceGroup:resourceGroup, Location:location, Sku:sku.name}" -o table
echo ""

echo "⚡ FUNCTION APPS"
echo "------------------------------------------"
az functionapp list --query "[?contains(name, 'devicereservation')].{Name:name, ResourceGroup:resourceGroup, State:state, DefaultHostName:defaultHostName}" -o table
echo ""

echo "=========================================="
echo "Environment Configuration Files Created:"
echo "  - .env.dev (Development - localhost)"
echo "  - .env.test (Test environment)"
echo "  - .env.prod (Production environment)"
echo "  - local.settings.json (Local development)"
echo "=========================================="
