import { LoanCreatedHandler } from "./LoanCreatedHandler";
import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { ConfirmReservationUseCase } from "../UseCases/ConfirmReservationUseCase";
import { LoanCreatedEvent } from "../../Domain/Events/LoanCreatedEvent";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";
import { InvocationContext } from "@azure/functions";
import { STANDARD_LOAN_DAYS } from "../../Domain/Constants/LoanRules";

describe("LoanCreatedHandler", () => {
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
    } as any;
  });

  it("should create a reservation from Loan.Created event", async () => {
    const event: LoanCreatedEvent = {
      eventType: "Loan.Created",
      reservationId: "res-123",
      userId: "user-456",
      deviceId: "device-789",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-03T00:00:00.000Z",
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    await handler.handle(event, mockContext);

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "res-123",
        userId: "user-456",
        deviceId: "device-789",
        status: ReservationStatus.Pending,
      })
    );
  });

  it("should calculate due date based on STANDARD_LOAN_DAYS", async () => {
    const startDate = "2025-12-01T00:00:00.000Z";
    const event: LoanCreatedEvent = {
      eventType: "Loan.Created",
      reservationId: "res-123",
      userId: "user-456",
      deviceId: "device-789",
      startDate: startDate,
      dueDate: "2025-12-03T00:00:00.000Z",
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    await handler.handle(event, mockContext);

    const expectedDueDate = new Date(startDate);
    expectedDueDate.setDate(expectedDueDate.getDate() + STANDARD_LOAN_DAYS);

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        dueDate: expectedDueDate.toISOString(),
      })
    );
  });

  it("should confirm the reservation after creation", async () => {
    const event: LoanCreatedEvent = {
      eventType: "Loan.Created",
      reservationId: "res-123",
      userId: "user-456",
      deviceId: "device-789",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-03T00:00:00.000Z",
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    await handler.handle(event, mockContext);

    expect(mockConfirmUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "res-123",
        status: ReservationStatus.Pending,
      })
    );
  });

  it("should log processing steps", async () => {
    const event: LoanCreatedEvent = {
      eventType: "Loan.Created",
      reservationId: "res-123",
      userId: "user-456",
      deviceId: "device-789",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-03T00:00:00.000Z",
      timestamp: "2025-12-01T10:00:00.000Z",
    };

    await handler.handle(event, mockContext);

    expect(mockContext.log).toHaveBeenCalledWith(
      "📩 Processing Loan.Created event",
      event
    );
    expect(mockContext.log).toHaveBeenCalledWith(
      "📝 [LoanCreatedHandler] Extracted reservationId: res-123"
    );
    expect(mockContext.log).toHaveBeenCalledWith(
      "🏗️ [LoanCreatedHandler] Creating reservation...",
      expect.anything()
    );
  });
});
