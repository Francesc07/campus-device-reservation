import { EventPublisher } from "../../Infrastructure/EventGrid/EventGridPublisher";
import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { CreateReservationDTO } from "../Dtos/CreateReservationDTO";
import { Reservation } from "../../Domain/Entities/Reservation";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";
import { STANDARD_LOAN_DAYS } from "../../Domain/Constants/LoanRules";
import { randomUUID } from "crypto";

export class CreateReservationUseCase {
  constructor(
    private readonly repository: IReservationRepository,
    private readonly publisher: EventPublisher
  ) {}

  async execute(data: CreateReservationDTO): Promise<Reservation> {
    const { userId, deviceId } = data;

    if (!userId || !deviceId) {
      throw new Error("userId and deviceId are required");
    }

    const now = new Date();
    const startDate = now.toISOString();

    const due = new Date(now);
    due.setDate(due.getDate() + STANDARD_LOAN_DAYS);

    const reservation: Reservation = {
      id: randomUUID(),
      userId,
      deviceId,
      startDate,
      dueDate: due.toISOString(),
      status: ReservationStatus.Pending,
      createdAt: startDate,
      updatedAt: startDate,
    };

    const saved = await this.repository.create(reservation);

    // 🔥 Emit outbound event
    await this.publisher.publishReservationEvent("Reservation.Confirmed", saved);

    return saved;
  }
}
