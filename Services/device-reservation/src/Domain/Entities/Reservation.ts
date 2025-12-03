import { ReservationStatus } from "../Enums/ReservationStatus";

export interface Reservation {
  id: string;            // UUID
  userId: string;
  deviceId: string;

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
