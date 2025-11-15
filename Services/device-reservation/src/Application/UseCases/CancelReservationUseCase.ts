import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { CancelReservationDTO } from "../Dtos/CancelReservationDTO";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";

export class CancelReservationUseCase {
  constructor(private readonly repository: IReservationRepository) {}

  async execute(data: CancelReservationDTO) {
    const { reservationId } = data;

    const found = await this.repository.findById(reservationId);
    if (!found) throw new Error("Reservation not found");

    found.status = ReservationStatus.Cancelled;
    found.updatedAt = new Date().toISOString();

    return await this.repository.update(found);
  }
}
