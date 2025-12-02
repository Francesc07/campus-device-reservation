export interface ReservationCancelledEvent {
  eventType: "Reservation.Cancelled";
  reservationId: string;
  userId: string;
  deviceId: string;

  reason?: string;
  timestamp: string;
}

