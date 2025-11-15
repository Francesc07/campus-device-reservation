import { ReservationStatus } from "../Enums/ReservationStatus";

export interface Reservation {
  id: string;
  userId: string;
  deviceId: string;

  startDate: string;     
  dueDate: string;       

  status: ReservationStatus;

  createdAt: string;
  updatedAt: string;

  notes?: string;
}
