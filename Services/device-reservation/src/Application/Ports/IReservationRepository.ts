// src/Application/ports/ReservationRepository.ts

import { Reservation } from "../../Domain/Reservation";

/**
 * Port (interface) that defines how the Application layer
 * talks to whatever persistence mechanism we use (Cosmos DB).
 *
 * Infrastructure will implement this with a Cosmos adapter.
 */
export interface ReservationRepository {
  create(reservation: Reservation): Promise<Reservation>;

  findById(id: string): Promise<Reservation | null>;

  findByUser(userId: string): Promise<Reservation[]>;

  update(reservation: Reservation): Promise<Reservation>;
}
