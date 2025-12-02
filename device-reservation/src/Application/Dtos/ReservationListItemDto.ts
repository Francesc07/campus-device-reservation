import { ReservationStatus } from "../../Domain/Enums/ReservationStatus";

export interface ReservationListItemDto {
  reservationId: string;
  deviceId: string;
  status: ReservationStatus;
  startDate: string;
  dueDate: string;
}
