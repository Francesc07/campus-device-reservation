import { IEventPublisher } from "../../Application/Interfaces/IEventPublisher";
import {
  EventGridPublisherClient,
  AzureKeyCredential
} from "@azure/eventgrid";

import { randomUUID } from "crypto";

export class EventGridPublisher implements IEventPublisher {

  private client: EventGridPublisherClient<any>;

  constructor(endpoint: string, key: string) {
    this.client = new EventGridPublisherClient<any>(
      endpoint,
      "CloudEvent",
      new AzureKeyCredential(key)
    );
  }

  async publish(event: { eventType: string; data: any }): Promise<void> {
    await this.client.send([{
      id: randomUUID(),
      type: event.eventType,
      source: "reservation-service",
      time: new Date().toISOString(),
      data: event.data
    }]);
  }
}
