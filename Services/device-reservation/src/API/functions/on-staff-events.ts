import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { appServices } from "../../appServices";

export async function staffEventsHttp(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const events = await req.json();

    for (const evt of events) {
      const { eventType, data } = evt;

      switch (eventType) {
        case "Staff.CollectionConfirmed":
          await appServices.markCollectedHandler.execute(data.reservationId);
          break;

        case "Staff.ReturnConfirmed":
          await appServices.markReturnedHandler.execute(data.reservationId);
          break;

        default:
          break;
      }
    }

    return { status: 200 };
  } catch (e: any) {
    return { status: 500, jsonBody: { error: e.message } };
  }
}

app.http("staffEventsHttp", {
  methods: ["POST"],
  route: "events/staff",
  authLevel: "anonymous",
  handler: staffEventsHttp,
});
