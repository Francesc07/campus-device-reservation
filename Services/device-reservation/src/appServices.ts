/**
 * appServices.ts.
 */

import { EventGridPublisher } from "./Infrastructure/EventGrid/EventGridPublisher";
import { CosmosReservationRepository } from "./Infrastructure/Persistence/CosmosReservationRepository";

// Ports
import { IReservationRepository } from "./Application/Interfaces/IReservationRepository";
import { IEventPublisher } from "./Application/Interfaces/IEventPublisher";

// Use cases
import { ConfirmReservationUseCase } from "./Application/UseCases/ConfirmReservationUseCase";
import { CancelReservationUseCase } from "./Application/UseCases/CancelReservationUseCase";

// Handlers
import { LoanCreatedHandler } from "./Application/Handlers/LoanCreatedHandler";
import { LoanCancelledHandler } from "./Application/Handlers/LoanCancelledHandler";

// Environment
import { environment } from "./Infrastructure/Config/environment";

/* -------------------------------------------------------
   REPOSITORIES
-------------------------------------------------------- */

const reservationRepo: IReservationRepository =
  new CosmosReservationRepository();

/* -------------------------------------------------------
   EVENT PUBLISHER (Reservation → Confirmation)
-------------------------------------------------------- */

const eventPublisher: IEventPublisher = new EventGridPublisher(
  environment.eventGrid.confirmEndpoint,
  environment.eventGrid.confirmKey
);

/* -------------------------------------------------------
   USE CASES
-------------------------------------------------------- */

const confirmReservationUseCase = new ConfirmReservationUseCase(
  reservationRepo,
  eventPublisher
);

const cancelReservationUseCase = new CancelReservationUseCase(
  reservationRepo,
  eventPublisher
);

/* -------------------------------------------------------
   HANDLERS (Loan → Reservation)
-------------------------------------------------------- */

const loanCreatedHandler = new LoanCreatedHandler(
  reservationRepo,
  confirmReservationUseCase
);

const loanCancelledHandler = new LoanCancelledHandler(
  cancelReservationUseCase
);

/* -------------------------------------------------------
   EXPORT ALL SERVICES
-------------------------------------------------------- */

export const appServices = {
  reservationRepo,

  eventPublisher,

  confirmReservationUseCase,
  cancelReservationUseCase,

  loanCreatedHandler,
  loanCancelledHandler,
};
