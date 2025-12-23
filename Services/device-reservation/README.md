# Device Reservation Service

> **Event-driven microservice** for managing device reservations in response to loan creation/cancellation events.

## 📋 Overview

The Device Reservation Service automatically creates and manages device reservations when loans are created or cancelled. It follows clean architecture principles with comprehensive testing, automated CI/CD, and production-ready observability.

### Key Features

- ✅ **Event-Driven Architecture** - Subscribes to loan events via Azure Event Grid
- ✅ **Clean Architecture** - Domain-driven design with clear separation of concerns
- ✅ **Idempotent Processing** - Handles duplicate events gracefully
- ✅ **Concurrency Safe** - Thread-safe operations for simultaneous events
- ✅ **Comprehensive Testing** - 80+ tests including unit, integration, idempotency, and concurrency
- ✅ **Auto-Scaling** - Azure Functions consumption plan with automatic scaling
- ✅ **CI/CD Pipeline** - Automated build, test, and deployment with GitHub Actions
- ✅ **Production Monitoring** - Application Insights integration with health checks

---

## 🏗️ Architecture

### System Design

```
┌─────────────────┐        ┌──────────────────┐        ┌────────────────────┐
│  Device Loan    │        │   Event Grid     │        │   Reservation      │
│    Service      │───────▶│  (Loan Events)   │───────▶│     Service        │
└─────────────────┘        └──────────────────┘        └────────────────────┘
                                                               │
                                                               ▼
                           ┌──────────────────┐        ┌────────────────────┐
                           │   Event Grid     │◀───────│   Cosmos DB        │
                           │ (Confirm Events) │        │  (Reservations)    │
                           └──────────────────┘        └────────────────────┘
                                   │
                                   ▼
                           ┌──────────────────┐
                           │  Confirmation    │
                           │     Service      │
                           └──────────────────┘
```

### Layer Architecture

```
src/
├── API/                        # HTTP endpoints (Azure Functions)
│   └── functions/
│       ├── health-http.ts      # Health check endpoint
│       ├── reservation-event-http.ts  # Event Grid webhook
│       └── shared/             # Shared utilities
├── Application/                # Use cases and handlers
│   ├── Handlers/               # Event handlers
│   ├── UseCases/               # Business operations
│   ├── Dtos/                   # Data transfer objects
│   └── Interfaces/             # Abstractions
├── Domain/                     # Business logic
│   ├── Entities/               # Core domain models
│   ├── Events/                 # Domain events
│   ├── Enums/                  # Status enums
│   └── Constants/              # Business rules
└── Infrastructure/             # External integrations
    ├── Persistence/            # Cosmos DB repository
    ├── EventGrid/              # Event publishing
    └── Config/                 # Environment configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 22.x or later
- **Azure Functions Core Tools** v4
- **Azure CLI** (for deployment)
- **Azure Subscription** with the following resources:
  - Azure Functions App
  - Azure Cosmos DB (SQL API)
  - Azure Event Grid Topics
  - Application Insights (optional)

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### Local Development

1. **Configure local settings**:
```bash
cp local.settings.json.template local.settings.json
```

2. **Update** `local.settings.json`:
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_DB_ENDPOINT": "https://your-cosmos.documents.azure.com:443/",
    "COSMOS_DB_KEY": "your-key-here",
    "COSMOS_DB_DATABASE": "DeviceReservationDB",
    "COSMOS_DB_CONTAINER": "Reservations",
    "EVENT_GRID_TOPIC_ENDPOINT": "https://your-topic.region.eventgrid.azure.net/api/events",
    "EVENT_GRID_TOPIC_KEY": "your-key-here"
  }
}
```

3. **Start the function app**:
```bash
npm start
```

4. **Test health endpoint**:
```bash
curl http://localhost:7071/api/health
```

---

## 🧪 Testing

### Test Suite Overview

| Category | Count | Purpose |
|----------|-------|---------|
| **Unit Tests** | 60+ | Business logic validation |
| **Integration Tests** | 5+ | Database operations |
| **Idempotency Tests** | 8+ | Duplicate event handling |
| **Concurrency Tests** | 10+ | Race condition prevention |
| **Coverage** | >80% | Code quality assurance |

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- Reservation.test

# Run integration tests (requires Cosmos DB)
npm run test:integration

# Watch mode for development
npm test -- --watch
```

### Test Categories

#### 1. Unit Tests
Tests individual components in isolation:
- Domain entities and business rules
- Use case logic
- Event handlers
- Repository implementations (mocked)

#### 2. Idempotency Tests
Ensures duplicate events are handled correctly:
- Same event processed multiple times
- Timestamp variations with same ID
- Event Grid retry scenarios
- No duplicate reservations created

#### 3. Concurrency Tests
Validates thread-safe operations:
- Multiple simultaneous events
- Race condition prevention
- Data consistency under load
- Partial failure handling

#### 4. Integration Tests
Tests real database operations:
- Full CRUD lifecycle
- Query operations
- Error scenarios
- Connection handling

---

## 📦 Deployment

### Automated CI/CD

The service uses GitHub Actions for automated deployment:

```
develop branch → auto-deploy to DEV & TEST
main branch    → manual approval → PROD
```

**Pipeline stages**:
1. 🧪 **Test Suite** - Run all tests with coverage
2. 🏗️ **Build** - Compile TypeScript and package
3. 🚀 **Deploy DEV** - Auto-deploy on develop push
4. 🚀 **Deploy TEST** - Auto-deploy on develop push
5. ✋ **Manual Approval** - Required for PROD
6. 🚀 **Deploy PROD** - Manual workflow dispatch

### Manual Deployment

```bash
# Login to Azure
az login

# Deploy to specific environment
func azure functionapp publish devicereservation-{env}-ab07-func --typescript

# Example: Deploy to dev
func azure functionapp publish devicereservation-dev-ab07-func --typescript
```

### Environment Setup

Use the provided scripts for initial setup:

```bash
# Setup Event Grid subscriptions
./setup-event-subscriptions.sh

# Populate local.settings.json from Azure
./populate-env.sh dev
```

---

## 📊 Monitoring & Observability

### Health Check

The service exposes a health check endpoint:

```bash
# Local
curl http://localhost:7071/api/health

# Deployed
curl https://devicereservation-{env}-ab07-func.azurewebsites.net/api/health
```

**Response**:
```json
{
  "status": "healthy",
  "service": "device-reservation",
  "timestamp": "2025-12-23T10:30:00.000Z",
  "version": "1.0.0"
}
```

### Application Insights

Monitor the service in Azure Portal:
- Request rates and response times
- Failure rates and exceptions
- Custom events and traces
- Dependency tracking (Cosmos DB, Event Grid)

### Key Metrics

- **Request Rate**: Events processed per minute
- **Success Rate**: Successful event handling percentage
- **Latency P95**: 95th percentile response time
- **Cosmos RU/s**: Database throughput consumption

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `COSMOS_DB_ENDPOINT` | Cosmos DB account endpoint | ✅ |
| `COSMOS_DB_KEY` | Cosmos DB access key | ✅ |
| `COSMOS_DB_DATABASE` | Database name | ✅ |
| `COSMOS_DB_CONTAINER` | Container name | ✅ |
| `EVENT_GRID_TOPIC_ENDPOINT` | Event Grid topic URL | ✅ |
| `EVENT_GRID_TOPIC_KEY` | Event Grid access key | ✅ |
| `APPINSIGHTS_INSTRUMENTATIONKEY` | Application Insights key | ⚠️ |

### Azure Resources Naming Convention

```
Environment: dev | test | prod

Cosmos DB:       devicereservation-{env}-ab07-cosmos
Function App:    devicereservation-{env}-ab07-func
Storage Account: deviceres{env}ab07sa
Event Topic:     deviceloan-{env}-ab07-topic (inbound)
Event Topic:     deviceconfirmation-{env}-ab07-topic (outbound)
Resource Group:  CampusDeviceLender-{env}-Ab07-rg
```

---

## 🏛️ Architecture Decisions

### 1. Clean Architecture with Hexagonal Pattern

**Decision**: Organize code into Domain, Application, and Infrastructure layers.

**Benefits**:
- ✅ High testability - each layer tested independently
- ✅ Maintainability - infrastructure changes don't affect business logic
- ✅ Clear boundaries - domain isolated from external concerns

**Trade-offs**:
- ⚠️ More files and interfaces
- ⚠️ Steeper learning curve
- ⚠️ Initial development slower

### 2. Event-Driven Architecture with Event Grid

**Decision**: Use Event Grid for inter-service communication.

**Benefits**:
- ✅ Loose coupling - services don't know each other's endpoints
- ✅ Automatic retries - up to 24 hours with exponential backoff
- ✅ High scalability - up to 10M events/second
- ✅ Fan-out pattern - one event, multiple subscribers

**Trade-offs**:
- ⚠️ Eventually consistent
- ⚠️ Debugging complexity
- ⚠️ Requires idempotency

### 3. Azure Cosmos DB (SQL API)

**Decision**: Use Cosmos DB for reservation storage.

**Benefits**:
- ✅ Global distribution
- ✅ Single-digit millisecond latency
- ✅ Automatic scaling
- ✅ 99.999% SLA

**Trade-offs**:
- ⚠️ Cost based on RU/s consumption
- ⚠️ Partition key design critical
- ⚠️ Query complexity considerations

### 4. Idempotency by Loan ID

**Decision**: Use loan ID as reservation ID to ensure idempotency.

**Benefits**:
- ✅ Simple duplicate detection
- ✅ No additional storage needed
- ✅ Prevents duplicate reservations
- ✅ Stateless operation

**Trade-offs**:
- ⚠️ Tight coupling to loan ID
- ⚠️ Cannot have multiple reservations per loan

---

## 📝 API Reference

### Event Grid Webhook

**Endpoint**: `POST /api/events/loan`

**Supported Event Types**:
- `Loan.Created` - Create a new reservation
- `Loan.Cancelled` - Cancel an existing reservation

**Event Schema**:
```json
{
  "id": "unique-event-id",
  "eventType": "Loan.Created",
  "subject": "loan/12345",
  "eventTime": "2025-12-23T10:30:00Z",
  "data": {
    "loanId": "12345",
    "deviceId": "device-abc-123",
    "borrowerId": "user-456",
    "startDate": "2025-12-23T10:00:00Z",
    "endDate": "2025-12-30T10:00:00Z",
    "metadata": {
      "source": "mobile-app",
      "version": "1.0"
    }
  }
}
```

**Response**: `200 OK` (Event Grid expects 2xx for successful delivery)

### Published Events

**Event Type**: `Reservation.Confirmed`

**Schema**:
```json
{
  "reservationId": "12345",
  "deviceId": "device-abc-123",
  "borrowerId": "user-456",
  "startDate": "2025-12-23T10:00:00Z",
  "endDate": "2025-12-30T10:00:00Z",
  "confirmedAt": "2025-12-23T10:30:00Z"
}
```

---

## 🤝 Contributing

### Code Style

- **Language**: TypeScript (strict mode)
- **Formatting**: Prettier with ESLint
- **Testing**: Jest with >80% coverage
- **Commits**: Conventional commits format

### Development Workflow

1. Create feature branch from `develop`
2. Write tests first (TDD approach)
3. Implement feature
4. Ensure tests pass and coverage maintained
5. Create pull request to `develop`
6. CI/CD runs automatically
7. After merge, auto-deploys to DEV and TEST

### Pull Request Checklist

- [ ] Tests added/updated
- [ ] Coverage >80%
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Documentation updated
- [ ] Changelog updated

---

## 📚 Additional Resources

### Related Services

- **Device Loan Service** - Creates and manages device loans
- **Device Confirmation Service** - Confirms and finalizes reservations
- **Device Inventory Service** - Manages device availability

### Documentation

- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)
- [Azure Event Grid Documentation](https://docs.microsoft.com/azure/event-grid/)
- [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
- [Clean Architecture Guide](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

### Support

For issues or questions:
- Open an issue in the repository
- Contact the platform team
- Check Azure Service Health

---

## 📄 License

Copyright © 2025 Campus Device Lender Platform. All rights reserved.

---

**Built with** ❤️ **using Azure Functions, TypeScript, and Clean Architecture principles**
