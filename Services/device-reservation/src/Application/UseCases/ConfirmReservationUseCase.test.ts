import { ConfirmReservationUseCase } from "./ConfirmReservationUseCase";
import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { IEventPublisher } from "../Interfaces/IEventPublisher";
import { Reservation } from "../../Domain/Entities/Reservation";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";

describe("ConfirmReservationUseCase", () => {
  let mockRepo: jest.Mocked<IReservationRepository>;
  let mockPublisher: jest.Mocked<IEventPublisher>;
  let useCase: ConfirmReservationUseCase;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      update: jest.fn(),
      getById: jest.fn(),
    };

    mockPublisher = {
      publish: jest.fn(),
    };

    useCase = new ConfirmReservationUseCase(mockRepo, mockPublisher);
  });

  it("should confirm a reservation and update status", async () => {
    const reservation: Reservation = {
      id: "res-123",
      userId: "user-456",
      deviceId: "device-789",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-15T00:00:00.000Z",
      status: ReservationStatus.Pending,
      createdAt: "2025-12-01T10:00:00.000Z",
      updatedAt: "2025-12-01T10:00:00.000Z",
    };

    await useCase.execute(reservation);

    expect(reservation.status).toBe(ReservationStatus.Confirmed);
    expect(reservation.updatedAt).toBeDefined();
    expect(mockRepo.update).toHaveBeenCalledWith(reservation);
  });

  it("should publish Reservation.Confirmed event", async () => {
    const reservation: Reservation = {
      id: "res-123",
      userId: "user-456",
      deviceId: "device-789",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-15T00:00:00.000Z",
      status: ReservationStatus.Pending,
      createdAt: "2025-12-01T10:00:00.000Z",
      updatedAt: "2025-12-01T10:00:00.000Z",
    };

    await useCase.execute(reservation);

    expect(mockPublisher.publish).toHaveBeenCalledWith({
      eventType: "Reservation.Confirmed",
      data: {
        reservationId: "res-123",
        deviceId: "device-789",
        userId: "user-456",
        startDate: "2025-12-01T00:00:00.000Z",
        dueDate: "2025-12-15T00:00:00.000Z",
      },
    });
  });

  it("should call repository update before publishing event", async () => {
    const callOrder: string[] = [];

    mockRepo.update.mockImplementation(async () => {
      callOrder.push("update");
    });

    mockPublisher.publish.mockImplementation(async () => {
      callOrder.push("publish");
    });

    const reservation: Reservation = {
      id: "res-123",
      userId: "user-456",
      deviceId: "device-789",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-15T00:00:00.000Z",
      status: ReservationStatus.Pending,
      createdAt: "2025-12-01T10:00:00.000Z",
      updatedAt: "2025-12-01T10:00:00.000Z",
    };

    await useCase.execute(reservation);

    expect(callOrder).toEqual(["update", "publish"]);
  });
});
