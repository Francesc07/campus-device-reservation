import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { ListReservationsDTO } from "../Dtos/ListReservationsDTO";
import { Reservation } from "../../Domain/Entities/Reservation";

export class ListReservationsUseCase {
  constructor(private readonly repository: IReservationRepository) {}

  execute(filter: ListReservationsDTO): Promise<Reservation[]> {
    if (filter.userId) {
      return this.repository.findByUser(filter.userId);
    }
    return this.repository.findAll();
  }
}
