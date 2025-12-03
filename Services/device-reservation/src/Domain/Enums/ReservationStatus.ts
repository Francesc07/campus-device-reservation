export enum ReservationStatus {
  Pending = "Pending",          // Created and waiting for fulfillment
  Confirmed = "Confirmed",      // Device available and reserved
  Cancelled = "Cancelled",      // Student cancelled
  Collected = "Collected",      // Staff confirmation
  Returned = "Returned"         // Staff confirmation
}
