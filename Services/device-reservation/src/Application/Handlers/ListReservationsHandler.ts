import { ListReservationsUseCase } from "../UseCases/ListReservationsUseCase";

export class ListReservationsHandler {
  constructor(private readonly useCase: ListReservationsUseCase) {}

  execute(filter: { userId?: string } = {}) {
    return this.useCase.execute(filter);
  }
}
