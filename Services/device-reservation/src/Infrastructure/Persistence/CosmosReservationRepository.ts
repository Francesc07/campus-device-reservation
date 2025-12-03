import { IReservationRepository } from "../../Application/Interfaces/IReservationRepository";
import { Reservation } from "../../Domain/Entities/Reservation";
import { CosmosClientFactory } from "../Config/CosmosClientFactory";

export class CosmosReservationRepository implements IReservationRepository {
  private container = CosmosClientFactory.getReservationContainer();

  async create(reservation: Reservation): Promise<void> {
    await this.container.items.create(reservation);
  }

  async update(reservation: Reservation): Promise<void> {
    await this.container.items.upsert(reservation);
  }

  async getById(id: string): Promise<Reservation | null> {
    try {
      const response = await this.container.item(id, id).read<Reservation>();
      return response.resource || null;
    } catch {
      return null;
    }
  }
}
