import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { IEventPublisher } from "../Interfaces/IEventPublisher";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";

export class ConfirmReservationUseCase {
  constructor(
    private reservationRepo: IReservationRepository,
    private eventPublisher: IEventPublisher
  ) {}

  async execute(reservation: any): Promise<void> {
    console.log(`🔄 [ConfirmReservationUseCase] Confirming reservation: ${reservation.id}`);

    reservation.status = ReservationStatus.Confirmed;
    reservation.updatedAt = new Date().toISOString();

    // Save update
    console.log(`💾 Updating reservation in database...`);
    await this.reservationRepo.update(reservation);
    console.log(`✅ Reservation updated in database`);

    // Publish reservation event
    const eventData = {
      reservationId: reservation.id,
      deviceId: reservation.deviceId,
      userId: reservation.userId,
      startDate: reservation.startDate,
      dueDate: reservation.dueDate,
    };

    console.log(`📢 Publishing Reservation.Confirmed`, eventData);

    await this.eventPublisher.publish({
      eventType: "Reservation.Confirmed",
      data: eventData
    });

    console.log(`✅ Reservation.Confirmed event published`);
  }
}
