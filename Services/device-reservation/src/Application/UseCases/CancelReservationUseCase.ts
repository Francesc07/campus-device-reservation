import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";
import { ReservationCancelledEvent } from "../../Domain/Events/ReservationCancelledEvent";
import { IEventPublisher } from "../Interfaces/IEventPublisher";

export class CancelReservationUseCase {
  constructor(
    private reservationRepo: IReservationRepository,
    private eventPublisher: IEventPublisher
  ) {}

  async execute(reservationId: string, userId: string, reason?: string) {
    const reservation = await this.reservationRepo.getById(reservationId);
    if (!reservation) return;

    reservation.status = ReservationStatus.Cancelled;
    reservation.updatedAt = new Date().toISOString();

    await this.reservationRepo.update(reservation);

    const event: ReservationCancelledEvent = {
      eventType: "Reservation.Cancelled",
      reservationId,
      userId,
      deviceId: reservation.deviceId,
      reason,
      timestamp: new Date().toISOString()
    };

    await this.eventPublisher.publish(event);
  }
}
