import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { appServices } from "../../appServices";

export async function cancelReservation(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  try {
    const { reservationId } = await req.json() as { reservationId: string };
    if (!reservationId) return { status: 400, jsonBody: { error: "reservationId required" } };

    const handler = appServices.cancelReservationHandler;
    const reservation = await handler.execute(reservationId);

    return { status: 200, jsonBody: { success: true, reservation } };
  } catch (e:any) {
    ctx.error(e.message);
    return { status: 500, jsonBody: { error: "Internal Server Error" } };
  }
}

app.http("cancel-reservation-http", {
  methods: ["POST"],
  route: "reservations/cancel",
  authLevel: "anonymous",
  handler: cancelReservation
});
