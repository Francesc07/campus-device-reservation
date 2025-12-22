export interface LoanCancelledEvent {
  eventType: "Loan.Cancelled";
  reservationId: string;
  userId: string;
  deviceId: string;

  // Metadata from Loan Service
  deviceBrand?: string;
  deviceModel?: string;
  userEmail?: string;

  reason?: string;
  timestamp: string;
}
