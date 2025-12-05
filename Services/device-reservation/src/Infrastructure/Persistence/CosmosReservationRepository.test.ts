import { CosmosReservationRepository } from "./CosmosReservationRepository";
import { Reservation } from "../../Domain/Entities/Reservation";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";

// Mock the CosmosClientFactory
jest.mock("../Config/CosmosClientFactory", () => {
  return {
    CosmosClientFactory: {
      getReservationContainer: jest.fn(() => ({
        items: {
          create: jest.fn(),
          upsert: jest.fn(),
        },
        item: jest.fn(),
      })),
    },
  };
});

describe("CosmosReservationRepository", () => {
  let repository: CosmosReservationRepository;
  let mockContainer: any;
  let mockCreate: jest.Mock;
  let mockUpsert: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCreate = jest.fn();
    mockUpsert = jest.fn();
    
    const { CosmosClientFactory } = require("../Config/CosmosClientFactory");
    CosmosClientFactory.getReservationContainer.mockReturnValue({
      items: {
        create: mockCreate,
        upsert: mockUpsert,
      },
      item: jest.fn(),
    });
    
    mockContainer = CosmosClientFactory.getReservationContainer();
    repository = new CosmosReservationRepository();
  });

  describe("create", () => {
    it("should create a reservation in Cosmos DB", async () => {
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

      await repository.create(reservation);

      expect(mockCreate).toHaveBeenCalledWith(reservation);
    });
  });

  describe("update", () => {
    it("should upsert a reservation in Cosmos DB", async () => {
      const reservation: Reservation = {
        id: "res-123",
        userId: "user-456",
        deviceId: "device-789",
        startDate: "2025-12-01T00:00:00.000Z",
        dueDate: "2025-12-15T00:00:00.000Z",
        status: ReservationStatus.Confirmed,
        createdAt: "2025-12-01T10:00:00.000Z",
        updatedAt: "2025-12-01T11:00:00.000Z",
      };

      await repository.update(reservation);

      expect(mockUpsert).toHaveBeenCalledWith(reservation);
    });
  });

  describe("getById", () => {
    it("should retrieve a reservation by id", async () => {
      const mockReservation: Reservation = {
        id: "res-123",
        userId: "user-456",
        deviceId: "device-789",
        startDate: "2025-12-01T00:00:00.000Z",
        dueDate: "2025-12-15T00:00:00.000Z",
        status: ReservationStatus.Confirmed,
        createdAt: "2025-12-01T10:00:00.000Z",
        updatedAt: "2025-12-01T10:00:00.000Z",
      };

      const mockItem = {
        read: jest.fn().mockResolvedValue({
          resource: mockReservation,
        }),
      };

      mockContainer.item.mockReturnValue(mockItem);

      const result = await repository.getById("res-123");

      expect(mockContainer.item).toHaveBeenCalledWith("res-123", "res-123");
      expect(mockItem.read).toHaveBeenCalled();
      expect(result).toEqual(mockReservation);
    });

    it("should return null when reservation not found", async () => {
      const mockItem = {
        read: jest.fn().mockResolvedValue({
          resource: null,
        }),
      };

      mockContainer.item.mockReturnValue(mockItem);

      const result = await repository.getById("non-existent");

      expect(result).toBeNull();
    });

    it("should return null when read throws error", async () => {
      const mockItem = {
        read: jest.fn().mockRejectedValue(new Error("Not found")),
      };

      mockContainer.item.mockReturnValue(mockItem);

      const result = await repository.getById("error-id");

      expect(result).toBeNull();
    });
  });
});
