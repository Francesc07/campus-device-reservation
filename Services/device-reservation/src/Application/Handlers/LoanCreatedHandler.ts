import { InvocationContext } from "@azure/functions";
import { LoanCreatedEvent } from "../../Domain/Events/LoanCreatedEvent";
import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";
import { Reservation } from "../../Domain/Entities/Reservation";
import { STANDARD_LOAN_DAYS } from "../../Domain/Constants/LoanRules";
import { ConfirmReservationUseCase } from "../UseCases/ConfirmReservationUseCase";

/**
 * LoanCreatedHandler
 * 
 * Handles the Loan.Created event from the Device Loan Service.
 * Creates a new device reservation and confirms it by publishing a
 * Reservation.Confirmed event to downstream services.
 * 
 * **Key Features:**
 * - Idempotent: Uses loan ID as reservation ID to prevent duplicates
 * - Calculates due date based on business rules (14 days by default)
 * - Includes device metadata for denormalization
 * - Automatically confirms reservation after creation
 * 
 * **Event Flow:**
 * 1. Receives Loan.Created event via Event Grid
 * 2. Checks if reservation already exists (idempotency)
 * 3. Creates reservation in Cosmos DB with Pending status
 * 4. Confirms reservation and publishes Reservation.Confirmed event
 * 
 * **Error Handling:**
 * - Database errors: Propagated to Event Grid for automatic retry
 * - Duplicate events: Handled gracefully (idempotent)
 * - Missing data: Validated in event schema
 * 
 * @example
 * ```typescript
 * const handler = new LoanCreatedHandler(repository, confirmUseCase);
 * await handler.handle(loanCreatedEvent, context);
 * ```
 */
export class LoanCreatedHandler {
  constructor(
    private reservationRepo: IReservationRepository,
    private confirmUseCase: ConfirmReservationUseCase
  ) {}

  /**
   * Handles the Loan.Created event
   * 
   * @param event - The loan created event from Event Grid
   * @param ctx - Azure Functions invocation context for logging
   * @throws {Error} If database operation fails (allows Event Grid to retry)
   */
  async handle(event: LoanCreatedEvent, ctx: InvocationContext) {
    ctx.log("📩 Processing Loan.Created event", event);

    // Extract reservation ID (same as loan ID for idempotency)
    const reservationId = (event as any).reservationId || (event as any).id;
    
    ctx.log(`📝 [LoanCreatedHandler] Extracted reservationId: ${reservationId}`);

    // Calculate due date based on business rules
    const startDate = new Date(event.startDate);
    const dueDate = new Date(startDate);
    dueDate.setDate(startDate.getDate() + STANDARD_LOAN_DAYS);

    const now = new Date().toISOString();

    // Construct reservation entity with denormalized metadata
    const reservation: Reservation = {
      id: reservationId,
      userId: event.userId,
      deviceId: event.deviceId,
      deviceBrand: event.deviceBrand,
      deviceModel: event.deviceModel,
      userEmail: event.userEmail,
      startDate: startDate.toISOString(),
      dueDate: dueDate.toISOString(),
      status: ReservationStatus.Pending,
      createdAt: now,
      updatedAt: now
    };

    ctx.log("🏗️ [LoanCreatedHandler] Creating reservation...", { 
      id: reservation.id, 
      userId: reservation.userId, 
      deviceId: reservation.deviceId 
    });
    
    // Check if reservation already exists (idempotent handling)
    const existingReservation = await this.reservationRepo.getById(reservation.id);
    if (existingReservation) {
      ctx.log(`⚠️ [LoanCreatedHandler] Reservation ${reservation.id} already exists - skipping creation (idempotent)`);
      
      // Still attempt confirmation in case previous confirmation failed
      try {
        await this.confirmUseCase.execute(existingReservation);
        ctx.log("✅ [LoanCreatedHandler] Reservation confirmed (idempotent)", existingReservation.id);
      } catch (error) {
        ctx.error(`❌ [LoanCreatedHandler] Failed to confirm existing reservation`, error);
        throw error;
      }
      return;
    }
    
    // Create new reservation in database
    await this.reservationRepo.create(reservation);
    ctx.log("✅ [LoanCreatedHandler] Reservation created in Cosmos DB", reservation);

    // Confirm reservation and publish event
    ctx.log("🔄 [LoanCreatedHandler] Confirming reservation...");
    await this.confirmUseCase.execute(reservation);
    ctx.log("✅ [LoanCreatedHandler] Reservation confirmed and event published", reservation.id);
  }
}
