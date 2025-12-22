export interface ReservationConfirmedEvent {
  eventType: "Reservation.Confirmed";
  reservationId: string;
  userId: string;
  deviceId: string;

  // Metadata for downstream services
  deviceBrand?: string;       // Device brand (e.g., "Apple")
  deviceModel?: string;       // Device model (e.g., "MacBook Pro")
  userEmail?: string;         // User's email address

  startDate: string;
  dueDate: string;

  timestamp: string;
}
