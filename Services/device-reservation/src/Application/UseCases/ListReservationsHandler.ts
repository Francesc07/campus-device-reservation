import { Reservation } from "../../Domain/Entities/Reservation";
import { ReservationService } from "../ReservationService";

type ListReservationsFilter = {
	userId?: string;
};

export class ListReservationsHandler {
	constructor(private readonly service: ReservationService) {}

	execute(filter: ListReservationsFilter = {}): Promise<Reservation[]> {
		if (filter.userId) {
			return this.service.listReservationsForUser(filter.userId);
		}

		return this.service.listReservations();
	}
}
