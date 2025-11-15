import { ReservationService } from "../ReservationService";

export class CreateReservationHandler {
  constructor(private readonly service: ReservationService) {}

  async execute(userId: string, deviceId: string) {
    return this.service.createReservation(userId, deviceId);
  }
}
