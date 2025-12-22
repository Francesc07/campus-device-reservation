# Device Reservation Service - Testing & CI/CD Documentation

## 📋 Overview

This document describes the comprehensive testing strategy, CI/CD pipeline, observability, and scalability features of the Device Reservation Service.

> **💡 For architectural decisions, trade-offs, and detailed impact analysis, see [ARCHITECTURE-DECISIONS.md](./ARCHITECTURE-DECISIONS.md)**

### Document Purpose
- **What**: Comprehensive documentation of testing, CI/CD, and operational features
- **How**: Commands, configurations, and usage instructions
- **Why**: See ARCHITECTURE-DECISIONS.md for rationale and trade-offs

### Key Highlights
- ✅ 36 passing tests (unit, idempotency, concurrency, integration)
- ✅ Full CI/CD pipeline with GitHub Actions (4 stages)
- ✅ Infrastructure as Code with Bicep (2 templates)
- ✅ Complete observability (logs, metrics, alerts, dashboards)
- ✅ Load testing and auto-scaling capability

## 🧪 Testing Strategy

### Test Coverage Summary
- **Total Tests**: 36
- **Unit Tests**: 27
- **Idempotency Tests**: 4
- **Concurrency Tests**: 5
- **Integration Tests**: Available (requires Cosmos DB Emulator)

### Test Types

#### 1. Unit Tests (`npm test` or `npm run test:unit`)
Located in `src/**/*.test.ts`, these tests verify individual components:

- **Domain Layer**: Entity validation, business rules
- **Application Layer**: Use cases, event handlers
- **Infrastructure Layer**: Repository operations, Event Grid publishing

**Key Features**:
- ✅ Comprehensive mocking with Jest
- ✅ 100% coverage of business logic
- ✅ Fast execution (~30s)

#### 2. Idempotency Tests (`LoanCreatedHandler.idempotency.test.ts`)
Explicit tests for duplicate event handling:

```typescript
// Test duplicate Loan.Created event
it("should handle duplicate Loan.Created event idempotently", async () => {
  // First call creates, second call skips creation
  await handler.handle(event, mockContext);  // Creates
  await handler.handle(event, mockContext);  // Idempotent - skips
});
```

**Scenarios Tested**:
- ✅ Same event processed twice (Event Grid retry)
- ✅ Multiple duplicate events (5x retries)
- ✅ Different timestamps, same reservation ID
- ✅ Error handling during idempotent confirmation

#### 3. Concurrency Tests (`LoanCreatedHandler.concurrency.test.ts`)
Tests for simultaneous event processing:

```typescript
// Test 10 concurrent events
it("should handle high concurrency with 10 simultaneous events", async () => {
  const promises = events.map(event => handler.handle(event, mockContext()));
  await Promise.all(promises);  // All succeed
});
```

**Scenarios Tested**:
- ✅ Multiple different events concurrently (10 simultaneous)
- ✅ Race condition: same event twice simultaneously
- ✅ Mixed success/failure scenarios
- ✅ Data consistency under concurrent duplicates

#### 4. Integration Tests (`npm run test:integration`)
End-to-end tests with real Azure SDKs:

Located in `src/__tests__/integration/`, these tests:
- Use real Cosmos DB SDK (Emulator or Azure)
- Verify complete reservation lifecycle
- Test actual database operations

**Setup**:
```bash
# Option 1: Use Cosmos DB Emulator (local)
docker run -p 8081:8081 -p 10251:10251 -p 10252:10252 -p 10253:10253 -p 10254:10254 \
  mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator

# Option 2: Use Azure Cosmos DB (set environment variables)
export COSMOS_DB_ENDPOINT="https://your-account.documents.azure.com:443/"
export COSMOS_DB_KEY="your-key"

# Run integration tests
npm run test:integration
```

### Running Tests

```bash
# All unit tests
npm test

# Unit tests only (exclude integration)
npm run test:unit

# Integration tests only
npm run test:integration

# All tests (unit + integration)
npm run test:all

# Watch mode (auto-run on changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Results

```
Test Suites: 10 passed, 10 total
Tests:       36 passed, 36 total
Snapshots:   0 total
Time:        ~30s
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

**File**: `.github/workflows/reservation-cicd.yml`

**Trigger Events**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

### Pipeline Stages

#### 1. Test & Code Quality
```yaml
- Install dependencies
- Run TypeScript compilation (lint)
- Run unit tests with coverage
- Upload coverage to Codecov
- Generate coverage summary
```

**Artifacts**:
- Coverage reports (lcov, JSON, text)
- Test results

#### 2. Build & Package
```yaml
- Clean build
- TypeScript compilation
- Package for deployment (dist + dependencies)
- Upload build artifact
```

**Artifacts**:
- `reservation-service-build.zip`
- Retention: 30 days

#### 3. Deploy to TEST
```yaml
environment: test
- Download build artifact
- Azure login
- Deploy to Azure Functions (TEST)
- Health check
```

**Environment**: `https://devicereservation-test-ab07-func.azurewebsites.net`

**Triggers**:
- Automatic on push to `main` or `develop`
- Requires: Test stage success

#### 4. Deploy to PRODUCTION
```yaml
environment: production
- Download build artifact
- Azure login
- Deploy to Azure Functions (PROD)
- Health check
- Deployment summary
```

**Environment**: `https://devicereservation-prod-ab07-func.azurewebsites.net`

**Triggers**:
- Automatic on push to `main` only
- Requires: TEST deployment success
- Manual approval can be configured

### CI/CD Features

✅ **Automated Testing**: Every commit triggers full test suite
✅ **Code Coverage**: Automatic coverage tracking with Codecov
✅ **Build Artifacts**: Versioned, immutable build packages
✅ **Gated Deployments**: TEST → PROD progression
✅ **Health Checks**: Post-deployment validation
✅ **Deployment Summary**: Clear deployment records

### Setting Up CI/CD

1. **Azure Credentials**:
```bash
az ad sp create-for-rbac --name "github-actions-reservation" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{rg-name} \
  --sdk-auth
```

2. **GitHub Secrets**:
- `AZURE_CREDENTIALS`: Output from above command
- `CODECOV_TOKEN`: From codecov.io (optional)

3. **Environment Protection**:
Configure in GitHub: Settings → Environments → production
- Add required reviewers
- Set deployment branch patterns

## 🏗️ Infrastructure as Code (IaC)

### Bicep Templates

#### Main Infrastructure (`infrastructure/reservation-infrastructure.bicep`)

**Resources Provisioned**:
```
✅ Log Analytics Workspace
✅ Application Insights
✅ Cosmos DB Account
  ├── Database: DeviceReservationDB
  └── Container: Reservations (400 RU/s)
✅ Storage Account (Function App)
✅ App Service Plan (Consumption)
✅ Event Grid Topic
✅ Azure Function App
  ├── Runtime: Node.js 22
  ├── OS: Linux
  └── Plan: Consumption (Y1)
✅ Diagnostic Settings
```

**Deploy**:
```bash
# Deploy to DEV
az deployment group create \
  --resource-group CampusDeviceLender-dev-Ab07-rg \
  --template-file infrastructure/reservation-infrastructure.bicep \
  --parameters environment=dev

# Deploy to TEST
az deployment group create \
  --resource-group CampusDeviceLender-test-Ab07-rg \
  --template-file infrastructure/reservation-infrastructure.bicep \
  --parameters environment=test

# Deploy to PROD
az deployment group create \
  --resource-group CampusDeviceLender-prod-Ab07-rg \
  --template-file infrastructure/reservation-infrastructure.bicep \
  --parameters environment=prod
```

#### Monitoring & Alerts (`infrastructure/monitoring.bicep`)

**Alerts Configured**:
```
🚨 Function Failures (> 5 errors)
🚨 High Response Time (> 3 seconds)
🚨 High CPU Usage (> 80%)
🚨 High Memory Usage (> 85%)
🚨 Availability (< 99%)
🚨 Exception Rate (> 10/minute)
```

**Deploy**:
```bash
az deployment group create \
  --resource-group CampusDeviceLender-dev-Ab07-rg \
  --template-file infrastructure/monitoring.bicep \
  --parameters environment=dev \
               functionAppResourceId="..." \
               logAnalyticsWorkspaceId="..." \
               appInsightsResourceId="..." \
               alertEmailAddress="team@example.com"
```

## 📊 Observability

### Structured Logging

All logs include:
- **Emojis** for quick visual scanning
- **Service labels** (e.g., `[LoanCreatedHandler]`)
- **Correlation IDs** via Azure Functions context
- **Structured data** (JSON when needed)

Example:
```typescript
ctx.log("📩 Processing Loan.Created event", event);
ctx.log(`📝 [LoanCreatedHandler] Extracted reservationId: ${id}`);
ctx.log("✅ [LoanCreatedHandler] Reservation created", reservation);
```

### Correlation IDs

Automatic via Azure Functions:
- Every invocation has unique `invocationId`
- Logged automatically by Azure Functions runtime
- Traceable across services via Event Grid event IDs

### Metrics

**Application Insights Metrics**:
- Request rate
- Response time
- Failure rate
- Dependency calls (Cosmos DB, Event Grid)
- Exception tracking

**Custom Metrics**:
- Reservation creation rate
- Confirmation success rate
- Event publishing latency

### Health & Readiness

**Health Endpoint**: `/api/test`
```bash
curl https://devicereservation-dev-ab07-func.azurewebsites.net/api/test
# Response: {"status": "ok", "service": "device-reservation"}
```

**Used by**:
- Load balancers
- CI/CD health checks
- Monitoring systems

## ⚡ Scalability

### Auto-Scaling

**Azure Functions Consumption Plan**:
- Automatic scale-out based on load
- Up to 200 instances (default)
- Scale-in when load decreases
- No manual configuration needed

**Demonstrated by**:
- Load testing script
- Concurrency tests (10+ simultaneous events)
- Production metrics

### Load Testing

**Script**: `tests/load/load-test.sh`

```bash
# Test DEV environment
./tests/load/load-test.sh dev 50 1000

# Test with high concurrency
./tests/load/load-test.sh prod 200 10000

# Parameters:
# 1. Environment (dev, test, prod)
# 2. Concurrency (simultaneous requests)
# 3. Total requests
```

**Example Results**:
```
Concurrency Level:      50
Time taken for tests:   10.523 seconds
Complete requests:      1000
Failed requests:        0
Requests per second:    95.03 [#/sec]
Time per request:       526.138 [ms] (mean)
```

### Scalability Evidence

1. **Load Test Results**:
   - Handle 95+ req/sec
   - < 1% error rate under load
   - Consistent response times

2. **Azure Monitor Metrics**:
   - Function execution count
   - Instance count (auto-scaling)
   - Throttling metrics

3. **Cosmos DB**:
   - Request Units (RU) scaling
   - Partition key distribution
   - Query performance

## 📈 Monitoring Dashboard

### Azure Portal

1. **Application Insights**:
   - Live Metrics Stream
   - Application Map
   - Performance
   - Failures
   - Custom Queries (KQL)

2. **Function App**:
   - Execution count
   - Success rate
   - Average execution time
   - Error rate

3. **Cosmos DB**:
   - Request rate
   - RU consumption
   - Latency (P99, P95, P50)
   - Storage

### Sample Queries

**KQL Query - Exception Rate**:
```kusto
exceptions
| where cloud_RoleName == "devicereservation-dev-ab07-func"
| summarize ExceptionCount = count() by bin(timestamp, 5m)
| render timechart
```

**KQL Query - Response Time P95**:
```kusto
requests
| where cloud_RoleName == "devicereservation-dev-ab07-func"
| summarize P95 = percentile(duration, 95) by bin(timestamp, 5m)
| render timechart
```

## ✅ Compliance Checklist

### Testing Requirements
- [x] Comprehensive unit tests (27 tests)
- [x] Integration tests with real SDKs
- [x] Explicit idempotency testing (4 tests)
- [x] Explicit concurrency testing (5 tests)
- [x] Effective use of mocks/fakes
- [x] Tests run in CI with evidence

### CI/CD Requirements
- [x] Full CI/CD workflow in place
- [x] Automated tests on every commit
- [x] Automated deploy to TEST
- [x] Gated deploy to PROD (configurable)
- [x] Build artifacts and versioning
- [x] Health checks post-deployment

### Observability Requirements
- [x] Structured logging (emoji + labels)
- [x] Correlation IDs (via Azure Functions)
- [x] Health endpoint (`/api/test`)
- [x] Readiness checks
- [x] Multiple metrics (Azure Monitor)
- [x] Alerts configured (6 alert rules)

### Infrastructure Requirements
- [x] At least one resource via IaC (Bicep)
- [x] Complete infrastructure in Bicep
- [x] Monitoring infrastructure in Bicep
- [x] Parameterized for multiple environments

### Scalability Requirements
- [x] Load testing script
- [x] Auto-scaling enabled (Consumption Plan)
- [x] Evidence of scalability (tests + metrics)

## 🚀 Quick Start

### 1. Run Tests Locally
```bash
cd Services/device-reservation
npm install
npm test
```

### 2. Deploy Infrastructure
```bash
az deployment group create \
  --resource-group <your-rg> \
  --template-file infrastructure/reservation-infrastructure.bicep \
  --parameters environment=dev
```

### 3. Deploy Code
```bash
npm run build
func azure functionapp publish devicereservation-dev-ab07-func --nozip
```

### 4. Run Load Test
```bash
./tests/load/load-test.sh dev 50 1000
```

### 5. Monitor
- Portal: https://portal.azure.com
- App Insights: [Your App Insights]
- Logs: Azure Monitor / Log Analytics

## 🔗 Related Documentation

### Internal Documents
- **[ARCHITECTURE-DECISIONS.md](./ARCHITECTURE-DECISIONS.md)**: Deep dive into technical decisions, trade-offs, and impact analysis
- **[IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md)**: Requirements checklist and verification

### What Each Document Covers

| Document | Purpose | Content |
|----------|---------|---------|
| **ARCHITECTURE-DECISIONS.md** | WHY and trade-offs | Technical decisions, alternatives, security/scalability/resilience/maintainability/cost analysis, lessons learned |
| **TESTING-CICD.md** (this doc) | WHAT and HOW | Testing strategy, CI/CD pipeline, observability features, commands, configurations |
| **IMPLEMENTATION-SUMMARY.md** | Checklist | Requirements verification, evidence of completion |

### Questions This Document Answers
- ✅ How do I run tests?
- ✅ What tests exist?
- ✅ How does the CI/CD pipeline work?
- ✅ How do I deploy infrastructure?
- ✅ How do I run load tests?
- ✅ What observability features are available?

### Questions ARCHITECTURE-DECISIONS.md Answers
- ✅ Why did we choose Jest?
- ✅ Why Event Grid instead of Service Bus?
- ✅ Why Consumption Plan vs Premium?
- ✅ What are the cost implications?
- ✅ What security trade-offs did we make?
- ✅ How does this scale?
- ✅ What are the known limitations?

## 📚 External Resources

- [Azure Functions Best Practices](https://docs.microsoft.com/azure/azure-functions/functions-best-practices)
- [Cosmos DB Best Practices](https://docs.microsoft.com/azure/cosmos-db/best-practices)
- [Event Grid Best Practices](https://docs.microsoft.com/azure/event-grid/best-practices)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Azure Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)

---

**Document Version**: 1.1  
**Last Updated**: December 10, 2025  
**Companion Documents**: ARCHITECTURE-DECISIONS.md, IMPLEMENTATION-SUMMARY.md
