import { LoanCancelledHandler } from "./LoanCancelledHandler";
import { CancelReservationUseCase } from "../UseCases/CancelReservationUseCase";
import { LoanCancelledEvent } from "../../Domain/Events/LoanCancelledEvent";
import { InvocationContext } from "@azure/functions";

describe("LoanCancelledHandler", () => {
  let mockCancelUseCase: jest.Mocked<CancelReservationUseCase>;
  let handler: LoanCancelledHandler;
  let mockContext: InvocationContext;

  beforeEach(() => {
    mockCancelUseCase = {
      execute: jest.fn(),
    } as any;

    handler = new LoanCancelledHandler(mockCancelUseCase);

    mockContext = {
      log: jest.fn(),
    } as any;
  });

  it("should handle Loan.Cancelled event", async () => {
    const event: LoanCancelledEvent = {
      eventType: "Loan.Cancelled",
      reservationId: "res-123",
      userId: "user-456",
      deviceId: "device-789",
      reason: "Device no longer available",
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    await handler.handle(event, mockContext);

    expect(mockCancelUseCase.execute).toHaveBeenCalledWith(
      "res-123",
      "user-456",
      "Device no longer available",
      mockContext
    );
  });

  it("should handle cancellation without reason", async () => {
    const event: LoanCancelledEvent = {
      eventType: "Loan.Cancelled",
      reservationId: "res-123",
      userId: "user-456",
      deviceId: "device-789",
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    await handler.handle(event, mockContext);

    expect(mockCancelUseCase.execute).toHaveBeenCalledWith(
      "res-123",
      "user-456",
      undefined,
      mockContext
    );
  });

  it("should log the event processing", async () => {
    const event: LoanCancelledEvent = {
      eventType: "Loan.Cancelled",
      reservationId: "res-123",
      userId: "user-456",
      deviceId: "device-789",
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    await handler.handle(event, mockContext);

    expect(mockContext.log).toHaveBeenCalledWith(
      "📩 Processing Loan.Cancelled event",
      event
    );
    expect(mockContext.log).toHaveBeenCalledWith(
      "✅ Reservation cancelled successfully: res-123"
    );
  });
});
