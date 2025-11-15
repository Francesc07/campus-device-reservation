import { EventPublisher } from "../../Infrastructure/EventGrid/EventGridPublisher";

export class CancelReservationUseCase {
  constructor(
    private readonly repository: IReservationRepository,
    private readonly publisher: EventPublisher
  ) {}

  async execute(data: CancelReservationDTO) {
    const { reservationId } = data;

    const existing = await this.repository.findById(reservationId);
    if (!existing) throw new Error("Reservation not found");

    existing.status = ReservationStatus.Cancelled;
    existing.updatedAt = new Date().toISOString();

    const updated = await this.repository.update(existing);

    // 🔥 Emit outbound event
    await this.publisher.publishReservationEvent("Reservation.Cancelled", updated);

    return updated;
  }
}
