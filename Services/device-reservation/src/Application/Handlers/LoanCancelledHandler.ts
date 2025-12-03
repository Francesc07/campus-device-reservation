import { InvocationContext } from "@azure/functions";
import { LoanCancelledEvent } from "../../Domain/Events/LoanCancelledEvent";
import { CancelReservationUseCase } from "../UseCases/CancelReservationUseCase";

export class LoanCancelledHandler {
  constructor(private cancelUseCase: CancelReservationUseCase) {}

  async handle(event: LoanCancelledEvent, ctx: InvocationContext) {
    ctx.log("Processing Loan.Cancelled event", event);

    await this.cancelUseCase.execute(
      event.reservationId,
      event.userId,
      event.reason
    );
  }
}
