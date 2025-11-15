import { CosmosReservationRepository } from "./Infrastructure/Persistence/CosmosReservationRepository";

import { CreateReservationUseCase } from "./Application/UseCases/CreateReservationUseCase";
import { CancelReservationUseCase } from "./Application/UseCases/CancelReservationUseCase";
import { ListReservationsUseCase } from "./Application/UseCases/ListReservationsUseCase";

import { CreateReservationHandler } from "./Application/Handlers/CreateReservationHandler";
import { CancelReservationHandler } from "./Application/Handlers/CancelReservationHandler";
import { ListReservationsHandler } from "./Application/Handlers/ListReservationsHandler";

const repository = new CosmosReservationRepository();

export const appServices = {
  createReservationHandler: new CreateReservationHandler(
    new CreateReservationUseCase(repository)
  ),
  cancelReservationHandler: new CancelReservationHandler(
    new CancelReservationUseCase(repository)
  ),
  listReservationsHandler: new ListReservationsHandler(
    new ListReservationsUseCase(repository)
  ),
};
