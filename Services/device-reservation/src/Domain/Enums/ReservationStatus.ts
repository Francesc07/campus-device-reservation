export enum ReservationStatus {
  Pending = "Pending",         // Created by student
  Confirmed = "Confirmed",     // Device available and reserved
  Cancelled = "Cancelled",     // Student cancelled
  Collected = "Collected",     // Staff confirmation
  Returned = "Returned"        // Staff confirmation
}
