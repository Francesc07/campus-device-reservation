import { CreateReservationUseCase } from "../UseCases/CreateReservationUseCase";

export class CreateReservationHandler {
  constructor(private readonly useCase: CreateReservationUseCase) {}

  execute(userId: string, deviceId: string) {
    return this.useCase.execute({ userId, deviceId });
  }
}
