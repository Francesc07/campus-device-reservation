import { MarkReservationReturnedUseCase } from "../UseCases/MarkReservationReturnedUseCase";

export class MarkReservationReturnedHandler {
  constructor(private readonly useCase: MarkReservationReturnedUseCase) {}

  execute(reservationId: string) {
    return this.useCase.execute(reservationId);
  }
}
