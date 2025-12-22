import { ReservationStatus } from "../Enums/ReservationStatus";

export interface Reservation {
  id: string;            // UUID
  userId: string;
  deviceId: string;

  // Metadata from Loan Service
  deviceBrand?: string;   // e.g., "Apple", "Dell"
  deviceModel?: string;   // e.g., "MacBook Pro", "XPS 15"
  userEmail?: string;     // User's email address

  startDate: string;     // When the reservation begins
  dueDate: string;       // Expected return (handled by business rules)

  status: ReservationStatus;

  createdAt: string;
  updatedAt: string;

  confirmedAt?: string;       // When Reservation.Confirmed fired
  cancelledAt?: string;       // When cancelled
  completedAt?: string;       // When Staff.ReturnConfirmed event arrives

  notes?: string;
}
