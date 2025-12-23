import { ReservationStatus } from "../Enums/ReservationStatus";

/**
 * Reservation Entity
 * 
 * Represents a device reservation in the system. Each reservation is created
 * when a loan is initiated and tracks the lifecycle of the device assignment.
 * 
 * **Key Design Decisions:**
 * - Uses loan ID as reservation ID for idempotency (prevents duplicate reservations)
 * - Includes device metadata for quick access without additional queries
 * - Status transitions: Pending → Confirmed → Completed or Cancelled
 * 
 * @example
 * ```typescript
 * const reservation: Reservation = {
 *   id: "loan-123",
 *   userId: "user-456",
 *   deviceId: "device-789",
 *   deviceBrand: "Apple",
 *   deviceModel: "MacBook Pro",
 *   userEmail: "user@example.com",
 *   startDate: "2025-12-23T10:00:00Z",
 *   dueDate: "2025-12-30T10:00:00Z",
 *   status: ReservationStatus.Pending,
 *   createdAt: "2025-12-23T10:00:00Z",
 *   updatedAt: "2025-12-23T10:00:00Z"
 * };
 * ```
 */
export interface Reservation {
  /** Unique identifier (same as loan ID for idempotency) */
  id: string;

  /** User who reserved the device */
  userId: string;

  /** Device being reserved */
  deviceId: string;

  /** Device brand (e.g., "Apple", "Dell") - denormalized for performance */
  deviceBrand?: string;

  /** Device model (e.g., "MacBook Pro", "XPS 15") - denormalized for performance */
  deviceModel?: string;

  /** User's email address - denormalized for notifications */
  userEmail?: string;

  /** ISO 8601 timestamp when the reservation begins */
  startDate: string;

  /** ISO 8601 timestamp when device should be returned (calculated from business rules) */
  dueDate: string;

  /** Current status of the reservation */
  status: ReservationStatus;

  /** ISO 8601 timestamp when reservation was created */
  createdAt: string;

  /** ISO 8601 timestamp when reservation was last updated */
  updatedAt: string;

  /** ISO 8601 timestamp when reservation was confirmed (Reservation.Confirmed event sent) */
  confirmedAt?: string;

  /** ISO 8601 timestamp when reservation was cancelled */
  cancelledAt?: string;

  /** ISO 8601 timestamp when device return was confirmed by staff */
  completedAt?: string;

  /** Optional notes or additional information */
  notes?: string;
}
