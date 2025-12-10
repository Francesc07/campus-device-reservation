import { LoanCancelledHandler } from "./LoanCancelledHandler";
import { CancelReservationUseCase } from "../UseCases/CancelReservationUseCase";
import { LoanCancelledEvent } from "../../Domain/Events/LoanCancelledEvent";
import { InvocationContext } from "@azure/functions";

/**
 * Idempotency Tests for LoanCancelledHandler
 * Validates that duplicate cancellation events can be safely replayed
 */
describe("LoanCancelledHandler - Idempotency Tests", () => {
  let mockCancelUseCase: jest.Mocked<CancelReservationUseCase>;
  let handler: LoanCancelledHandler;
  let mockContext: InvocationContext;

  beforeEach(() => {
    mockCancelUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as any;

    handler = new LoanCancelledHandler(mockCancelUseCase);

    mockContext = {
      log: jest.fn(),
      error: jest.fn(),
    } as any;
  });

  it("should handle duplicate Loan.Cancelled event idempotently", async () => {
    const event: LoanCancelledEvent = {
      eventType: "Loan.Cancelled",
      reservationId: "res-dup-123",
      userId: "user-456",
      deviceId: "device-789",
      reason: "Test cancellation",
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    // First call
    await handler.handle(event, mockContext);
    expect(mockCancelUseCase.execute).toHaveBeenCalledTimes(1);

    // Second call - should be idempotent
    await handler.handle(event, mockContext);
    expect(mockCancelUseCase.execute).toHaveBeenCalledTimes(2);

    // Third call
    await handler.handle(event, mockContext);
    expect(mockCancelUseCase.execute).toHaveBeenCalledTimes(3);

    // Verify all calls were identical
    const calls = mockCancelUseCase.execute.mock.calls;
    expect(calls[0][0]).toBe("res-dup-123");
    expect(calls[1][0]).toBe("res-dup-123");
    expect(calls[2][0]).toBe("res-dup-123");
  });

  it("should handle replay of cancellation events after delay", async () => {
    const event: LoanCancelledEvent = {
      eventType: "Loan.Cancelled",
      reservationId: "res-replay-456",
      userId: "user-789",
      deviceId: "device-012",
      reason: "Delayed replay",
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    // Initial processing
    await handler.handle(event, mockContext);
    
    // Simulate time passing (Event Grid retry after failure)
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Replay
    await handler.handle(event, mockContext);
    
    // Both should succeed with same parameters
    expect(mockCancelUseCase.execute).toHaveBeenCalledTimes(2);
    expect(mockCancelUseCase.execute).toHaveBeenNthCalledWith(
      1,
      "res-replay-456",
      "user-789",
      "Delayed replay",
      expect.anything()
    );
    expect(mockCancelUseCase.execute).toHaveBeenNthCalledWith(
      2,
      "res-replay-456",
      "user-789",
      "Delayed replay",
      expect.anything()
    );
  });

  it("should preserve idempotency even with different timestamps", async () => {
    const baseEvent = {
      eventType: "Loan.Cancelled" as const,
      reservationId: "res-same-id-789",
      userId: "user-123",
      deviceId: "device-456",
      reason: "Same cancellation",
    };

    // Event 1 with timestamp T1
    const event1: LoanCancelledEvent = {
      ...baseEvent,
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    // Event 2 with timestamp T2 (retry with new timestamp)
    const event2: LoanCancelledEvent = {
      ...baseEvent,
      timestamp: "2025-12-01T10:00:05.000Z",
    };

    await handler.handle(event1, mockContext);
    await handler.handle(event2, mockContext);

    // Both should be processed (use case handles idempotency by checking if already cancelled)
    expect(mockCancelUseCase.execute).toHaveBeenCalledTimes(2);
    
    // Both calls should have same reservation/user/device/reason
    const [call1, call2] = mockCancelUseCase.execute.mock.calls;
    expect(call1[0]).toBe(call2[0]); // reservationId
    expect(call1[1]).toBe(call2[1]); // userId
    expect(call1[2]).toBe(call2[2]); // reason
  });

  it("should handle multiple replays without error accumulation", async () => {
    const event: LoanCancelledEvent = {
      eventType: "Loan.Cancelled",
      reservationId: "res-multi-replay",
      userId: "user-999",
      deviceId: "device-888",
      reason: "Multiple replays",
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    // Process same event 10 times (simulating Event Grid retries)
    for (let i = 0; i < 10; i++) {
      await handler.handle(event, mockContext);
    }

    // All should succeed
    expect(mockCancelUseCase.execute).toHaveBeenCalledTimes(10);
    
    // No errors should be logged
    expect(mockContext.error).not.toHaveBeenCalled();
  });

  it("should maintain idempotency across different reasons (edge case)", async () => {
    // This tests an edge case where same reservation is cancelled with different reasons
    const event1: LoanCancelledEvent = {
      eventType: "Loan.Cancelled",
      reservationId: "res-same-123",
      userId: "user-456",
      deviceId: "device-789",
      reason: "Original reason",
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    const event2: LoanCancelledEvent = {
      eventType: "Loan.Cancelled",
      reservationId: "res-same-123",
      userId: "user-456",
      deviceId: "device-789",
      reason: "Different reason",  // Different reason
      timestamp: "2025-12-01T10:00:05.000Z",
    };

    await handler.handle(event1, mockContext);
    await handler.handle(event2, mockContext);

    // Both should be processed (UseCase will handle if already cancelled)
    expect(mockCancelUseCase.execute).toHaveBeenCalledTimes(2);
    
    // First call has original reason
    expect(mockCancelUseCase.execute).toHaveBeenNthCalledWith(
      1,
      "res-same-123",
      "user-456",
      "Original reason",
      expect.anything()
    );
    
    // Second call has different reason (UseCase should handle gracefully)
    expect(mockCancelUseCase.execute).toHaveBeenNthCalledWith(
      2,
      "res-same-123",
      "user-456",
      "Different reason",
      expect.anything()
    );
  });
});
