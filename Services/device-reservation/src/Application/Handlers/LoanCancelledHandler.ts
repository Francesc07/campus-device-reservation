import { InvocationContext } from "@azure/functions";
import { LoanCancelledEvent } from "../../Domain/Events/LoanCancelledEvent";
import { CancelReservationUseCase } from "../UseCases/CancelReservationUseCase";

export class LoanCancelledHandler {
  constructor(private cancelUseCase: CancelReservationUseCase) {}

  async handle(event: any, ctx: InvocationContext) {
    // Handle both reservationId (new) and id (legacy) fields
    const reservationId = event.reservationId || event.id;
    
    ctx.log("📩 Processing Loan.Cancelled event", event);
    ctx.log(`📝 Event details - reservationId: ${reservationId}, userId: ${event.userId}, reason: ${event.reason || 'none'}`);

    await this.cancelUseCase.execute(
      reservationId,
      event.userId,
      event.reason,
      ctx
    );

    ctx.log(`✅ Reservation cancelled successfully: ${reservationId}`);
  }
}
