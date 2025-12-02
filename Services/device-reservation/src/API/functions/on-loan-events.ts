import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { appServices } from "../../appServices";

export async function loanEventsHttp(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const events = await req.json() as any[];

    for (const event of events) {
      const { eventType, data } = event;

      switch (eventType) {
        case "Loan.Created": {
          // Loan was created based on our Reservation.Confirmed event
          // Update reservation to link the loanId and mark as active
          const { reservationId, loanId } = data;
          // TODO: Update reservation status to indicate loan is active
          console.log(`Loan created for reservation ${reservationId}: ${loanId}`);
          break;
        }

        case "Loan.Cancelled": {
          // Loan was cancelled, mark the reservation as cancelled
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
