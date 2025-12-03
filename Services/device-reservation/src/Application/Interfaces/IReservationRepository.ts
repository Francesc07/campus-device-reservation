import { Reservation } from "../../Domain/Entities/Reservation";

export interface IReservationRepository {
  create(reservation: Reservation): Promise<void>;
  update(reservation: Reservation): Promise<void>;
  getById(id: string): Promise<Reservation | null>;
}
