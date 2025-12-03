import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { tryHandleEventGridValidation } from "./shared/handleEventGridValidation";
import { appServices } from "../../appServices";

/**
 * Reservation Service — Event Grid entrypoint
 * Receives only 2 events from Loan Service:
 *   - Loan.Created
 *   - Loan.Cancelled
 */
export async function reservationLoanEvents(
  req: HttpRequest,
  ctx: InvocationContext
): Promise<HttpResponseInit> {

  const events = await req.json() as any[];

  // 1️⃣ Event Grid subscription handshake
  const validation = tryHandleEventGridValidation(events, ctx);
  if (validation) return validation;

  // 2️⃣ Process actual events
  for (const evt of events) {
    const eventType = evt.eventType || evt.type; 
    const eventData = evt.data;

    switch (eventType) {

      case "Loan.Created":
        ctx.log("🟢 Loan.Created event received", eventData);
        await appServices.loanCreatedHandler.handle(eventData, ctx);
        break;

      case "Loan.Cancelled":
        ctx.log("🟠 Loan.Cancelled event received", eventData);
        await appServices.loanCancelledHandler.handle(eventData, ctx);
        break;

      default:
        ctx.log(`Ignoring unsupported event type: ${eventType}`);
    }
  }

  return { status: 200 };
}

app.http("reservation-event-http", {
  route: "events/loan",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: reservationLoanEvents,
});
