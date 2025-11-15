import { CosmosReservationRepository } from "./Infrastructure/Persistence/CosmosReservationRepository";
import { ReservationService } from "./Application/ReservationService";
import { CreateReservationHandler } from "./Application/UseCases/CreateReservationHandler";
import { CancelReservationHandler } from "./Application/UseCases/CancelReservationHandler";
import { ListReservationsHandler } from "./Application/UseCases/ListReservationsHandler";

const reservationRepository = new CosmosReservationRepository();
const reservationService = new ReservationService(reservationRepository);

export const appServices = {
  reservationRepository,
  reservationService,
  createReservationHandler: new CreateReservationHandler(reservationService),
  cancelReservationHandler: new CancelReservationHandler(reservationService),
  listReservationsHandler: new ListReservationsHandler(reservationService)
};
