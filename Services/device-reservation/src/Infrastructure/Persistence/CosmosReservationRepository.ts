import { CosmosClient } from "@azure/cosmos";
import { Reservation } from "../../Domain/Entities/Reservation";
import { IReservationRepository } from "../../Application/Ports/IReservationRepository";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";

export class CosmosReservationRepository implements IReservationRepository {
  private container;

  constructor() {
    const client = new CosmosClient(process.env.COSMOS_CONNECTION!);
    const db = client.database("reservation-db");
    this.container = db.container("reservations");
  }

  async create(res: Reservation): Promise<void> {
    await this.container.items.create(res);
  }

  async findById(id: string): Promise<Reservation | null> {
    try {
      const { resource } = await this.container.item(id, id).read();
      return resource as Reservation;
    } catch {
      return null;
    }
  }

  async findByUser(userId: string): Promise<Reservation[]> {
    const query = `SELECT * FROM c WHERE c.userId=@u`;
    const { resources } = await this.container.items.query({
      query,
      parameters: [{ name: "@u", value: userId }],
    }).fetchAll();

    return resources as Reservation[];
  }

  async cancel(id: string): Promise<void> {
    const item = await this.findById(id);
    if (!item) return;

    item.status = ReservationStatus.Cancelled;
    await this.update(item);
  }

  async list(): Promise<Reservation[]> {
    const { resources } = await this.container.items.readAll().fetchAll();
    return resources as Reservation[];
  }

  async update(res: Reservation): Promise<void> {
    await this.container.items.upsert(res);
  }

  async findActiveByDevice(deviceId: string): Promise<Reservation[]> {
    const query = `
      SELECT * FROM c 
      WHERE c.deviceId=@d AND (c.status="Pending" OR c.status="Confirmed")
    `;
    const { resources } = await this.container.items.query({
      query,
      parameters: [{ name: "@d", value: deviceId }],
    }).fetchAll();

    return resources as Reservation[];
  }
}
