import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

/**
 * Simple test function to verify deployment
 */
export async function testHttp(
  req: HttpRequest,
  ctx: InvocationContext
): Promise<HttpResponseInit> {
  ctx.log("Test HTTP function triggered");
  
  return {
    status: 200,
    jsonBody: {
      message: "Test function is working!",
      timestamp: new Date().toISOString()
    }
  };
}

app.http("test-http", {
  route: "test",
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: testHttp,
});
