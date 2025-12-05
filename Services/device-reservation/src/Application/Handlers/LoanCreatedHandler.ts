import { InvocationContext } from "@azure/functions";
import { LoanCreatedEvent } from "../../Domain/Events/LoanCreatedEvent";
import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";
import { Reservation } from "../../Domain/Entities/Reservation";
import { STANDARD_LOAN_DAYS } from "../../Domain/Constants/LoanRules";
import { ConfirmReservationUseCase } from "../UseCases/ConfirmReservationUseCase";

export class LoanCreatedHandler {
  constructor(
    private reservationRepo: IReservationRepository,
    private confirmUseCase: ConfirmReservationUseCase
  ) {}

  async handle(event: LoanCreatedEvent, ctx: InvocationContext) {
    ctx.log("📩 Processing Loan.Created event", event);

    // The event.data contains the loan object with 'id' field (which is the reservationId)
    const reservationId = (event as any).reservationId || (event as any).id;
    
    ctx.log(`📝 [LoanCreatedHandler] Extracted reservationId: ${reservationId}`);

    const startDate = new Date(event.startDate);
    const dueDate = new Date(startDate);
    dueDate.setDate(startDate.getDate() + STANDARD_LOAN_DAYS);

    const now = new Date().toISOString();

    // Construct domain reservation
    const reservation: Reservation = {
      id: reservationId,
      userId: event.userId,
      deviceId: event.deviceId,
      startDate: startDate.toISOString(),
      dueDate: dueDate.toISOString(),
      status: ReservationStatus.Pending,
      createdAt: now,
      updatedAt: now
    };

    ctx.log("🏗️ [LoanCreatedHandler] Creating reservation...", { id: reservation.id, userId: reservation.userId, deviceId: reservation.deviceId });
    
    // Check if reservation already exists (idempotent handling)
    const existingReservation = await this.reservationRepo.getById(reservation.id);
    if (existingReservation) {
      ctx.log(`⚠️ [LoanCreatedHandler] Reservation ${reservation.id} already exists - skipping creation (idempotent)`);
      // Still confirm it in case the previous confirmation failed
      try {
        await this.confirmUseCase.execute(existingReservation);
        ctx.log("✅ [LoanCreatedHandler] Reservation confirmed (idempotent)", existingReservation.id);
      } catch (error) {
        ctx.error(`❌ [LoanCreatedHandler] Failed to confirm existing reservation`, error);
        throw error;
      }
      return;
    }
    
    // Store reservation
    await this.reservationRepo.create(reservation);
    ctx.log("✅ [LoanCreatedHandler] Reservation created in Cosmos DB", reservation);

    ctx.log("🔄 [LoanCreatedHandler] Confirming reservation...");
    await this.confirmUseCase.execute(reservation);
    ctx.log("✅ [LoanCreatedHandler] Reservation confirmed and event published", reservation.id);
  }

}
