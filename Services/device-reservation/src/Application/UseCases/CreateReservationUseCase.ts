import { v4 as uuidv4 } from "uuid";
import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { Reservation } from "../../Domain/Entities/Reservation";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";
import { STANDARD_LOAN_DAYS } from "../../Domain/Constants/LoanRules";
import { CreateReservationDTO } from "../Dtos/CreateReservationDTO";

export class CreateReservationUseCase {
  constructor(private readonly repository: IReservationRepository) {}

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
      id: uuidv4(),
      userId,
      deviceId,
      startDate,
      dueDate: due.toISOString(),
      status: ReservationStatus.Pending,
      createdAt: startDate,
      updatedAt: startDate,
    };

    return await this.repository.create(reservation);
  }
}
