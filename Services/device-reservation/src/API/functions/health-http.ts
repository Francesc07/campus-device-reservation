import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

/**
 * Health check endpoint for monitoring and deployment verification
 */
export async function healthCheck(
  req: HttpRequest,
  ctx: InvocationContext
): Promise<HttpResponseInit> {
  ctx.log("Health check endpoint called");
  
  return {
    status: 200,
    jsonBody: {
      status: "healthy",
      service: "device-reservation",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "unknown"
    }
  };
}

app.http("health-http", {
  route: "health",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: healthCheck,
});
