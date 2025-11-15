import { MarkReservationCollectedUseCase } from "../UseCases/MarkReservationCollectedUseCase";

export class MarkReservationCollectedHandler {
  constructor(private readonly useCase: MarkReservationCollectedUseCase) {}

  execute(reservationId: string) {
    return this.useCase.execute(reservationId);
  }
}
