import { CancelReservationUseCase } from "./CancelReservationUseCase";
import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { IEventPublisher } from "../Interfaces/IEventPublisher";
import { Reservation } from "../../Domain/Entities/Reservation";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";

describe("CancelReservationUseCase", () => {
  let mockRepo: jest.Mocked<IReservationRepository>;
  let mockPublisher: jest.Mocked<IEventPublisher>;
  let useCase: CancelReservationUseCase;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      update: jest.fn(),
      getById: jest.fn(),
    };

    mockPublisher = {
      publish: jest.fn(),
    };

    useCase = new CancelReservationUseCase(mockRepo, mockPublisher);
  });

  it("should cancel a reservation and update status", async () => {
    const reservation: Reservation = {
      id: "res-123",
      userId: "user-456",
      deviceId: "device-789",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-15T00:00:00.000Z",
      status: ReservationStatus.Confirmed,
      createdAt: "2025-12-01T10:00:00.000Z",
      updatedAt: "2025-12-01T10:00:00.000Z",
    };

    mockRepo.getById.mockResolvedValue(reservation);

    await useCase.execute("res-123", "user-456", "No longer needed");

    expect(mockRepo.getById).toHaveBeenCalledWith("res-123");
    expect(reservation.status).toBe(ReservationStatus.Cancelled);
    expect(mockRepo.update).toHaveBeenCalledWith(reservation);
  });

  it("should publish Reservation.Cancelled event with reason", async () => {
    const reservation: Reservation = {
      id: "res-123",
      userId: "user-456",
      deviceId: "device-789",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-15T00:00:00.000Z",
      status: ReservationStatus.Confirmed,
      createdAt: "2025-12-01T10:00:00.000Z",
      updatedAt: "2025-12-01T10:00:00.000Z",
    };

    mockRepo.getById.mockResolvedValue(reservation);

    await useCase.execute("res-123", "user-456", "Changed my mind");

    expect(mockPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "Reservation.Cancelled",
        reservationId: "res-123",
        userId: "user-456",
        deviceId: "device-789",
        reason: "Changed my mind",
        timestamp: expect.any(String),
      })
    );
  });

  it("should handle cancellation without reason", async () => {
    const reservation: Reservation = {
      id: "res-123",
      userId: "user-456",
      deviceId: "device-789",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-15T00:00:00.000Z",
      status: ReservationStatus.Confirmed,
      createdAt: "2025-12-01T10:00:00.000Z",
      updatedAt: "2025-12-01T10:00:00.000Z",
    };

    mockRepo.getById.mockResolvedValue(reservation);

    await useCase.execute("res-123", "user-456");

    expect(mockPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "Reservation.Cancelled",
        reservationId: "res-123",
        userId: "user-456",
        reason: undefined,
      })
    );
  });

  it("should do nothing if reservation not found", async () => {
    mockRepo.getById.mockResolvedValue(null);

    await useCase.execute("non-existent", "user-456");

    expect(mockRepo.update).not.toHaveBeenCalled();
    expect(mockPublisher.publish).not.toHaveBeenCalled();
  });
});
