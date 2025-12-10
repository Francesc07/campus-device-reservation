import { CancelReservationUseCase } from "./CancelReservationUseCase";
import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { IEventPublisher } from "../Interfaces/IEventPublisher";
import { Reservation } from "../../Domain/Entities/Reservation";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";
import { InvocationContext } from "@azure/functions";

/**
 * Edge Case and Error Handling Tests for CancelReservationUseCase
 */
describe("CancelReservationUseCase - Edge Cases and Error Handling", () => {
  let mockRepo: jest.Mocked<IReservationRepository>;
  let mockPublisher: jest.Mocked<IEventPublisher>;
  let useCase: CancelReservationUseCase;
  let mockContext: InvocationContext;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      update: jest.fn(),
      getById: jest.fn(),
    };

    mockPublisher = {
      publish: jest.fn(),
    };

    mockContext = {
      log: jest.fn(),
      error: jest.fn(),
    } as any;

    useCase = new CancelReservationUseCase(mockRepo, mockPublisher);
  });

  describe("Non-existent Reservation", () => {
    it("should throw error when reservation is not found", async () => {
      mockRepo.getById.mockResolvedValue(null);

      await expect(
        useCase.execute("non-existent-id", "user-123", "reason", mockContext)
      ).rejects.toThrow("Reservation not found: non-existent-id");

      expect(mockRepo.getById).toHaveBeenCalledWith("non-existent-id");
      expect(mockRepo.update).not.toHaveBeenCalled();
      expect(mockPublisher.publish).not.toHaveBeenCalled();
    });

    it("should not publish event when reservation does not exist", async () => {
      mockRepo.getById.mockResolvedValue(null);

      await expect(
        useCase.execute("missing-res", "user-456", "test", mockContext)
      ).rejects.toThrow();

      expect(mockPublisher.publish).not.toHaveBeenCalled();
    });
  });

  describe("Already Cancelled Reservation", () => {
    it("should handle cancellation of already cancelled reservation idempotently", async () => {
      const reservation: Reservation = {
        id: "res-already-cancelled",
        userId: "user-456",
        deviceId: "device-789",
        startDate: "2025-12-01T00:00:00.000Z",
        dueDate: "2025-12-15T00:00:00.000Z",
        status: ReservationStatus.Cancelled,
        createdAt: "2025-12-01T10:00:00.000Z",
        updatedAt: "2025-12-01T10:00:00.000Z",
        cancelledAt: "2025-12-01T11:00:00.000Z",
      };

      mockRepo.getById.mockResolvedValue(reservation);

      // Should complete successfully (idempotent)
      await useCase.execute("res-already-cancelled", "user-456", "Duplicate cancel", mockContext);

      // Should still call update (safe to re-cancel)
      expect(mockRepo.update).toHaveBeenCalled();
      
      // Should still publish event (downstream systems handle idempotency)
      expect(mockPublisher.publish).toHaveBeenCalled();
    });
  });

  describe("Authorization Checks", () => {
    it("should throw error when user does not own the reservation", async () => {
      const reservation: Reservation = {
        id: "res-123",
        userId: "owner-user",
        deviceId: "device-789",
        startDate: "2025-12-01T00:00:00.000Z",
        dueDate: "2025-12-15T00:00:00.000Z",
        status: ReservationStatus.Confirmed,
        createdAt: "2025-12-01T10:00:00.000Z",
        updatedAt: "2025-12-01T10:00:00.000Z",
      };

      mockRepo.getById.mockResolvedValue(reservation);

      await expect(
        useCase.execute("res-123", "different-user", "unauthorized", mockContext)
      ).rejects.toThrow("User different-user is not authorized to cancel reservation res-123");

      expect(mockRepo.update).not.toHaveBeenCalled();
      expect(mockPublisher.publish).not.toHaveBeenCalled();
    });

    it("should allow cancellation by correct user", async () => {
      const reservation: Reservation = {
        id: "res-123",
        userId: "owner-user",
        deviceId: "device-789",
        startDate: "2025-12-01T00:00:00.000Z",
        dueDate: "2025-12-15T00:00:00.000Z",
        status: ReservationStatus.Confirmed,
        createdAt: "2025-12-01T10:00:00.000Z",
        updatedAt: "2025-12-01T10:00:00.000Z",
      };

      mockRepo.getById.mockResolvedValue(reservation);

      await useCase.execute("res-123", "owner-user", "authorized", mockContext);

      expect(mockRepo.update).toHaveBeenCalled();
      expect(mockPublisher.publish).toHaveBeenCalled();
    });
  });

  describe("Repository Failures", () => {
    it("should propagate error when getById fails", async () => {
      mockRepo.getById.mockRejectedValue(new Error("Database connection failed"));

      await expect(
        useCase.execute("res-123", "user-456", "reason", mockContext)
      ).rejects.toThrow("Database connection failed");

      expect(mockRepo.update).not.toHaveBeenCalled();
      expect(mockPublisher.publish).not.toHaveBeenCalled();
    });

    it("should propagate error when update fails", async () => {
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
      mockRepo.update.mockRejectedValue(new Error("Update failed - conflict"));

      await expect(
        useCase.execute("res-123", "user-456", "reason", mockContext)
      ).rejects.toThrow("Update failed - conflict");

      expect(mockPublisher.publish).not.toHaveBeenCalled();
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
        status: ReservationStatus.Confirmed,
        createdAt: "2025-12-01T10:00:00.000Z",
        updatedAt: "2025-12-01T10:00:00.000Z",
      };

      mockRepo.getById.mockResolvedValue(reservation);
      mockPublisher.publish.mockRejectedValue(new Error("Event Grid unavailable"));

      await expect(
        useCase.execute("res-123", "user-456", "reason", mockContext)
      ).rejects.toThrow("Event Grid unavailable");

      // Update should still have been called
      expect(mockRepo.update).toHaveBeenCalled();
    });
  });

  describe("Cancellation Reasons", () => {
    it("should handle very long cancellation reasons", async () => {
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

      const longReason = "A".repeat(10000); // Very long reason

      await useCase.execute("res-123", "user-456", longReason, mockContext);

      expect(mockPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: longReason,
        })
      );
    });

    it("should handle special characters in cancellation reason", async () => {
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

      const specialReason = "Reason with 'quotes', \"double quotes\", <tags>, & ampersands";

      await useCase.execute("res-123", "user-456", specialReason, mockContext);

      expect(mockPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: specialReason,
        })
      );
    });
  });

  describe("Different Reservation Statuses", () => {
    const testStatuses = [
      ReservationStatus.Pending,
      ReservationStatus.Confirmed,
      ReservationStatus.Collected,
      ReservationStatus.Returned,
    ];

    testStatuses.forEach((status) => {
      it(`should successfully cancel reservation in ${status} status`, async () => {
        const reservation: Reservation = {
          id: "res-123",
          userId: "user-456",
          deviceId: "device-789",
          startDate: "2025-12-01T00:00:00.000Z",
          dueDate: "2025-12-15T00:00:00.000Z",
          status: status,
          createdAt: "2025-12-01T10:00:00.000Z",
          updatedAt: "2025-12-01T10:00:00.000Z",
        };

        mockRepo.getById.mockResolvedValue(reservation);

        await useCase.execute("res-123", "user-456", "status test", mockContext);

        expect(mockRepo.update).toHaveBeenCalled();
        expect(reservation.status).toBe(ReservationStatus.Cancelled);
      });
    });
  });

  describe("Timestamp Validation", () => {
    it("should set cancelledAt timestamp when cancelling", async () => {
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

      await useCase.execute("res-123", "user-456", "test", mockContext);

      expect(reservation.cancelledAt).toBeDefined();
      expect(reservation.updatedAt).toBeDefined();
      
      // cancelledAt should be a valid ISO timestamp
      expect(new Date(reservation.cancelledAt!).toISOString()).toBe(reservation.cancelledAt);
    });

    it("should update updatedAt timestamp", async () => {
      const originalUpdatedAt = "2025-12-01T10:00:00.000Z";
      const reservation: Reservation = {
        id: "res-123",
        userId: "user-456",
        deviceId: "device-789",
        startDate: "2025-12-01T00:00:00.000Z",
        dueDate: "2025-12-15T00:00:00.000Z",
        status: ReservationStatus.Confirmed,
        createdAt: "2025-12-01T10:00:00.000Z",
        updatedAt: originalUpdatedAt,
      };

      mockRepo.getById.mockResolvedValue(reservation);

      await useCase.execute("res-123", "user-456", "test", mockContext);

      // updatedAt should be different (more recent)
      expect(reservation.updatedAt).not.toBe(originalUpdatedAt);
      expect(new Date(reservation.updatedAt) >= new Date(originalUpdatedAt)).toBe(true);
    });
  });
});
