// src/Infrastructure/CosmosReservationRepository.ts
import { CosmosClient } from "@azure/cosmos";
import { Reservation } from "../Domain/Entities/Reservation";

export class CosmosReservationRepository {
  private container;
  constructor() {
    const connectionString = process.env.COSMOS_DB_CONNECTION_STRING!;
    const databaseName = process.env.COSMOS_DB_DATABASE_NAME || "DeviceLoanDB";
    const containerName = process.env.COSMOS_DB_CONTAINER_NAME || "Reservations";
    
    const client = new CosmosClient(connectionString);
    const db = client.database(databaseName);
    this.container = db.container(containerName);
  }

  async create(reservation: Reservation): Promise<void> {
    await this.container.items.create(reservation);
  }

  async getByUser(userId: string): Promise<Reservation[]> {
    const { resources } = await this.container.items
      .query(`SELECT * FROM c WHERE c.userId = "${userId}"`)
      .fetchAll();
    return resources;
  }

  async cancel(reservationId: string): Promise<void> {
    const { resources } = await this.container.items
      .query(`SELECT * FROM c WHERE c.reservationId = "${reservationId}"`)
      .fetchAll();
    if (resources.length) {
      const res = resources[0];
      res.status = "cancelled";
      await this.container.item(reservationId, reservationId).replace(res);
    }
  }
}
