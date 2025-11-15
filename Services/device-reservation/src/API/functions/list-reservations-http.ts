import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { appServices } from "../../appServices";

export async function listReservations(_req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  try {
    const handler = appServices.listReservationsHandler;
    const reservations = await handler.execute();

    return { status: 200, jsonBody: reservations };
  } catch (e:any) {
    ctx.error(e.message);
    return { status: 500, jsonBody: { error: "Internal Server Error" } };
  }
}

app.http("list-reservations-http", {
  methods: ["GET"],
  route: "reservations",
  authLevel: "anonymous",
  handler: listReservations
});
