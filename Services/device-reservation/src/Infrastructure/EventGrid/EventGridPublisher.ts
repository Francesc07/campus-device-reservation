import { EventGridPublisherClient, AzureKeyCredential } from "@azure/eventgrid";
import { Reservation } from "../../Domain/Entities/Reservation";

export class EventPublisher {
  private client: EventGridPublisherClient;

  constructor() {
    this.client = new EventGridPublisherClient(
      process.env.EVENTGRID_ENDPOINT!,
      "EventGrid",
      new AzureKeyCredential(process.env.EVENTGRID_KEY!)
    );
  }

  async publishReservationEvent(eventType: string, reservation: Reservation) {
    await this.client.send([
      {
        id: crypto.randomUUID(),
        eventType,
        subject: `reservation/${reservation.id}`,
        data: reservation,
        dataVersion: "1.0",
        eventTime: new Date().toISOString(),
      },
    ]);
  }
}
