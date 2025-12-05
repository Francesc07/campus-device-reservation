import { Reservation } from "./Reservation";
import { ReservationStatus } from "../Enums/ReservationStatus";

describe("Reservation Entity", () => {
  it("should create a valid reservation object", () => {
    const reservation: Reservation = {
      id: "test-id-123",
      userId: "user-456",
      deviceId: "device-789",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-15T00:00:00.000Z",
      status: ReservationStatus.Pending,
      createdAt: "2025-12-01T10:00:00.000Z",
      updatedAt: "2025-12-01T10:00:00.000Z",
    };

    expect(reservation.id).toBe("test-id-123");
    expect(reservation.userId).toBe("user-456");
    expect(reservation.deviceId).toBe("device-789");
    expect(reservation.status).toBe(ReservationStatus.Pending);
  });

  it("should support all reservation statuses", () => {
    const statuses = [
      ReservationStatus.Pending,
      ReservationStatus.Confirmed,
      ReservationStatus.Cancelled,
      ReservationStatus.Collected,
      ReservationStatus.Returned,
    ];

    statuses.forEach((status) => {
      const reservation: Reservation = {
        id: "test-id",
        userId: "user-id",
        deviceId: "device-id",
        startDate: "2025-12-01T00:00:00.000Z",
        dueDate: "2025-12-15T00:00:00.000Z",
        status: status,
        createdAt: "2025-12-01T10:00:00.000Z",
        updatedAt: "2025-12-01T10:00:00.000Z",
      };

      expect(reservation.status).toBe(status);
    });
  });

  it("should support optional fields", () => {
    const reservation: Reservation = {
      id: "test-id",
      userId: "user-id",
      deviceId: "device-id",
      startDate: "2025-12-01T00:00:00.000Z",
      dueDate: "2025-12-15T00:00:00.000Z",
      status: ReservationStatus.Confirmed,
      createdAt: "2025-12-01T10:00:00.000Z",
      updatedAt: "2025-12-01T10:00:00.000Z",
      confirmedAt: "2025-12-01T11:00:00.000Z",
      notes: "Test notes",
    };

    expect(reservation.confirmedAt).toBe("2025-12-01T11:00:00.000Z");
    expect(reservation.notes).toBe("Test notes");
    expect(reservation.cancelledAt).toBeUndefined();
    expect(reservation.completedAt).toBeUndefined();
  });
});
