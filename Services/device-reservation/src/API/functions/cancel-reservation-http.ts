import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { appServices } from "../../appServices";

export async function cancelReservationHttp(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const { reservationId } = await req.json() as { reservationId: string };

    if (!reservationId) {
      return { status: 400, jsonBody: { error: "reservationId required" } };
    }

    const result = await appServices.cancelReservationHandler.execute(reservationId);

    return { status: 200, jsonBody: result };
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } };
  }
}

app.http("cancelReservationHttp", {
  methods: ["POST"],
  route: "reservations/cancel",
  authLevel: "anonymous",
  handler: cancelReservationHttp,
});
