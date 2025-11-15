import { Reservation } from "../../Domain/Entities/Reservation";
import { ReservationService } from "../ReservationService";

export class CancelReservationHandler {
	constructor(private readonly service: ReservationService) {}

	execute(reservationId: string): Promise<Reservation> {
		return this.service.cancelReservation(reservationId);
	}
}
