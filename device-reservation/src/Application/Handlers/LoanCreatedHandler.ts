import { InvocationContext } from "@azure/functions";
import { LoanCreatedEvent } from "../../Domain/Events/LoanCreatedEvent";
import { IReservationRepository } from "../Interfaces/IReservationRepository";
import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";
import { Reservation } from "../../Domain/Entities/Reservation";
import { STANDARD_LOAN_DAYS } from "../../Domain/Constants/LoanRules";
import { ConfirmReservationUseCase } from "../UseCases/ConfirmReservationUseCase";

export class LoanCreatedHandler {
  constructor(
    private reservationRepo: IReservationRepository,
    private confirmUseCase: ConfirmReservationUseCase
  ) {}

  async handle(event: LoanCreatedEvent, ctx: InvocationContext) {
    ctx.log("📩 Processing Loan.Created event", event);

    const startDate = new Date(event.startDate);
    const dueDate = new Date(startDate);
    dueDate.setDate(startDate.getDate() + STANDARD_LOAN_DAYS);

    const now = new Date().toISOString();

    // Construct domain reservation
    const reservation: Reservation = {
      id: event.reservationId,
      userId: event.userId,
      deviceId: event.deviceId,
      startDate: startDate.toISOString(),
      dueDate: dueDate.toISOString(),
      status: ReservationStatus.Pending,
      createdAt: now,
      updatedAt: now
    };

    // Store reservation
    await this.reservationRepo.create(reservation);
    ctx.log("Reservation created", reservation);

    await this.confirmUseCase.execute(reservation);
    ctx.log("Reservation confirmed", reservation.id);
  }

}
