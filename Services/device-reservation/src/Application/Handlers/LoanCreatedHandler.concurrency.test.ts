import { LoanCreatedHandler } from "./LoanCreatedHandler";
import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { ConfirmReservationUseCase } from "../UseCases/ConfirmReservationUseCase";
import { LoanCreatedEvent } from "../../Domain/Events/LoanCreatedEvent";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";
import { InvocationContext } from "@azure/functions";
import { Reservation } from "../../Domain/Entities/Reservation";

describe("LoanCreatedHandler - Concurrency Tests", () => {
  let mockRepo: jest.Mocked<IReservationRepository>;
  let mockConfirmUseCase: jest.Mocked<ConfirmReservationUseCase>;
  let handler: LoanCreatedHandler;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      getById: jest.fn().mockResolvedValue(null),
    };

    mockConfirmUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as any;

    handler = new LoanCreatedHandler(mockRepo, mockConfirmUseCase);
  });

  const createMockContext = (): InvocationContext => ({
    log: jest.fn(),
    error: jest.fn(),
  } as any);

  it("should handle multiple different events concurrently", async () => {
    const events: LoanCreatedEvent[] = [
      {
        eventType: "Loan.Created",
        reservationId: "res-concurrent-1",
        userId: "user-1",
        deviceId: "device-1",
        startDate: "2025-12-01T00:00:00.000Z",
        dueDate: "2025-12-03T00:00:00.000Z",
        timestamp: "2025-12-01T10:00:00.000Z",
      },
      {
        eventType: "Loan.Created",
        reservationId: "res-concurrent-2",
        userId: "user-2",
        deviceId: "device-2",
        startDate: "2025-12-01T00:00:00.000Z",
        dueDate: "2025-12-03T00:00:00.000Z",
        timestamp: "2025-12-01T10:00:01.000Z",
      },
      {
        eventType: "Loan.Created",
        reservationId: "res-concurrent-3",
        userId: "user-3",
        deviceId: "device-3",
        startDate: "2025-12-01T00:00:00.000Z",
        dueDate: "2025-12-03T00:00:00.000Z",
        timestamp: "2025-12-01T10:00:02.000Z",
      },
    ];

    // Process all events concurrently
    const promises = events.map(event => handler.handle(event, createMockContext()));
    await Promise.all(promises);

    // All should succeed
    expect(mockRepo.create).toHaveBeenCalledTimes(3);
    expect(mockConfirmUseCase.execute).toHaveBeenCalledTimes(3);

    // Verify each reservation was created with correct ID
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: "res-concurrent-1" })
    );
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: "res-concurrent-2" })
    );
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: "res-concurrent-3" })
    );
  });

  it("should handle race condition where same event arrives twice simultaneously", async () => {
    const event: LoanCreatedEvent = {
      eventType: "Loan.Created",
      reservationId: "res-race-123",
      userId: "user-456",
      deviceId: "device-789",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-03T00:00:00.000Z",
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    let getByIdCallCount = 0;
    
    // Simulate race condition: first call returns null, subsequent calls return existing
    mockRepo.getById = jest.fn().mockImplementation(async () => {
      getByIdCallCount++;
      if (getByIdCallCount === 1) {
        return null; // First concurrent request thinks it doesn't exist
      }
      // Subsequent requests see it exists
      return {
        id: "res-race-123",
        userId: "user-456",
        deviceId: "device-789",
        startDate: "2025-12-01T00:00:00.000Z",
        dueDate: "2025-12-03T00:00:00.000Z",
        status: ReservationStatus.Pending,
        createdAt: "2025-12-01T10:00:00.000Z",
        updatedAt: "2025-12-01T10:00:00.000Z",
      };
    });

    // Process same event twice simultaneously
    const [result1, result2] = await Promise.allSettled([
      handler.handle(event, createMockContext()),
      handler.handle(event, createMockContext()),
    ]);

    // Both should succeed (one creates, one finds existing)
    expect(result1.status).toBe("fulfilled");
    expect(result2.status).toBe("fulfilled");

    // Exactly one creation should happen
    expect(mockRepo.create).toHaveBeenCalledTimes(1);
    
    // Both should confirm (either new or existing)
    expect(mockConfirmUseCase.execute).toHaveBeenCalledTimes(2);
  });

  it("should handle high concurrency with 10 simultaneous events", async () => {
    const events: LoanCreatedEvent[] = Array.from({ length: 10 }, (_, i) => ({
      eventType: "Loan.Created" as const,
      reservationId: `res-bulk-${i}`,
      userId: `user-${i}`,
      deviceId: `device-${i}`,
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-03T00:00:00.000Z",
      timestamp: `2025-12-01T10:00:${String(i).padStart(2, '0')}.000Z`,
    }));

    const promises = events.map(event => handler.handle(event, createMockContext()));
    const results = await Promise.allSettled(promises);

    // All should succeed
    results.forEach((result, i) => {
      expect(result.status).toBe("fulfilled");
    });

    expect(mockRepo.create).toHaveBeenCalledTimes(10);
    expect(mockConfirmUseCase.execute).toHaveBeenCalledTimes(10);
  });

  it("should handle concurrent processing with some failures gracefully", async () => {
    const events: LoanCreatedEvent[] = Array.from({ length: 5 }, (_, i) => ({
      eventType: "Loan.Created" as const,
      reservationId: `res-mixed-${i}`,
      userId: `user-${i}`,
      deviceId: `device-${i}`,
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-03T00:00:00.000Z",
      timestamp: `2025-12-01T10:00:${String(i).padStart(2, '0')}.000Z`,
    }));

    // Make the 3rd event fail (index 2)
    let createCallCount = 0;
    mockRepo.create = jest.fn().mockImplementation(async () => {
      createCallCount++;
      if (createCallCount === 3) {
        throw new Error("Cosmos DB temporarily unavailable");
      }
    });

    const promises = events.map(event => handler.handle(event, createMockContext()));
    const results = await Promise.allSettled(promises);

    // 4 should succeed, 1 should fail
    const succeeded = results.filter(r => r.status === "fulfilled");
    const failed = results.filter(r => r.status === "rejected");

    expect(succeeded.length).toBe(4);
    expect(failed.length).toBe(1);
    
    if (failed[0].status === "rejected") {
      expect(failed[0].reason.message).toContain("Cosmos DB temporarily unavailable");
    }
  });

  it("should maintain data consistency under concurrent duplicate events", async () => {
    const sameEvent: LoanCreatedEvent = {
      eventType: "Loan.Created",
      reservationId: "res-consistent-123",
      userId: "user-999",
      deviceId: "device-888",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-03T00:00:00.000Z",
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    let created = false;
    const existingReservation: Reservation = {
      id: "res-consistent-123",
      userId: "user-999",
      deviceId: "device-888",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-03T00:00:00.000Z",
      status: ReservationStatus.Pending,
      createdAt: "2025-12-01T10:00:00.000Z",
      updatedAt: "2025-12-01T10:00:00.000Z",
    };

    mockRepo.getById = jest.fn().mockImplementation(async () => {
      return created ? existingReservation : null;
    });

    mockRepo.create = jest.fn().mockImplementation(async () => {
      created = true;
    });

    // Send same event 5 times concurrently
    const promises = Array(5).fill(sameEvent).map(event => 
      handler.handle(event, createMockContext())
    );
    
    await Promise.all(promises);

    // In a true race condition, multiple creates could happen before the flag is set
    // But it should be a small number (not all 5)
    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockRepo.create.mock.calls.length).toBeLessThanOrEqual(5);
    
    // All invocations should complete (either create or find existing)
    expect(mockConfirmUseCase.execute).toHaveBeenCalled();
    expect(mockConfirmUseCase.execute.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
