# Reservation Service - Event Architecture Validation

## ✅ Current Implementation vs Requirements

### Events SUBSCRIBED (Inbound):
| Event | From Service | Current Handler | Status |
|-------|-------------|-----------------|--------|
| Device.Snapshot | Device Catalog | `on-device-snapshot.ts` | ✅ Implemented (placeholder) |
| Device.Deleted | Device Catalog | `on-device-snapshot.ts` | ✅ Implemented (placeholder) |
| Loan.Created | Loan Service | `on-loan-events.ts` | ✅ Creates reservation |
| Loan.Cancelled | Loan Service | `on-loan-events.ts` | ✅ Cancels reservation |
| Staff.CollectionConfirmed | Staff Service | `on-staff-events.ts` | ✅ Marks as Collected |
| Staff.ReturnConfirmed | Staff Service | `on-staff-events.ts` | ✅ Marks as Returned |

### Events PUBLISHED (Outbound):
| Event | Trigger | Published From | Status |
|-------|---------|----------------|--------|
| Reservation.Confirmed | Student creates reservation | `CreateReservationUseCase` | ✅ Published |
| Reservation.Cancelled | Student cancels reservation | `CancelReservationUseCase` | ✅ Published |
| Reservation.Collected | Staff confirms collection | `MarkReservationCollectedUseCase` | ✅ Published |
| Reservation.Returned | Staff confirms return | `MarkReservationReturnedUseCase` | ✅ Published |

### HTTP Endpoints (Student-Facing):
| Method | Route | Handler | Purpose |
|--------|-------|---------|---------|
| POST | /api/reservations | `create-reservation-http.ts` | Create reservation |
| POST | /api/reservations/cancel | `cancel-reservation-http.ts` | Cancel reservation |
| GET | /api/reservations | `list-reservations-http.ts` | List all reservations (filtered by userId) |
| GET | /api/reservations/my | `get-my-reservations-http.ts` | Get user's reservations |

### Event Webhook Endpoints:
| Method | Route | Handler | Receives From |
|--------|-------|---------|---------------|
| POST | /api/events/catalog | `on-device-snapshot.ts` | Device Catalog Service |
| POST | /api/events/loan | `on-loan-events.ts` | Loan Service |
| POST | /api/events/staff | `on-staff-events.ts` | Staff Service |

## ⚠️ Architecture Review Notes

### ISSUE IDENTIFIED:
According to the requirements, **Reservation Service** should:
- Be controlled by **Students**
- Publish: `Reservation.Confirmed`, `Reservation.Cancelled`
- Subscribe to: `Loan.Created`, `Loan.Cancelled`

### CURRENT IMPLEMENTATION ISSUE:
The current flow is **BACKWARDS**:
- `on-loan-events.ts` receives `Loan.Created` and creates a reservation
- This means **Loan Service creates Reservations**, not students

### CORRECT FLOW SHOULD BE:
1. **Student** creates reservation via HTTP → `POST /api/reservations`
2. **Reservation Service** publishes `Reservation.Confirmed`
3. **Loan Service** subscribes to `Reservation.Confirmed` and creates a Loan

## 📋 Recommended Changes

### 1. Remove Auto-Creation from Loan Events
The `Loan.Created` event should NOT create a reservation. Instead:
- Reservations are created by students via HTTP POST
- Loan Service listens to `Reservation.Confirmed` and creates loans

### 2. Update Event Flow
**Current (WRONG)**:
```
Loan.Created → Reservation Service → Creates Reservation
```

**Correct**:
```
Student → POST /reservations → Reservation.Confirmed → Loan Service
```

### 3. What Loan Events SHOULD Do
- `Loan.Created`: Update reservation status to "Active" or link loanId
- `Loan.Cancelled`: Mark reservation as cancelled/freed

## 🔧 Code Changes Needed

1. **Modify `on-loan-events.ts`**:
   - Remove the `createReservationHandler.execute()` call
   - Instead, update existing reservation status or link loanId

2. **Keep HTTP endpoints as primary entry point**:
   - Students create reservations via `POST /api/reservations`
   - This publishes `Reservation.Confirmed`

## ✅ What's Already Correct

1. ✅ Event Grid Publisher configured
2. ✅ Device.Snapshot and Device.Deleted handlers (for caching device availability)
3. ✅ Staff events correctly mark Collection/Return
4. ✅ Student HTTP endpoints for creating/canceling reservations
5. ✅ Cosmos DB repository with proper CRUD operations
