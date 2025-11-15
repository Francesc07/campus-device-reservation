import { CosmosClient } from "@azure/cosmos";
import { Reservation } from "../../Domain/Entities/Reservation";
import { IReservationRepository } from "../../Application/Interfaces/IReservationRepository";

export class CosmosReservationRepository implements IReservationRepository {
  private container;

  constructor() {
    const client = new CosmosClient(process.env.COSMOS_CONNECTION!);
    const db = client.database("reservation-db");
    this.container = db.container("reservations");
  }

  async create(reservation: Reservation): Promise<Reservation> {
    const { resource } = await this.container.items.create(reservation);
    return resource as Reservation;
  }

  async findById(id: string): Promise<Reservation | null> {
    const query = {
      query: "SELECT * FROM c WHERE c.id = @id",
      parameters: [{ name: "@id", value: id }],
    };

    const { resources } = await this.container.items.query(query).fetchAll();

    return resources.length ? (resources[0] as Reservation) : null;
  }

  async findByUser(userId: string): Promise<Reservation[]> {
    const query = {
      query: "SELECT * FROM c WHERE c.userId = @userId",
      parameters: [{ name: "@userId", value: userId }],
    };

    const { resources } = await this.container.items.query(query).fetchAll();

    return resources as Reservation[];
  }

  async findAll(): Promise<Reservation[]> {
    const { resources } = await this.container.items.readAll().fetchAll();
    return resources as Reservation[];
  }

  async update(reservation: Reservation): Promise<Reservation> {
    const { resource } = await this.container.items.upsert(reservation);
    return resource as Reservation;
  }

  async delete(id: string): Promise<void> {
    const found = await this.findById(id);
    if (!found) return;

    await this.container.item(found.id, found.userId).delete();
  }
}
