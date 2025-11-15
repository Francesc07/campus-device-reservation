// src/Application/useCases/CreateReservationUseCase.ts

import { v4 as uuidv4 } from "uuid";
import {
  Reservation,
  ReservationStatus,
  STANDARD_LOAN_DAYS,
} from "../../domain/entities/Reservation";
import { ReservationRepository } from "../ports/ReservationRepository";

// Request DTO coming from API layer (HTTP function).
export interface CreateReservationRequest {
  userId: string;
  deviceId: string;

  /**
   * Optional requested start date (ISO string).
   * If not provided, we default to "now".
   */
  requestedFromDate?: string;

  // Later we can add: notes, deviceModelId, etc.
}

// Response DTO we send back to API layer.
export interface CreateReservationResponse {
  reservation: Reservation;
}

/**
 * Use case for creating a new reservation.
 * This enforces the standard 2-day loan rule.
 */
export class CreateReservationUseCase {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  async execute(
    request: CreateReservationRequest
  ): Promise<CreateReservationResponse> {
    // Basic validation – API layer should also validate, but
    // domain/service keeps essential guards.
    if (!request.userId || !request.deviceId) {
      throw new Error("userId and deviceId are required to create a reservation.");
    }

    const now = new Date();

    let startDate = now;
    if (request.requestedFromDate) {
      const parsed = new Date(request.requestedFromDate);
      if (isNaN(parsed.getTime())) {
        throw new Error("Invalid requestedFromDate. Must be a valid ISO date string.");
      }
      startDate = parsed;
    }

    // Enforce standard loan duration (2 days).
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + STANDARD_LOAN_DAYS);

    const timestamp = now.toISOString();

    const reservation: Reservation = {
      id: uuidv4(),
      userId: request.userId,
      deviceId: request.deviceId,
      startDate: startDate.toISOString(),
      dueDate: dueDate.toISOString(),
      status: ReservationStatus.Pending,
      createdAt: timestamp,
      updatedAt: timestamp,
      // notes: request.notes (if you add later)
    };

    // Save to repository (Cosmos adapter will implement this).
    const saved = await this.reservationRepository.create(reservation);

    return { reservation: saved };
  }
}
