import { CosmosReservationRepository } from "./Infrastructure/Persistence/CosmosReservationRepository";
import { EventPublisher } from "./Infrastructure/EventGrid/EventGridPublisher";

import { MarkReservationCollectedUseCase } from "./Application/UseCases/MarkReservationCollectedUseCase";
import { MarkReservationReturnedUseCase } from "./Application/UseCases/MarkReservationReturnedUseCase";

import { MarkReservationCollectedHandler } from "./Application/Handlers/MarkReservationCollectedHandler";
import { MarkReservationReturnedHandler } from "./Application/Handlers/MarkReservationReturnedHandler";


import { CreateReservationUseCase } from "./Application/UseCases/CreateReservationUseCase";
import { CancelReservationUseCase } from "./Application/UseCases/CancelReservationUseCase";
import { ListReservationsUseCase } from "./Application/UseCases/ListReservationsUseCase";

import { CreateReservationHandler } from "./Application/Handlers/CreateReservationHandler";
import { CancelReservationHandler } from "./Application/Handlers/CancelReservationHandler";
import { ListReservationsHandler } from "./Application/Handlers/ListReservationsHandler";

const repository = new CosmosReservationRepository();
const publisher = new EventPublisher();

export const appServices = {
  
  createReservationHandler: new CreateReservationHandler(
    new CreateReservationUseCase(repository, publisher)
  ),

  cancelReservationHandler: new CancelReservationHandler(
    new CancelReservationUseCase(repository, publisher)
  ),

  listReservationsHandler: new ListReservationsHandler(
    new ListReservationsUseCase(repository)
  ),

  markCollectedHandler: new MarkReservationCollectedHandler(
    new MarkReservationCollectedUseCase(repository, publisher)
  ),

  markReturnedHandler: new MarkReservationReturnedHandler(
    new MarkReservationReturnedUseCase(repository, publisher)
  )


};
