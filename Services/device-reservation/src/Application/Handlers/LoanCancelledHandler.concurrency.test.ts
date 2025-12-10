import { LoanCancelledHandler } from "./LoanCancelledHandler";
import { CancelReservationUseCase } from "../UseCases/CancelReservationUseCase";
import { LoanCancelledEvent } from "../../Domain/Events/LoanCancelledEvent";
import { InvocationContext } from "@azure/functions";

/**
 * Concurrency Tests for LoanCancelledHandler
 * Validates concurrent cancellation requests and race conditions
 */
describe("LoanCancelledHandler - Concurrency Tests", () => {
  let mockCancelUseCase: jest.Mocked<CancelReservationUseCase>;
  let handler: LoanCancelledHandler;

  beforeEach(() => {
    mockCancelUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as any;

    handler = new LoanCancelledHandler(mockCancelUseCase);
  });

  const createMockContext = (): InvocationContext => ({
    log: jest.fn(),
    error: jest.fn(),
  } as any);

  it("should handle multiple different cancellation events concurrently", async () => {
    const events: LoanCancelledEvent[] = [
      {
        eventType: "Loan.Cancelled",
        reservationId: "res-cancel-1",
        userId: "user-1",
        deviceId: "device-1",
        reason: "Device damaged",
        timestamp: "2025-12-01T10:00:00.000Z",
      },
      {
        eventType: "Loan.Cancelled",
        reservationId: "res-cancel-2",
        userId: "user-2",
        deviceId: "device-2",
        reason: "User request",
        timestamp: "2025-12-01T10:00:01.000Z",
      },
      {
        eventType: "Loan.Cancelled",
        reservationId: "res-cancel-3",
        userId: "user-3",
        deviceId: "device-3",
        timestamp: "2025-12-01T10:00:02.000Z",
      },
    ];

    // Process all events concurrently
    const promises = events.map(event => handler.handle(event, createMockContext()));
    await Promise.all(promises);

    // All should succeed
    expect(mockCancelUseCase.execute).toHaveBeenCalledTimes(3);

    // Verify each cancellation was called with correct parameters
    expect(mockCancelUseCase.execute).toHaveBeenCalledWith(
      "res-cancel-1",
      "user-1",
      "Device damaged",
      expect.anything()
    );
    expect(mockCancelUseCase.execute).toHaveBeenCalledWith(
      "res-cancel-2",
      "user-2",
      "User request",
      expect.anything()
    );
    expect(mockCancelUseCase.execute).toHaveBeenCalledWith(
      "res-cancel-3",
      "user-3",
      undefined,
      expect.anything()
    );
  });

  it("should handle same cancellation event arriving multiple times concurrently", async () => {
    const event: LoanCancelledEvent = {
      eventType: "Loan.Cancelled",
      reservationId: "res-duplicate-cancel",
      userId: "user-456",
      deviceId: "device-789",
      reason: "Duplicate cancellation test",
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    // Simulate duplicate event delivery
    const [result1, result2, result3] = await Promise.allSettled([
      handler.handle(event, createMockContext()),
      handler.handle(event, createMockContext()),
      handler.handle(event, createMockContext()),
    ]);

    // All should succeed (idempotency should handle duplicates)
    expect(result1.status).toBe("fulfilled");
    expect(result2.status).toBe("fulfilled");
    expect(result3.status).toBe("fulfilled");

    // UseCase should be called for each (it handles idempotency internally)
    expect(mockCancelUseCase.execute).toHaveBeenCalledTimes(3);
  });

  it("should handle high concurrency with 20 simultaneous cancellations", async () => {
    const events: LoanCancelledEvent[] = Array.from({ length: 20 }, (_, i) => ({
      eventType: "Loan.Cancelled" as const,
      reservationId: `res-bulk-cancel-${i}`,
      userId: `user-${i}`,
      deviceId: `device-${i}`,
      reason: `Bulk cancellation ${i}`,
      timestamp: `2025-12-01T10:00:${String(i).padStart(2, '0')}.000Z`,
    }));

    const promises = events.map(event => handler.handle(event, createMockContext()));
    const results = await Promise.allSettled(promises);

    // All should succeed
    results.forEach((result, i) => {
      expect(result.status).toBe("fulfilled");
    });

    expect(mockCancelUseCase.execute).toHaveBeenCalledTimes(20);
  });

  it("should handle partial failures in concurrent cancellations gracefully", async () => {
    let callCount = 0;
    mockCancelUseCase.execute = jest.fn().mockImplementation(async () => {
      callCount++;
      // Simulate failure on every 3rd call
      if (callCount % 3 === 0) {
        throw new Error("Simulated cancellation failure");
      }
    });

    const events: LoanCancelledEvent[] = Array.from({ length: 9 }, (_, i) => ({
      eventType: "Loan.Cancelled" as const,
      reservationId: `res-partial-${i}`,
      userId: `user-${i}`,
      deviceId: `device-${i}`,
      timestamp: `2025-12-01T10:00:${String(i).padStart(2, '0')}.000Z`,
    }));

    const results = await Promise.allSettled(
      events.map(event => handler.handle(event, createMockContext()))
    );

    // Should have 6 successes and 3 failures
    const successes = results.filter(r => r.status === "fulfilled");
    const failures = results.filter(r => r.status === "rejected");

    expect(successes.length).toBe(6);
    expect(failures.length).toBe(3);
  });

  it("should maintain isolation between concurrent cancellations", async () => {
    const executionOrder: string[] = [];
    
    mockCancelUseCase.execute = jest.fn().mockImplementation(async (reservationId: string) => {
      executionOrder.push(`start-${reservationId}`);
      // Simulate async work
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
      executionOrder.push(`end-${reservationId}`);
    });

    const events: LoanCancelledEvent[] = [
      {
        eventType: "Loan.Cancelled",
        reservationId: "res-A",
        userId: "user-A",
        deviceId: "device-A",
        timestamp: "2025-12-01T10:00:00.000Z",
      },
      {
        eventType: "Loan.Cancelled",
        reservationId: "res-B",
        userId: "user-B",
        deviceId: "device-B",
        timestamp: "2025-12-01T10:00:01.000Z",
      },
    ];

    await Promise.all(events.map(event => handler.handle(event, createMockContext())));

    // Verify both started and ended
    expect(executionOrder).toContain("start-res-A");
    expect(executionOrder).toContain("end-res-A");
    expect(executionOrder).toContain("start-res-B");
    expect(executionOrder).toContain("end-res-B");
  });
});
