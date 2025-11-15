// src/Domain/Reservation.ts

// Overall reservation lifecycle for the system.
export enum ReservationStatus {
  Pending = "Pending",       // Created by student, waiting for collection
  Collected = "Collected",   // Marked by staff as collected
  Returned = "Returned",     // Marked by staff as returned
  Cancelled = "Cancelled",   // Cancelled by student (or system)
  Expired = "Expired"        // Auto-expired if never collected (future)
}

// Standard loan duration (2 days) for all reservations.
export const STANDARD_LOAN_DAYS = 2;

// Core domain entity for reservations.
// This is the source of truth for the state of any loan in the system.
export interface Reservation {
  id: string;                 // UUID
  userId: string;             // Student ID (from Auth0 / AAD / etc.)
  deviceId: string;           // Device instance ID (from Device Catalog)
  // Optionally: if you later track model-level info, you can add:
  // deviceModelId?: string;

  startDate: string;          // ISO 8601 string
  dueDate: string;            // ISO 8601 string

  status: ReservationStatus;

  createdAt: string;          // ISO 8601
  updatedAt: string;          // ISO 8601

  // Optional notes (e.g., accessibility needs, special handling)
  notes?: string;
}
