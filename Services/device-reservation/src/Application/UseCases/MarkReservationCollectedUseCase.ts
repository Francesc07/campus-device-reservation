import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";
import { EventPublisher } from "../../Infrastructure/EventGrid/EventGridPublisher";

export class MarkReservationCollectedUseCase {
  constructor(
    private readonly repository: IReservationRepository,
    private readonly publisher: EventPublisher
  ) {}

  async execute(reservationId: string) {
    const reservation = await this.repository.findById(reservationId);
    if (!reservation) throw new Error("Reservation not found");

    reservation.status = ReservationStatus.Collected;
    reservation.updatedAt = new Date().toISOString();

    const updated = await this.repository.update(reservation);

    // 🔥 OUTBOUND EVENT
    await this.publisher.publishReservationEvent("Reservation.Collected", updated);

    return updated;
  }
}
