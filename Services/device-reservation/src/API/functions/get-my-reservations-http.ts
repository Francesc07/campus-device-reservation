import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { appServices } from "../../appServices";

export async function getMyReservations(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  try {
    const userId = req.query.get("userId");
    if (!userId) return { status: 400, jsonBody: { error: "userId required" } };

    const handler = appServices.listReservationsHandler;
    const reservations = await handler.execute({ userId });
    return { status: 200, jsonBody: reservations };
  } catch (e:any) {
    ctx.error(e.message);
    return { status: 500, jsonBody: { error: "Internal Server Error" } };
  }
}

app.http("get-my-reservations-http", {
  methods: ["GET"],
  route: "reservations/my",
  authLevel: "anonymous",
  handler: getMyReservations
});
