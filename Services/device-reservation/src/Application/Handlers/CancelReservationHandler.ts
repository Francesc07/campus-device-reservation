import { CancelReservationUseCase } from "../UseCases/CancelReservationUseCase";

export class CancelReservationHandler {
  constructor(private readonly useCase: CancelReservationUseCase) {}

  execute(reservationId: string) {
    return this.useCase.execute({ reservationId });
  }
}
