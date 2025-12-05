import { IEventPublisher } from "../../Application/Interfaces/IEventPublisher";
import {
  EventGridPublisherClient,
  AzureKeyCredential,
  EventGridEvent
} from "@azure/eventgrid";
import { randomUUID } from "crypto";

export class EventGridPublisher implements IEventPublisher {

  // 👇 Correct type: publisher handles events whose data is unknown
  private client: EventGridPublisherClient<any>;

  constructor(endpoint: string, key: string) {
    this.client = new EventGridPublisherClient<any>(
      endpoint,
      "EventGrid", 
      new AzureKeyCredential(key)
    );
  }

  async publish(event: { eventType: string; data: any }): Promise<void> {
    // 👇 Note the required generic for EventGridEvent
    const gridEvent: EventGridEvent<unknown> = {
      id: randomUUID(),
      eventType: event.eventType,
      subject: "reservation/event", //change later to dynamic event.eventType or /resertion/${event.eventType}
      eventTime: new Date(),
      data: event.data,
      dataVersion: "1.0"
    };

    console.log(`📤 [EventGridPublisher] Preparing to publish event:`);
    console.log(`   Event Type: ${event.eventType}`);
    console.log(`   Event ID: ${gridEvent.id}`);
    console.log(`   Subject: ${gridEvent.subject}`);
    console.log(`   Data:`, JSON.stringify(event.data, null, 2));

    try {
      console.log(`🔗 [EventGridPublisher] Sending to Event Grid endpoint...`);
      await this.client.send([gridEvent]);
      console.log(`✅ [EventGridPublisher] Event published successfully: ${event.eventType}`);
      console.log(`   Event ID: ${gridEvent.id}`);
    } catch (error) {
      console.error(`❌ [EventGridPublisher] Failed to publish event: ${event.eventType}`);
      console.error(`   Error:`, error);
      throw error;
    }
  }
}
