export interface ReservationConfirmedEvent {
  eventType: "Reservation.Confirmed";
  reservationId: string;
  userId: string;
  deviceId: string;

  startDate: string;
  dueDate: string;

  timestamp: string;
}
