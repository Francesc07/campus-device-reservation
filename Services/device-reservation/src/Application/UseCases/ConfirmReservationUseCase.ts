import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { IEventPublisher } from "../Interfaces/IEventPublisher";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";

/**
 * ConfirmReservationUseCase
 * 
 * Business logic for confirming a device reservation.
 * Updates the reservation status to Confirmed and publishes a
 * Reservation.Confirmed event to downstream services.
 * 
 * **Responsibilities:**
 * - Update reservation status to Confirmed
 * - Persist changes to database
 * - Publish Reservation.Confirmed event with full metadata
 * 
 * **Event Publishing:**
 * The published event includes device metadata for downstream services
 * to use without requiring additional API calls or database queries.
 * 
 * **Error Handling:**
 * - Database failures: Propagated to caller
 * - Event publishing failures: Propagated to caller (transactional)
 * 
 * @example
 * ```typescript
 * const useCase = new ConfirmReservationUseCase(repository, publisher);
 * await useCase.execute(reservation);
 * // Reservation now has status: Confirmed
 * // Reservation.Confirmed event published to Event Grid
 * ```
 */
export class ConfirmReservationUseCase {
  constructor(
    private reservationRepo: IReservationRepository,
    private eventPublisher: IEventPublisher
  ) {}

  /**
   * Confirms a reservation and publishes the confirmation event
   * 
   * @param reservation - The reservation to confirm
   * @throws {Error} If database update or event publishing fails
   */
  async execute(reservation: any): Promise<void> {
    console.log(`🔄 [ConfirmReservationUseCase] Confirming reservation: ${reservation.id}`);

    // Update reservation status
    reservation.status = ReservationStatus.Confirmed;
    reservation.updatedAt = new Date().toISOString();

    // Persist to database
    console.log(`💾 Updating reservation in database...`);
    await this.reservationRepo.update(reservation);
    console.log(`✅ Reservation updated in database`);

    // Prepare event data with denormalized metadata
    const eventData = {
      reservationId: reservation.id,
      deviceId: reservation.deviceId,
      userId: reservation.userId,
      deviceBrand: reservation.deviceBrand,
      deviceModel: reservation.deviceModel,
      userEmail: reservation.userEmail,
      startDate: reservation.startDate,
      dueDate: reservation.dueDate,
    };

    console.log(`📢 Publishing Reservation.Confirmed`, eventData);

    // Publish to Event Grid for downstream services
    await this.eventPublisher.publish({
      eventType: "Reservation.Confirmed",
      data: eventData
    });

    console.log(`✅ Reservation.Confirmed event published`);
  }
}
