import { app, HttpRequest, HttpResponseInit } from "@azure/functions";

export async function catalogEventsHttp(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const events = await req.json() as any[];

    for (const event of events) {
      // You can expand these later when Reservation needs device snapshot data
      switch (event.eventType) {
        case "Device.Snapshot":
          // optionally store snapshot in memory/cache
          break;

        case "Device.Deleted":
          // optionally cancel reservations for that device
          break;
      }
    }

    return { status: 200 };
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } };
  }
}

app.http("catalogEventsHttp", {
  methods: ["POST"],
  route: "events/catalog",
  authLevel: "anonymous",
  handler: catalogEventsHttp,
});
