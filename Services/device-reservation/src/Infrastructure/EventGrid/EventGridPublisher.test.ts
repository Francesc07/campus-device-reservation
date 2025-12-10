import { EventGridPublisher } from "./EventGridPublisher";

// Mock the Azure Event Grid client
const mockSend = jest.fn().mockResolvedValue(undefined);

jest.mock("@azure/eventgrid", () => {
  return {
    EventGridPublisherClient: jest.fn().mockImplementation(() => {
      return {
        send: mockSend,
      };
    }),
    AzureKeyCredential: jest.fn(),
  };
});

describe("EventGridPublisher", () => {
  let publisher: EventGridPublisher;
  const mockEndpoint = "https://test-topic.eventgrid.azure.net/api/events";
  const mockKey = "test-key-123";

  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockClear();
    publisher = new EventGridPublisher(mockEndpoint, mockKey);
  });

  it("should create publisher with endpoint and key", () => {
    expect(publisher).toBeDefined();
  });

  it("should publish event with correct EventGrid schema format", async () => {
    const event = {
      eventType: "Reservation.Confirmed",
      data: {
        reservationId: "res-123",
        deviceId: "device-456",
        userId: "user-789",
      },
    };

    await publisher.publish(event);
    
    expect(mockSend).toHaveBeenCalledWith([
      expect.objectContaining({
        id: expect.any(String),
        eventType: "Reservation.Confirmed",
        subject: "reservation/event",
        eventTime: expect.any(Date),
        dataVersion: "1.0",
        data: {
          reservationId: "res-123",
          deviceId: "device-456",
          userId: "user-789",
        },
      }),
    ]);
  });

  it("should handle different event types", async () => {
    const cancelEvent = {
      eventType: "Reservation.Cancelled",
      data: {
        reservationId: "res-999",
        reason: "User cancelled",
      },
    };

    await publisher.publish(cancelEvent);

    expect(mockSend).toHaveBeenCalledWith([
      expect.objectContaining({
        eventType: "Reservation.Cancelled",
        subject: "reservation/event",
        dataVersion: "1.0",
        data: cancelEvent.data,
      }),
    ]);
  });
});
