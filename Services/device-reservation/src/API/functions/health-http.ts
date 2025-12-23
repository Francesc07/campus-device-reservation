import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

/**
 * Health Check Endpoint
 * 
 * Provides a simple health check endpoint for:
 * - Kubernetes/Container liveness probes
 * - Load balancer health checks
 * - CI/CD deployment verification
 * - Monitoring and alerting systems
 * 
 * **Endpoint**: GET /api/health
 * **Auth Level**: Anonymous (public)
 * **Response**: 200 OK with service status information
 * 
 * @returns Service health status with timestamp and version
 * 
 * @example
 * ```bash
 * curl https://devicereservation-dev-ab07-func.azurewebsites.net/api/health
 * ```
 * 
 * Response:
 * ```json
 * {
 *   "status": "healthy",
 *   "service": "device-reservation",
 *   "timestamp": "2025-12-23T10:30:00.000Z",
 *   "version": "1.0.0"
 * }
 * ```
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

// Register HTTP function
app.http("health-http", {
  route: "health",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: healthCheck,
});
