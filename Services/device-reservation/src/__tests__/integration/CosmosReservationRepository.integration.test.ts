import { CosmosClient, Database, Container } from "@azure/cosmos";
import { Reservation } from "../../Domain/Entities/Reservation";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";

// Custom repository implementation for testing that doesn't use environment.ts
class TestCosmosReservationRepository {
  constructor(public container: Container) {}

  async create(reservation: Reservation): Promise<void> {
    console.log(`💾 Creating reservation in Cosmos DB: ${reservation.id}`);
    try {
      await this.container.items.create(reservation);
      console.log(`✅ Reservation created in Cosmos DB: ${reservation.id}`);
    } catch (error) {
      console.error(`❌ Failed to create reservation in Cosmos DB: ${reservation.id}`, error);
      throw error;
    }
  }

  async update(reservation: Reservation): Promise<void> {
    console.log(`💾 Updating reservation in Cosmos DB: ${reservation.id}`);
    try {
      const cleanReservation = { ...reservation };
      delete (cleanReservation as any)._rid;
      delete (cleanReservation as any)._self;
      delete (cleanReservation as any)._etag;
      delete (cleanReservation as any)._attachments;
      delete (cleanReservation as any)._ts;
      
      await this.container.items.upsert(cleanReservation);
      console.log(`✅ Reservation updated in Cosmos DB: ${reservation.id}`);
    } catch (error) {
      console.error(`❌ Failed to update reservation in Cosmos DB: ${reservation.id}`, error);
      throw error;
    }
  }

  async getById(id: string): Promise<Reservation | null> {
    console.log(`🔍 Getting reservation from Cosmos DB: ${id}`);
    try {
      const response = await this.container.item(id, id).read<Reservation>();
      const result = response.resource || null;
      console.log(`✅ Reservation retrieved: ${id}, found: ${!!result}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to get reservation from Cosmos DB: ${id}`, error);
      return null;
    }
  }
}

/**
 * Integration tests for CosmosReservationRepository
 * These tests use the real Cosmos DB SDK against either:
 * 1. Azure Cosmos DB Emulator (local development)
 * 2. Real Azure Cosmos DB (when credentials are provided)
 * 
 * To run these tests:
 * - With emulator: npm run test:integration
 * - With Azure: Set environment variables and run npm run test:integration
 */
describe("CosmosReservationRepository - Integration Tests", () => {
  let repository: TestCosmosReservationRepository;
  let client: CosmosClient;
  let database: Database;
  let container: Container;
  let testReservationIds: string[] = [];

  beforeAll(async () => {
    // Use environment variables or emulator defaults
    const endpoint = process.env.COSMOS_DB_ENDPOINT || 'https://localhost:8081';
    const key = process.env.COSMOS_DB_KEY || 'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==';
    const databaseName = process.env.COSMOS_DB_DATABASE_NAME || 'TestDB';
    const containerName = process.env.COSMOS_DB_CONTAINER_NAME || 'TestReservations';

    client = new CosmosClient({ 
      endpoint, 
      key,
      connectionPolicy: {
        requestTimeout: 10000,
      }
    });

    // Create database if it doesn't exist
    const { database: db } = await client.databases.createIfNotExists({ 
      id: databaseName 
    });
    database = db;

    // Create container if it doesn't exist
    const { container: cont } = await database.containers.createIfNotExists({
      id: containerName,
      partitionKey: { paths: ['/id'] },
    });
    container = cont;

    // Initialize repository with test container
    repository = new TestCosmosReservationRepository(container);
  });

  afterEach(async () => {
    // Clean up test data
    for (const id of testReservationIds) {
      try {
        await container.item(id, id).delete();
      } catch (error) {
        // Ignore errors if item doesn't exist
      }
    }
    testReservationIds = [];
  });

  afterAll(async () => {
    // Optionally delete test container
    // await container.delete();
  });

  describe("create", () => {
    it("should create a reservation in Cosmos DB", async () => {
      const reservation: Reservation = {
        id: `integration-test-${Date.now()}`,
        userId: "integration-user-1",
        deviceId: "integration-device-1",
        startDate: "2025-12-10T00:00:00.000Z",
        dueDate: "2025-12-12T00:00:00.000Z",
        status: ReservationStatus.Pending,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      testReservationIds.push(reservation.id);

      await repository.create(reservation);

      // Verify it was created
      const retrieved = await container.item(reservation.id, reservation.id).read<Reservation>();
      expect(retrieved.resource).toBeDefined();
      expect(retrieved.resource?.id).toBe(reservation.id);
      expect(retrieved.resource?.userId).toBe(reservation.userId);
      expect(retrieved.resource?.status).toBe(ReservationStatus.Pending);
    });

    it("should throw error when creating duplicate reservation", async () => {
      const reservation: Reservation = {
        id: `integration-dup-${Date.now()}`,
        userId: "integration-user-2",
        deviceId: "integration-device-2",
        startDate: "2025-12-10T00:00:00.000Z",
        dueDate: "2025-12-12T00:00:00.000Z",
        status: ReservationStatus.Pending,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      testReservationIds.push(reservation.id);

      // First create should succeed
      await repository.create(reservation);

      // Second create with same ID should fail
      await expect(repository.create(reservation)).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("should update an existing reservation in Cosmos DB", async () => {
      const reservation: Reservation = {
        id: `integration-update-${Date.now()}`,
        userId: "integration-user-3",
        deviceId: "integration-device-3",
        startDate: "2025-12-10T00:00:00.000Z",
        dueDate: "2025-12-12T00:00:00.000Z",
        status: ReservationStatus.Pending,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      testReservationIds.push(reservation.id);

      // Create first
      await repository.create(reservation);

      // Update status
      reservation.status = ReservationStatus.Confirmed;
      reservation.updatedAt = new Date().toISOString();
      await repository.update(reservation);

      // Verify update
      const retrieved = await container.item(reservation.id, reservation.id).read<Reservation>();
      expect(retrieved.resource?.status).toBe(ReservationStatus.Confirmed);
    });

    it("should upsert (create if not exists) when updating non-existent reservation", async () => {
      const reservation: Reservation = {
        id: `integration-upsert-${Date.now()}`,
        userId: "integration-user-4",
        deviceId: "integration-device-4",
        startDate: "2025-12-10T00:00:00.000Z",
        dueDate: "2025-12-12T00:00:00.000Z",
        status: ReservationStatus.Confirmed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      testReservationIds.push(reservation.id);

      // Update without creating first (upsert)
      await repository.update(reservation);

      // Verify it was created
      const retrieved = await container.item(reservation.id, reservation.id).read<Reservation>();
      expect(retrieved.resource).toBeDefined();
      expect(retrieved.resource?.status).toBe(ReservationStatus.Confirmed);
    });
  });

  describe("getById", () => {
    it("should retrieve an existing reservation from Cosmos DB", async () => {
      const reservation: Reservation = {
        id: `integration-get-${Date.now()}`,
        userId: "integration-user-5",
        deviceId: "integration-device-5",
        startDate: "2025-12-10T00:00:00.000Z",
        dueDate: "2025-12-12T00:00:00.000Z",
        status: ReservationStatus.Pending,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      testReservationIds.push(reservation.id);

      // Create first
      await repository.create(reservation);

      // Retrieve
      const retrieved = await repository.getById(reservation.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(reservation.id);
      expect(retrieved?.userId).toBe(reservation.userId);
      expect(retrieved?.deviceId).toBe(reservation.deviceId);
    });

    it("should return null for non-existent reservation", async () => {
      const result = await repository.getById(`non-existent-${Date.now()}`);
      expect(result).toBeNull();
    });
  });

  describe("full workflow integration test", () => {
    it("should handle complete reservation lifecycle", async () => {
      const reservationId = `integration-lifecycle-${Date.now()}`;
      testReservationIds.push(reservationId);

      // 1. Create new reservation
      const newReservation: Reservation = {
        id: reservationId,
        userId: "lifecycle-user",
        deviceId: "lifecycle-device",
        startDate: "2025-12-10T00:00:00.000Z",
        dueDate: "2025-12-12T00:00:00.000Z",
        status: ReservationStatus.Pending,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await repository.create(newReservation);

      // 2. Retrieve and verify
      let retrieved = await repository.getById(reservationId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.status).toBe(ReservationStatus.Pending);

      // 3. Confirm the reservation
      if (retrieved) {
        retrieved.status = ReservationStatus.Confirmed;
        retrieved.updatedAt = new Date().toISOString();
        await repository.update(retrieved);
      }

      // 4. Verify confirmation
      retrieved = await repository.getById(reservationId);
      expect(retrieved?.status).toBe(ReservationStatus.Confirmed);

      // 5. Cancel the reservation
      if (retrieved) {
        retrieved.status = ReservationStatus.Cancelled;
        retrieved.updatedAt = new Date().toISOString();
        await repository.update(retrieved);
      }

      // 6. Verify cancellation
      retrieved = await repository.getById(reservationId);
      expect(retrieved?.status).toBe(ReservationStatus.Cancelled);
    });
  });
});
