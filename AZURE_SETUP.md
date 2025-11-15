# Azure Environment Setup

## Overview
This document describes the Azure infrastructure setup for the Campus Device Reservation system across three environments: Development, Test, and Production.

## Environments

### 1. Development (DEV)
- **Purpose**: Local development using localhost
- **Resource Group**: `devicereservation-dev-Ab07-rg`
- **Location**: UK South
- **Function App**: Runs locally on developer machine

#### Resources:
- **Cosmos DB**: `devicereservation-dev-ab07` (Serverless)
  - Database: `DeviceReservationDB`
  - Container: `Reservations`
- **Event Grid Topic**: `devicereservation-dev-ab07-topic`
- **Storage Account**: `devresdevab07sa`
  - Container: `device-snapshots` (for device catalog snapshots)

### 2. Test (TEST)
- **Purpose**: Testing and QA
- **Resource Group**: `devicereservation-test-Ab07-rg`
- **Location**: UK South
- **Function App**: `devicereservation-test-ab07`
  - URL: https://devicereservation-test-ab07.azurewebsites.net

#### Resources:
- **Cosmos DB**: `devicereservation-test-ab07` (Serverless)
  - Database: `DeviceReservationDB`
  - Container: `Reservations`
- **Event Grid Topic**: `devicereservation-test-ab07-topic`
- **Storage Account**: `devrestestab07sa`
  - Container: `device-snapshots`

### 3. Production (PROD)
- **Purpose**: Live production environment
- **Resource Group**: `devicereservation-prod-Ab07-rg`
- **Location**: UK South
- **Function App**: `devicereservation-prod-ab07`
  - URL: https://devicereservation-prod-ab07.azurewebsites.net

#### Resources:
- **Cosmos DB**: `devicereservation-prod-ab07` (Serverless)
  - Database: `DeviceReservationDB`
  - Container: `Reservations`
- **Event Grid Topic**: `devicereservation-prod-ab07-topic`
- **Storage Account**: `devresprodab07sa`
  - Container: `device-snapshots`

## Configuration Files

### Environment Files
- `.env.dev` - Development environment configuration
- `.env.test` - Test environment configuration
- `.env.prod` - Production environment configuration

**Note**: These files contain sensitive credentials and are excluded from git via `.gitignore`

### Local Development
- `local.settings.json` - Used for local Azure Functions development (dev environment)

## Deployment

### Deploy to Test Environment
```bash
cd Services/device-reservation
func azure functionapp publish devicereservation-test-ab07
```

### Deploy to Production Environment
```bash
cd Services/device-reservation
func azure functionapp publish devicereservation-prod-ab07
```

## Cosmos DB Setup

After deployment, ensure the Cosmos DB database and container are created:

```bash
# For each environment, create database and container
az cosmosdb sql database create \
  --account-name <cosmos-account-name> \
  --resource-group <resource-group-name> \
  --name DeviceReservationDB

az cosmosdb sql container create \
  --account-name <cosmos-account-name> \
  --resource-group <resource-group-name> \
  --database-name DeviceReservationDB \
  --name Reservations \
  --partition-key-path "/id"
```

## Event Grid Integration

The Event Grid topics are configured to receive events from:
- Device Catalog Service (device availability updates)
- Staff Management Service (loan/return confirmations)

## Storage Account Usage

The blob storage accounts store device snapshots from the Device Catalog Service, enabling the reservation service to check device availability without constant API calls.

## Security Notes

- All Cosmos DB accounts use serverless pricing model
- Storage accounts are configured with secure HTTPS endpoints
- Event Grid topics require access keys for publishing
- Function Apps have Application Insights enabled for monitoring
- All sensitive keys are stored in environment-specific configuration files

## Monitoring

Application Insights instances have been automatically created for both Function Apps:
- Test: `devicereservation-test-ab07`
- Production: `devicereservation-prod-ab07`

Access via Azure Portal to view logs, metrics, and performance data.
