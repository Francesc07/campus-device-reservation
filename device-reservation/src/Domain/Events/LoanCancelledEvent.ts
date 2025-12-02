export interface LoanCancelledEvent {
  eventType: "Loan.Cancelled";
  reservationId: string;
  userId: string;
  deviceId: string;

  reason?: string;
  timestamp: string;
}
