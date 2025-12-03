import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { IEventPublisher } from "../Interfaces/IEventPublisher";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";

export class ConfirmReservationUseCase {
  constructor(
    private reservationRepo: IReservationRepository,
    private eventPublisher: IEventPublisher
  ) {}

  async execute(reservation: any): Promise<void> {
    reservation.status = ReservationStatus.Confirmed;
    reservation.updatedAt = new Date().toISOString();

    // Save update
    await this.reservationRepo.update(reservation);

    // Publish ONE unified confirmation event
    await this.eventPublisher.publish({
      eventType: "Reservation.Confirmed",
      data: {
        reservationId: reservation.id,
        deviceId: reservation.deviceId,
        userId: reservation.userId,
        startDate: reservation.startDate,
        dueDate: reservation.dueDate
      }
    });
  }
}
