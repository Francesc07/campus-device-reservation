import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { appServices } from "../../appServices";

interface CreateReservationRequest {
  userId: string;
  deviceId: string;
}

export async function createReservationHttp(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const { userId, deviceId } = await req.json() as CreateReservationRequest;

    if (!userId || !deviceId) {
      return { status: 400, jsonBody: { error: "userId and deviceId required" } };
    }

    const result = await appServices.createReservationHandler.execute(userId, deviceId);

    return { status: 201, jsonBody: result };
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } };
  }
}

app.http("createReservationHttp", {
  methods: ["POST"],
  route: "reservations",
  authLevel: "anonymous",
  handler: createReservationHttp,
});
