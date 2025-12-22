import { InvocationContext } from "@azure/functions";
import { LoanCreatedHandler } from "./LoanCreatedHandler";
import { LoanCreatedEvent } from "../../Domain/Events/LoanCreatedEvent";
import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { ConfirmReservationUseCase } from "../UseCases/ConfirmReservationUseCase";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";

describe("LoanCreatedHandler - Metadata Handling", () => {
  let handler: LoanCreatedHandler;
  let mockRepo: jest.Mocked<IReservationRepository>;
  let mockConfirmUseCase: jest.Mocked<ConfirmReservationUseCase>;
  let mockContext: InvocationContext;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      getById: jest.fn(),
      update: jest.fn(),
      getByUserId: jest.fn(),
    } as any;

    mockConfirmUseCase = {
      execute: jest.fn(),
    } as any;

    mockContext = {
      log: jest.fn(),
      error: jest.fn(),
    } as any;

    handler = new LoanCreatedHandler(mockRepo, mockConfirmUseCase);
  });

  it("should extract and store deviceBrand from Loan.Created event", async () => {
    const event: LoanCreatedEvent = {
      eventType: "Loan.Created",
      reservationId: "res-123",
      userId: "user-456",
      deviceId: "device-789",
      deviceBrand: "Apple",
      deviceModel: "MacBook Pro",
      userEmail: "user@example.com",
      startDate: "2025-12-13T00:00:00.000Z",
      dueDate: "2025-12-15T00:00:00.000Z",
      timestamp: "2025-12-13T10:00:00.000Z",
    };

    mockRepo.getById.mockResolvedValue(null);

    await handler.handle(event, mockContext);

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceBrand: "Apple",
        deviceModel: "MacBook Pro",
        userEmail: "user@example.com",
      })
    );
  });

  it("should handle missing metadata gracefully (optional fields)", async () => {
    const event: LoanCreatedEvent = {
      eventType: "Loan.Created",
      reservationId: "res-123",
      userId: "user-456",
      deviceId: "device-789",
      // No metadata fields
      startDate: "2025-12-13T00:00:00.000Z",
      dueDate: "2025-12-15T00:00:00.000Z",
      timestamp: "2025-12-13T10:00:00.000Z",
    };

    mockRepo.getById.mockResolvedValue(null);

    await handler.handle(event, mockContext);

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "res-123",
        userId: "user-456",
        deviceId: "device-789",
        deviceBrand: undefined,
        deviceModel: undefined,
        userEmail: undefined,
      })
    );
  });

  it("should preserve metadata when confirming existing reservation", async () => {
    const event: LoanCreatedEvent = {
      eventType: "Loan.Created",
      reservationId: "res-existing",
      userId: "user-456",
      deviceId: "device-789",
      deviceBrand: "Dell",
      deviceModel: "XPS 15",
      userEmail: "test@example.com",
      startDate: "2025-12-13T00:00:00.000Z",
      dueDate: "2025-12-15T00:00:00.000Z",
      timestamp: "2025-12-13T10:00:00.000Z",
    };

    const existingReservation = {
      id: "res-existing",
      userId: "user-456",
      deviceId: "device-789",
      deviceBrand: "Dell",
      deviceModel: "XPS 15",
      userEmail: "test@example.com",
      startDate: "2025-12-13T00:00:00.000Z",
      dueDate: "2025-12-15T00:00:00.000Z",
      status: ReservationStatus.Pending,
      createdAt: "2025-12-13T09:00:00.000Z",
      updatedAt: "2025-12-13T09:00:00.000Z",
    };

    mockRepo.getById.mockResolvedValue(existingReservation);

    await handler.handle(event, mockContext);

    // Should confirm with existing reservation (which has metadata)
    expect(mockConfirmUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceBrand: "Dell",
        deviceModel: "XPS 15",
        userEmail: "test@example.com",
      })
    );

    // Should NOT create a new reservation
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("should store all metadata fields correctly", async () => {
    const event: LoanCreatedEvent = {
      eventType: "Loan.Created",
      reservationId: "res-complete",
      userId: "auth0|user123",
      deviceId: "device-uuid",
      deviceBrand: "Microsoft",
      deviceModel: "Surface Laptop 5",
      userEmail: "student@university.edu",
      startDate: "2025-12-13T00:00:00.000Z",
      dueDate: "2025-12-15T00:00:00.000Z",
      timestamp: "2025-12-13T10:00:00.000Z",
    };

    mockRepo.getById.mockResolvedValue(null);

    await handler.handle(event, mockContext);

    const createdReservation = (mockRepo.create as jest.Mock).mock.calls[0][0];

    expect(createdReservation).toMatchObject({
      id: "res-complete",
      userId: "auth0|user123",
      deviceId: "device-uuid",
      deviceBrand: "Microsoft",
      deviceModel: "Surface Laptop 5",
      userEmail: "student@university.edu",
      status: ReservationStatus.Pending,
    });

    // Verify metadata is present
    expect(createdReservation.deviceBrand).toBe("Microsoft");
    expect(createdReservation.deviceModel).toBe("Surface Laptop 5");
    expect(createdReservation.userEmail).toBe("student@university.edu");
  });
});
