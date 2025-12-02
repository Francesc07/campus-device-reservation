import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { appServices } from "../../appServices";

export async function getMyReservationsHttp(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const userId = req.query.get("userId");

    if (!userId) {
      return { status: 400, jsonBody: { error: "userId query parameter required" } };
    }

    const result = await appServices.listReservationsHandler.execute({ userId });

    return { status: 200, jsonBody: result };
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } };
  }
}

app.http("getMyReservationsHttp", {
  methods: ["GET"],
  route: "reservations/my",
  authLevel: "anonymous",
  handler: getMyReservationsHttp,
});
