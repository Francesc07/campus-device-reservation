import { Reservation } from "../../Domain/Entities/Reservation";

export interface IReservationRepository {
  create(reservation: Reservation): Promise<Reservation>;

  findById(id: string): Promise<Reservation | null>;

  findByUser(userId: string): Promise<Reservation[]>;

  findAll(): Promise<Reservation[]>;

  update(reservation: Reservation): Promise<Reservation>;

  delete(id: string): Promise<void>;
}
