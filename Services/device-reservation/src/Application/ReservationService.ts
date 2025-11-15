import { randomUUID } from "crypto";
import { Reservation } from "../Domain/Entities/Reservation";
import { ReservationStatus } from "../Domain/Enums/ReservationStatus";
import { IReservationRepository } from "./Ports/IReservationRepository";

const ACTIVE_STATUS_VALUES = new Set<string>([
  ReservationStatus.Pending,
  ReservationStatus.Confirmed
].map((status) => status.toLowerCase()));

const isActiveStatus = (status: ReservationStatus | string): boolean =>
  ACTIVE_STATUS_VALUES.has(String(status).toLowerCase());

export class ReservationService {
  constructor(private readonly repo: IReservationRepository) {}

  async createReservation(userId: string, deviceId: string): Promise<Reservation> {
    if (!userId || !deviceId) {
      throw new Error("userId and deviceId are required");
    }

    const existingUserReservations = await this.repo.findByUser(userId);
    const hasActiveReservationForDevice = existingUserReservations.some(
      (reservation) => isActiveStatus(reservation.status) && reservation.deviceId === deviceId
    );

    if (hasActiveReservationForDevice) {
      throw new Error("User already has an active reservation for this device");
    }

    const activeForDevice = await this.repo.findActiveByDevice(deviceId);
    const pendingCount = activeForDevice.filter((res) => String(res.status).toLowerCase() === ReservationStatus.Pending.toLowerCase()).length;
    const status = activeForDevice.length === 0 ? ReservationStatus.Confirmed : ReservationStatus.Pending;
    const waitlistPosition = status === ReservationStatus.Pending ? pendingCount + 1 : undefined;

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(now.getDate() + 2);

    const reservation = new Reservation(
      randomUUID(),
      userId,
      deviceId,
      now.toISOString(),
      expiresAt.toISOString(),
      status,
      waitlistPosition
    );

    await this.repo.create(reservation);

    return reservation;
  }

  async cancelReservation(reservationId: string): Promise<Reservation> {
    const reservation = await this.repo.findById(reservationId);
    if (!reservation) {
      throw new Error("Reservation not found");
    }

    if (!isActiveStatus(reservation.status)) {
      return reservation;
    }

    reservation.status = ReservationStatus.Cancelled;
    reservation.waitlistPosition = undefined;
    await this.repo.update(reservation);

    await this.promoteNextReservation(reservation.deviceId);

    return reservation;
  }

  async listReservations(): Promise<Reservation[]> {
    return this.repo.list();
  }

  async listReservationsForUser(userId: string): Promise<Reservation[]> {
    return this.repo.findByUser(userId);
  }

  async getReservation(reservationId: string): Promise<Reservation | null> {
    return this.repo.findById(reservationId);
  }

  private async promoteNextReservation(deviceId: string): Promise<void> {
    const activeReservations = await this.repo.findActiveByDevice(deviceId);
    const pending = activeReservations
      .filter((reservation) => String(reservation.status).toLowerCase() === ReservationStatus.Pending.toLowerCase())
      .sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    if (pending.length === 0) {
      return;
    }

    const [promoted, ...remaining] = pending;
    promoted.status = ReservationStatus.Confirmed;
    promoted.waitlistPosition = undefined;
    await this.repo.update(promoted);

    for (let index = 0; index < remaining.length; index += 1) {
      const reservation = remaining[index];
      reservation.waitlistPosition = index + 1;
      await this.repo.update(reservation);
    }
  }
}
