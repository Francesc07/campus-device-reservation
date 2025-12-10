import { ConfirmReservationUseCase } from "./ConfirmReservationUseCase";
import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { IEventPublisher } from "../Interfaces/IEventPublisher";
import { Reservation } from "../../Domain/Entities/Reservation";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";

/**
 * Edge Case and Error Handling Tests for ConfirmReservationUseCase
 */
describe("ConfirmReservationUseCase - Edge Cases and Error Handling", () => {
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

  describe("Already Confirmed Reservation", () => {
    it("should handle re-confirmation idempotently", async () => {
      const reservation: Reservation = {
        id: "res-123",
        userId: "user-456",
        deviceId: "device-789",
        startDate: "2025-12-01T00:00:00.000Z",
        dueDate: "2025-12-15T00:00:00.000Z",
        status: ReservationStatus.Confirmed,
        createdAt: "2025-12-01T10:00:00.000Z",
        updatedAt: "2025-12-01T10:00:00.000Z",
        confirmedAt: "2025-12-01T10:00:00.000Z",
      };

      await useCase.execute(reservation);

      // Should still update (idempotent)
      expect(mockRepo.update).toHaveBeenCalled();
      expect(reservation.status).toBe(ReservationStatus.Confirmed);
      
      // Should still publish event (downstream handles idempotency)
      expect(mockPublisher.publish).toHaveBeenCalled();
    });
  });

  describe("Cancelled Reservation", () => {
    it("should confirm a cancelled reservation (reactivation scenario)", async () => {
      const reservation: Reservation = {
        id: "res-cancelled",
        userId: "user-456",
        deviceId: "device-789",
        startDate: "2025-12-01T00:00:00.000Z",
        dueDate: "2025-12-15T00:00:00.000Z",
        status: ReservationStatus.Cancelled,
        createdAt: "2025-12-01T10:00:00.000Z",
        updatedAt: "2025-12-01T11:00:00.000Z",
        cancelledAt: "2025-12-01T11:00:00.000Z",
      };

      await useCase.execute(reservation);

      expect(reservation.status).toBe(ReservationStatus.Confirmed);
      expect(mockRepo.update).toHaveBeenCalled();
    });
  });

  describe("Repository Failures", () => {
    it("should propagate error when update fails", async () => {
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

      mockRepo.update.mockRejectedValue(new Error("Cosmos DB throttled - 429"));

      await expect(useCase.execute(reservation)).rejects.toThrow("Cosmos DB throttled - 429");

      expect(mockPublisher.publish).not.toHaveBeenCalled();
    });

    it("should handle network timeouts", async () => {
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

      mockRepo.update.mockRejectedValue(new Error("Request timeout"));

      await expect(useCase.execute(reservation)).rejects.toThrow("Request timeout");
    });
  });

  describe("Event Publishing Failures", () => {
    it("should propagate error when event publishing fails", async () => {
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

      mockPublisher.publish.mockRejectedValue(new Error("Event Grid unavailable"));

      await expect(useCase.execute(reservation)).rejects.toThrow("Event Grid unavailable");

      // Update should still have been called before publish
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it("should handle Event Grid throttling", async () => {
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

      mockPublisher.publish.mockRejectedValue(new Error("429 - Too Many Requests"));

      await expect(useCase.execute(reservation)).rejects.toThrow("429 - Too Many Requests");
    });
  });

  describe("Timestamp Validation", () => {
    it("should set confirmedAt timestamp when confirming", async () => {
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

      expect(reservation.confirmedAt).toBeDefined();
      // Should be a valid ISO timestamp
      expect(new Date(reservation.confirmedAt!).toISOString()).toBe(reservation.confirmedAt);
    });

    it("should update updatedAt timestamp", async () => {
      const originalUpdatedAt = "2025-12-01T10:00:00.000Z";
      const reservation: Reservation = {
        id: "res-123",
        userId: "user-456",
        deviceId: "device-789",
        startDate: "2025-12-01T00:00:00.000Z",
        dueDate: "2025-12-15T00:00:00.000Z",
        status: ReservationStatus.Pending,
        createdAt: "2025-12-01T10:00:00.000Z",
        updatedAt: originalUpdatedAt,
      };

      await useCase.execute(reservation);

      expect(reservation.updatedAt).not.toBe(originalUpdatedAt);
      expect(new Date(reservation.updatedAt) >= new Date(originalUpdatedAt)).toBe(true);
    });

    it("should preserve createdAt timestamp", async () => {
      const originalCreatedAt = "2025-12-01T10:00:00.000Z";
      const reservation: Reservation = {
        id: "res-123",
        userId: "user-456",
        deviceId: "device-789",
        startDate: "2025-12-01T00:00:00.000Z",
        dueDate: "2025-12-15T00:00:00.000Z",
        status: ReservationStatus.Pending,
        createdAt: originalCreatedAt,
        updatedAt: "2025-12-01T10:00:00.000Z",
      };

      await useCase.execute(reservation);

      // createdAt should never change
      expect(reservation.createdAt).toBe(originalCreatedAt);
    });
  });

  describe("Event Data Validation", () => {
    it("should publish event with all required fields", async () => {
      const reservation: Reservation = {
        id: "res-complete",
        userId: "user-complete",
        deviceId: "device-complete",
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
          reservationId: "res-complete",
          deviceId: "device-complete",
          userId: "user-complete",
          startDate: "2025-12-01T00:00:00.000Z",
          dueDate: "2025-12-15T00:00:00.000Z",
        },
      });
    });

    it("should not include optional fields in event if not present", async () => {
      const reservation: Reservation = {
        id: "res-minimal",
        userId: "user-minimal",
        deviceId: "device-minimal",
        startDate: "2025-12-01T00:00:00.000Z",
        dueDate: "2025-12-15T00:00:00.000Z",
        status: ReservationStatus.Pending,
        createdAt: "2025-12-01T10:00:00.000Z",
        updatedAt: "2025-12-01T10:00:00.000Z",
      };

      await useCase.execute(reservation);

      const publishCall = mockPublisher.publish.mock.calls[0][0];
      expect(publishCall.data.notes).toBeUndefined();
      expect(publishCall.data.cancelledAt).toBeUndefined();
    });
  });

  describe("Concurrency Safety", () => {
    it("should handle multiple concurrent confirmations of different reservations", async () => {
      const reservations: Reservation[] = Array.from({ length: 10 }, (_, i) => ({
        id: `res-concurrent-${i}`,
        userId: `user-${i}`,
        deviceId: `device-${i}`,
        startDate: "2025-12-01T00:00:00.000Z",
        dueDate: "2025-12-15T00:00:00.000Z",
        status: ReservationStatus.Pending,
        createdAt: "2025-12-01T10:00:00.000Z",
        updatedAt: "2025-12-01T10:00:00.000Z",
      }));

      const promises = reservations.map(res => useCase.execute(res));
      await Promise.all(promises);

      expect(mockRepo.update).toHaveBeenCalledTimes(10);
      expect(mockPublisher.publish).toHaveBeenCalledTimes(10);

      // All should be confirmed
      reservations.forEach(res => {
        expect(res.status).toBe(ReservationStatus.Confirmed);
      });
    });
  });

  describe("Reservation State Transitions", () => {
    const testFromStatuses = [
      ReservationStatus.Pending,
      ReservationStatus.Collected,
      ReservationStatus.Returned,
    ];

    testFromStatuses.forEach((fromStatus) => {
      it(`should successfully transition from ${fromStatus} to Confirmed`, async () => {
        const reservation: Reservation = {
          id: "res-123",
          userId: "user-456",
          deviceId: "device-789",
          startDate: "2025-12-01T00:00:00.000Z",
          dueDate: "2025-12-15T00:00:00.000Z",
          status: fromStatus,
          createdAt: "2025-12-01T10:00:00.000Z",
          updatedAt: "2025-12-01T10:00:00.000Z",
        };

        await useCase.execute(reservation);

        expect(reservation.status).toBe(ReservationStatus.Confirmed);
        expect(mockRepo.update).toHaveBeenCalled();
      });
    });
  });
});
