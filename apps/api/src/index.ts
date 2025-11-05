import type { HttpRequest, InvocationContext, HttpResponseInit } from "@azure/functions";
import Fastify, { type HTTPMethods } from "fastify";
import dotenv from "dotenv";
import { registerRackRoutes } from "./routes/racks";
import { registerPlannerRoutes } from "./routes/planner";

dotenv.config();

// Enable logging with proper configuration
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          headers: request.headers,
          hostname: request.hostname,
          remoteAddress: request.ip,
        };
      },
    },
  },
});

// Add CORS support
fastify.addHook("onRequest", async (request, reply) => {
  const origin = request.headers.origin || "*";
  reply.header("Access-Control-Allow-Origin", origin);
  reply.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  reply.header("Access-Control-Allow-Credentials", "true");
  
  if (request.method === "OPTIONS") {
    reply.code(200).send();
  }
});

registerRackRoutes(fastify);
registerPlannerRoutes(fastify);

function normalizeHeaders(response: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(response).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join(", ") : value === undefined ? "" : String(value)
    ])
  );
}

export default async function handler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const requestUrl = req.url
    ? new URL(req.url)
    : new URL((req as any).originalUrl ? `http://localhost${(req as any).originalUrl}` : "http://localhost");

  const headers = Object.fromEntries(req.headers.entries());
  const query = Object.fromEntries(req.query.entries());
  const payload = req.body ? await req.text() : undefined;

  const method = (req.method?.toUpperCase() || "GET") as HTTPMethods;

  const result = (await fastify.inject({
    method: method as any,
    headers,
    url: requestUrl.pathname + (requestUrl.search || ""),
    payload,
    query
  })) as any;

  context.log(`Handled ${method} ${requestUrl.pathname}`);

  const responseBody =
    typeof result.body === "string" || result.body instanceof Uint8Array
      ? result.body
      : result.body !== undefined
        ? JSON.stringify(result.body)
        : undefined;

  return {
    status: result.statusCode,
    headers: normalizeHeaders(result.headers as Record<string, unknown>),
    body: responseBody
  };
}
