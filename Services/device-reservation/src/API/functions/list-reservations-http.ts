import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { appServices } from "../../appServices";

export async function listReservationsHttp(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const filter = {
      userId: req.query.get("userId") || undefined
    };

    const result = await appServices.listReservationsHandler.execute(filter);

    return { status: 200, jsonBody: result };
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } };
  }
}

app.http("listReservationsHttp", {
  methods: ["GET"],
  route: "reservations",
  authLevel: "anonymous",
  handler: listReservationsHttp,
});
