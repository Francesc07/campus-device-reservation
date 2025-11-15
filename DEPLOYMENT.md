# Deployment Guide

## Environment Configuration

The Device Reservation System has three environments configured:

1. **Development (DEV)** - Local development using localhost
2. **Test (TEST)** - Testing environment on Azure
3. **Production (PROD)** - Production environment on Azure

## Prerequisites

- Azure CLI installed and authenticated
- Node.js 20 or higher
- Azure Functions Core Tools v4

## Local Development Setup

1. **Install dependencies:**
   ```bash
   cd Services/device-reservation
   npm install
   ```

2. **Configuration is already set in `local.settings.json`**
   - Points to DEV environment resources
   - Uses local storage emulator for Azure Functions

3. **Start local development:**
   ```bash
   npm run watch  # Watch for file changes and compile
   # In another terminal:
   func start     # Start local Azure Functions host
   ```

4. **Local endpoints:**
   - Functions run on: `http://localhost:7071`

## Deploying to Test Environment

1. **Build the project:**
   ```bash
   cd Services/device-reservation
   npm run build
   ```

2. **Deploy to Test Function App:**
   ```bash
   func azure functionapp publish devicereservation-test-ab07
   ```

3. **Verify deployment:**
   - URL: https://devicereservation-test-ab07.azurewebsites.net
   - Check Application Insights for logs

## Deploying to Production Environment

1. **Build the project:**
   ```bash
   cd Services/device-reservation
   npm run build
   ```

2. **Deploy to Production Function App:**
   ```bash
   func azure functionapp publish devicereservation-prod-ab07
   ```

3. **Verify deployment:**
   - URL: https://devicereservation-prod-ab07.azurewebsites.net
   - Monitor Application Insights for errors

## Environment Variables

All environments are pre-configured with:

- `COSMOS_DB_CONNECTION_STRING` - Cosmos DB connection
- `COSMOS_DB_DATABASE_NAME` - Database name (DeviceReservationDB)
- `COSMOS_DB_CONTAINER_NAME` - Container name (Reservations)
- `EVENTGRID_TOPIC_ENDPOINT` - Event Grid topic endpoint
- `EVENTGRID_TOPIC_KEY` - Event Grid access key
- `AZURE_STORAGE_CONNECTION_STRING` - Blob storage for device snapshots
- `DEVICE_SNAPSHOTS_CONTAINER_NAME` - Container for snapshots
- `ENVIRONMENT` - Current environment (development/test/production)

## Updating Environment Variables

### For Test Environment:
```bash
az functionapp config appsettings set \
  --name devicereservation-test-ab07 \
  --resource-group devicereservation-test-Ab07-rg \
  --settings KEY_NAME="value"
```

### For Production Environment:
```bash
az functionapp config appsettings set \
  --name devicereservation-prod-ab07 \
  --resource-group devicereservation-prod-Ab07-rg \
  --settings KEY_NAME="value"
```

## Viewing Azure Resources

Run the summary script to see all deployed resources:
```bash
./scripts/azure-resources-summary.sh
```

## Monitoring and Logs

### Application Insights

Both Test and Production environments have Application Insights enabled:

**Test:**
```bash
az monitor app-insights component show \
  --app devicereservation-test-ab07 \
  --resource-group devicereservation-test-Ab07-rg
```

**Production:**
```bash
az monitor app-insights component show \
  --app devicereservation-prod-ab07 \
  --resource-group devicereservation-prod-Ab07-rg
```

### Function App Logs

Stream live logs from Function Apps:

**Test:**
```bash
func azure functionapp logstream devicereservation-test-ab07
```

**Production:**
```bash
func azure functionapp logstream devicereservation-prod-ab07
```

## Troubleshooting

### Function App won't start
1. Check Application Settings are correctly configured
2. Verify connection strings are valid
3. Check Application Insights for error messages

### Cosmos DB connection issues
1. Verify firewall rules allow Azure services
2. Check connection string is correct
3. Ensure database and container exist

### Event Grid publishing fails
1. Verify Event Grid topic endpoint is correct
2. Check access key is valid
3. Ensure Event Grid topic exists

## Security Best Practices

1. **Never commit `.env.*` files to git** - Already configured in `.gitignore`
2. **Rotate keys regularly** - Use Azure Key Vault for production secrets
3. **Use Managed Identity** - Consider enabling for Function Apps
4. **Monitor access logs** - Review Application Insights regularly

## CI/CD Integration (Future)

Consider setting up Azure DevOps or GitHub Actions for automated deployments:

1. Build on commit to main branch
2. Deploy to Test environment automatically
3. Manual approval for Production deployment
4. Automated testing before deployment

## Resource Cleanup

To remove all resources from an environment:

```bash
# BE CAREFUL - This deletes everything!
az group delete --name devicereservation-dev-Ab07-rg --yes
az group delete --name devicereservation-test-Ab07-rg --yes
az group delete --name devicereservation-prod-Ab07-rg --yes
```
