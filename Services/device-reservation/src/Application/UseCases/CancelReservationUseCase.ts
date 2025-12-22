import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";
import { ReservationCancelledEvent } from "../../Domain/Events/ReservationCancelledEvent";
import { IEventPublisher } from "../Interfaces/IEventPublisher";

export class CancelReservationUseCase {
  constructor(
    private reservationRepo: IReservationRepository,
    private eventPublisher: IEventPublisher
  ) {}

  async execute(reservationId: string, userId: string, reason?: string, ctx?: any) {
    const log = (msg: string, ...args: any[]) => {
      if (ctx?.log) {
        ctx.log(msg, ...args);
      } else {
        console.log(msg, ...args);
      }
    };
    
    log(`🔄 [CancelReservationUseCase] Cancelling reservation: ${reservationId}, reason: ${reason || 'none'}`);
    
    const reservation = await this.reservationRepo.getById(reservationId);
    if (!reservation) {
      log(`⚠️ [CancelReservationUseCase] Reservation not found: ${reservationId}`);
      return;
    }

    reservation.status = ReservationStatus.Cancelled;
    reservation.updatedAt = new Date().toISOString();

    log(`💾 [CancelReservationUseCase] Updating reservation in database...`);
    await this.reservationRepo.update(reservation);
    log(`✅ [CancelReservationUseCase] Reservation updated in database`);

    const event: ReservationCancelledEvent = {
      eventType: "Reservation.Cancelled",
      reservationId,
      userId,
      deviceId: reservation.deviceId,
      deviceBrand: reservation.deviceBrand,
      deviceModel: reservation.deviceModel,
      userEmail: reservation.userEmail,
      reason,
      timestamp: new Date().toISOString()
    };

    log(`📢 [CancelReservationUseCase] Publishing Reservation.Cancelled event:`, JSON.stringify(event));
    await this.eventPublisher.publish(event);
    log(`✅ [CancelReservationUseCase] Reservation.Cancelled event published successfully`);
  }
}
