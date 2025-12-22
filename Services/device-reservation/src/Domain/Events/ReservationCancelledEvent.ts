export interface ReservationCancelledEvent {
  eventType: "Reservation.Cancelled";
  reservationId: string;
  userId: string;
  deviceId: string;

  // Metadata for downstream services
  deviceBrand?: string;
  deviceModel?: string;
  userEmail?: string;

  reason?: string;
  timestamp: string;
}

