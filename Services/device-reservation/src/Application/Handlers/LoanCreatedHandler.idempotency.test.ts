import { LoanCreatedHandler } from "./LoanCreatedHandler";
import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { ConfirmReservationUseCase } from "../UseCases/ConfirmReservationUseCase";
import { LoanCreatedEvent } from "../../Domain/Events/LoanCreatedEvent";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";
import { InvocationContext } from "@azure/functions";
import { Reservation } from "../../Domain/Entities/Reservation";

describe("LoanCreatedHandler - Idempotency Tests", () => {
  let mockRepo: jest.Mocked<IReservationRepository>;
  let mockConfirmUseCase: jest.Mocked<ConfirmReservationUseCase>;
  let handler: LoanCreatedHandler;
  let mockContext: InvocationContext;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      update: jest.fn(),
      getById: jest.fn(),
    };

    mockConfirmUseCase = {
      execute: jest.fn(),
    } as any;

    handler = new LoanCreatedHandler(mockRepo, mockConfirmUseCase);

    mockContext = {
      log: jest.fn(),
      error: jest.fn(),
    } as any;
  });

  it("should handle duplicate Loan.Created event idempotently", async () => {
    const event: LoanCreatedEvent = {
      eventType: "Loan.Created",
      reservationId: "res-duplicate-123",
      userId: "user-456",
      deviceId: "device-789",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-03T00:00:00.000Z",
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    // First call - creates reservation
    mockRepo.getById = jest.fn().mockResolvedValue(null);
    await handler.handle(event, mockContext);
    
    expect(mockRepo.create).toHaveBeenCalledTimes(1);
    expect(mockConfirmUseCase.execute).toHaveBeenCalledTimes(1);

    // Second call - finds existing reservation (idempotent)
    const existingReservation: Reservation = {
      id: "res-duplicate-123",
      userId: "user-456",
      deviceId: "device-789",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-03T00:00:00.000Z",
      status: ReservationStatus.Confirmed,
      createdAt: "2025-12-01T10:00:00.000Z",
      updatedAt: "2025-12-01T10:00:01.000Z",
    };
    
    mockRepo.getById = jest.fn().mockResolvedValue(existingReservation);
    await handler.handle(event, mockContext);

    // Should NOT create again, but should confirm (in case previous confirmation failed)
    expect(mockRepo.create).toHaveBeenCalledTimes(1); // Still 1, not 2
    expect(mockConfirmUseCase.execute).toHaveBeenCalledTimes(2); // But confirm is called again
    expect(mockContext.log).toHaveBeenCalledWith(
      expect.stringContaining("already exists - skipping creation (idempotent)")
    );
  });

  it("should handle multiple duplicate events without error", async () => {
    const event: LoanCreatedEvent = {
      eventType: "Loan.Created",
      reservationId: "res-multi-dup",
      userId: "user-999",
      deviceId: "device-888",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-03T00:00:00.000Z",
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    const existingReservation: Reservation = {
      id: "res-multi-dup",
      userId: "user-999",
      deviceId: "device-888",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-03T00:00:00.000Z",
      status: ReservationStatus.Confirmed,
      createdAt: "2025-12-01T10:00:00.000Z",
      updatedAt: "2025-12-01T10:00:01.000Z",
    };

    // All calls find existing reservation
    mockRepo.getById = jest.fn().mockResolvedValue(existingReservation);

    // Process same event 5 times (simulating Event Grid retries)
    await handler.handle(event, mockContext);
    await handler.handle(event, mockContext);
    await handler.handle(event, mockContext);
    await handler.handle(event, mockContext);
    await handler.handle(event, mockContext);

    // Should never create
    expect(mockRepo.create).not.toHaveBeenCalled();
    
    // Should confirm 5 times (safe to re-confirm)
    expect(mockConfirmUseCase.execute).toHaveBeenCalledTimes(5);
    
    // Should log idempotent handling (check it was logged at least once)
    const logCalls = (mockContext.log as jest.Mock).mock.calls;
    const idempotentLogs = logCalls.filter(call => 
      call[0]?.includes && call[0].includes("already exists - skipping creation (idempotent)")
    );
    expect(idempotentLogs.length).toBeGreaterThan(0);
  });

  it("should preserve idempotency even with different timestamps", async () => {
    const baseEvent = {
      eventType: "Loan.Created" as const,
      reservationId: "res-same-id",
      userId: "user-123",
      deviceId: "device-456",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-03T00:00:00.000Z",
    };

    // Event 1 with timestamp T1
    const event1: LoanCreatedEvent = {
      ...baseEvent,
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    // Event 2 with timestamp T2 (retry)
    const event2: LoanCreatedEvent = {
      ...baseEvent,
      timestamp: "2025-12-01T10:00:05.000Z", // 5 seconds later
    };

    const existingReservation: Reservation = {
      id: "res-same-id",
      userId: "user-123",
      deviceId: "device-456",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-03T00:00:00.000Z",
      status: ReservationStatus.Confirmed,
      createdAt: "2025-12-01T10:00:00.000Z",
      updatedAt: "2025-12-01T10:00:01.000Z",
    };

    mockRepo.getById = jest.fn().mockResolvedValue(existingReservation);

    // Both events should be handled idempotently
    await handler.handle(event1, mockContext);
    await handler.handle(event2, mockContext);

    expect(mockRepo.create).not.toHaveBeenCalled();
    expect(mockConfirmUseCase.execute).toHaveBeenCalledTimes(2);
  });

  it("should handle idempotent confirmation even if it throws error", async () => {
    const event: LoanCreatedEvent = {
      eventType: "Loan.Created",
      reservationId: "res-error-123",
      userId: "user-789",
      deviceId: "device-123",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-03T00:00:00.000Z",
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    const existingReservation: Reservation = {
      id: "res-error-123",
      userId: "user-789",
      deviceId: "device-123",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-03T00:00:00.000Z",
      status: ReservationStatus.Pending,
      createdAt: "2025-12-01T10:00:00.000Z",
      updatedAt: "2025-12-01T10:00:00.000Z",
    };

    mockRepo.getById = jest.fn().mockResolvedValue(existingReservation);
    mockConfirmUseCase.execute = jest.fn().mockRejectedValue(new Error("Event Grid temporarily unavailable"));

    await expect(handler.handle(event, mockContext)).rejects.toThrow("Event Grid temporarily unavailable");
    
    expect(mockContext.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to confirm existing reservation"),
      expect.any(Error)
    );
    expect(mockRepo.create).not.toHaveBeenCalled();
  });
});
