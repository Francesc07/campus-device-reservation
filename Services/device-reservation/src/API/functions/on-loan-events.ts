import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { appServices } from "../../appServices";

export async function loanEventsHttp(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const events = await req.json();

    for (const event of events) {
      const { eventType, data } = event;

      switch (eventType) {
        case "Loan.Created": {
          const { userId, deviceId } = data;
          await appServices.createReservationHandler.execute(userId, deviceId);
          break;
        }

        case "Loan.Cancelled": {
          const { reservationId } = data;
          await appServices.cancelReservationHandler.execute(reservationId);
          break;
        }

        default:
          break;
      }
    }

    return { status: 200 };
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } };
  }
}

app.http("loanEventsHttp", {
  methods: ["POST"],
  route: "events/loan",
  authLevel: "anonymous",
  handler: loanEventsHttp,
});
