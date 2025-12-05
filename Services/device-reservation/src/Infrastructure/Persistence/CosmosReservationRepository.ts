import { IReservationRepository } from "../../Application/Interfaces/IReservationRepository";
import { Reservation } from "../../Domain/Entities/Reservation";
import { CosmosClientFactory } from "../Config/CosmosClientFactory";

export class CosmosReservationRepository implements IReservationRepository {
  private container = CosmosClientFactory.getReservationContainer();

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
      // Clean up Cosmos DB metadata fields before upserting
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
