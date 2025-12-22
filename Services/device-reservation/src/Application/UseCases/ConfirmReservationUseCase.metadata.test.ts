import { ConfirmReservationUseCase } from "./ConfirmReservationUseCase";
import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { IEventPublisher } from "../Interfaces/IEventPublisher";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";
import { Reservation } from "../../Domain/Entities/Reservation";

describe("ConfirmReservationUseCase - Metadata Publishing", () => {
  let useCase: ConfirmReservationUseCase;
  let mockRepo: jest.Mocked<IReservationRepository>;
  let mockPublisher: jest.Mocked<IEventPublisher>;

  beforeEach(() => {
    mockRepo = {
      update: jest.fn(),
      create: jest.fn(),
      getById: jest.fn(),
      getByUserId: jest.fn(),
    } as any;

    mockPublisher = {
      publish: jest.fn(),
    } as any;

    useCase = new ConfirmReservationUseCase(mockRepo, mockPublisher);
  });

  it("should include deviceBrand, deviceModel, and userEmail in Reservation.Confirmed event", async () => {
    const reservation: Reservation = {
      id: "res-123",
      userId: "user-456",
      deviceId: "device-789",
      deviceBrand: "Apple",
      deviceModel: "MacBook Pro",
      userEmail: "user@example.com",
      startDate: "2025-12-13T00:00:00.000Z",
      dueDate: "2025-12-15T00:00:00.000Z",
      status: ReservationStatus.Pending,
      createdAt: "2025-12-13T10:00:00.000Z",
      updatedAt: "2025-12-13T10:00:00.000Z",
    };

    await useCase.execute(reservation);

    expect(mockPublisher.publish).toHaveBeenCalledWith({
      eventType: "Reservation.Confirmed",
      data: expect.objectContaining({
        deviceBrand: "Apple",
        deviceModel: "MacBook Pro",
        userEmail: "user@example.com",
      }),
    });
  });

  it("should publish event with all required fields including metadata", async () => {
    const reservation: Reservation = {
      id: "res-complete",
      userId: "auth0|user123",
      deviceId: "device-uuid",
      deviceBrand: "Dell",
      deviceModel: "XPS 15",
      userEmail: "student@university.edu",
      startDate: "2025-12-13T08:00:00.000Z",
      dueDate: "2025-12-15T08:00:00.000Z",
      status: ReservationStatus.Pending,
      createdAt: "2025-12-13T08:00:00.000Z",
      updatedAt: "2025-12-13T08:00:00.000Z",
    };

    await useCase.execute(reservation);

    const publishedEvent = (mockPublisher.publish as jest.Mock).mock.calls[0][0];

    expect(publishedEvent).toMatchObject({
      eventType: "Reservation.Confirmed",
      data: {
        reservationId: "res-complete",
        userId: "auth0|user123",
        deviceId: "device-uuid",
        deviceBrand: "Dell",
        deviceModel: "XPS 15",
        userEmail: "student@university.edu",
        startDate: "2025-12-13T08:00:00.000Z",
        dueDate: "2025-12-15T08:00:00.000Z",
      },
    });
  });

  it("should handle reservations without metadata (backward compatibility)", async () => {
    const reservation: Reservation = {
      id: "res-no-metadata",
      userId: "user-456",
      deviceId: "device-789",
      // No metadata fields
      startDate: "2025-12-13T00:00:00.000Z",
      dueDate: "2025-12-15T00:00:00.000Z",
      status: ReservationStatus.Pending,
      createdAt: "2025-12-13T10:00:00.000Z",
      updatedAt: "2025-12-13T10:00:00.000Z",
    };

    await useCase.execute(reservation);

    expect(mockPublisher.publish).toHaveBeenCalledWith({
      eventType: "Reservation.Confirmed",
      data: expect.objectContaining({
        reservationId: "res-no-metadata",
        userId: "user-456",
        deviceId: "device-789",
        deviceBrand: undefined,
        deviceModel: undefined,
        userEmail: undefined,
      }),
    });
  });

  it("should publish metadata to enable Confirmation Service to send email without API calls", async () => {
    const reservation: Reservation = {
      id: "res-email-test",
      userId: "auth0|johndoe",
      deviceId: "device-laptop-123",
      deviceBrand: "Lenovo",
      deviceModel: "ThinkPad X1 Carbon",
      userEmail: "john.doe@university.edu",
      startDate: "2025-12-13T09:00:00.000Z",
      dueDate: "2025-12-15T09:00:00.000Z",
      status: ReservationStatus.Pending,
      createdAt: "2025-12-13T09:00:00.000Z",
      updatedAt: "2025-12-13T09:00:00.000Z",
    };

    await useCase.execute(reservation);

    const eventData = (mockPublisher.publish as jest.Mock).mock.calls[0][0].data;

    // Confirmation Service can use these fields directly for email
    expect(eventData.userEmail).toBe("john.doe@university.edu");
    expect(eventData.deviceBrand).toBe("Lenovo");
    expect(eventData.deviceModel).toBe("ThinkPad X1 Carbon");

    // No need for Confirmation Service to call User API or Device API
    expect(eventData).toHaveProperty("userEmail");
    expect(eventData).toHaveProperty("deviceBrand");
    expect(eventData).toHaveProperty("deviceModel");
  });
});
