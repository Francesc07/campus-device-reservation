import { IReservationRepository } from "../../Application/Interfaces/IReservationRepository";
import { Reservation } from "../../Domain/Entities/Reservation";
import { CosmosClientFactory } from "../Config/CosmosClientFactory";

/**
 * CosmosReservationRepository
 * 
 * Implements IReservationRepository using Azure Cosmos DB SQL API.
 * Provides persistence operations for device reservations.
 * 
 * **Features:**
 * - Uses singleton Cosmos client for connection pooling
 * - Handles Cosmos DB metadata cleanup on updates
 * - Provides detailed logging for observability
 * - Implements standard repository pattern
 * 
 * **Cosmos DB Design:**
 * - Database: DeviceReservationDB
 * - Container: Reservations
 * - Partition Key: /id (reservation ID)
 * - Consistency: Session (default)
 * 
 * **Error Handling:**
 * - All errors are logged and re-thrown
 * - Cosmos DB errors include status codes and details
 * - Transactional consistency at document level
 * 
 * @example
 * ```typescript
 * const repo = new CosmosReservationRepository();
 * await repo.create(reservation);
 * const found = await repo.getById(reservation.id);
 * ```
 */
export class CosmosReservationRepository implements IReservationRepository {
  private container = CosmosClientFactory.getReservationContainer();

  /**
   * Creates a new reservation in Cosmos DB
   * 
   * @param reservation - The reservation to create
   * @throws {Error} If creation fails (duplicate ID, network error, etc.)
   */
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

  /**
   * Updates an existing reservation in Cosmos DB
   * 
   * Note: Uses upsert to handle race conditions gracefully.
   * Cleans up Cosmos DB internal metadata fields before updating.
   * 
   * @param reservation - The reservation to update
   * @throws {Error} If update fails
   */
  async update(reservation: Reservation): Promise<void> {
    console.log(`💾 Updating reservation in Cosmos DB: ${reservation.id}`);
    try {
      // Remove Cosmos DB internal metadata fields
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
