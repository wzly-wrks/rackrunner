import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import Fastify from "fastify";
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

const handler: AzureFunction = async (context: Context, req: HttpRequest) => {
  const { method, headers, query, body, url } = req;
  const requestUrl = url
    ? new URL(url)
    : new URL((req as any).originalUrl ? `http://localhost${(req as any).originalUrl}` : "http://localhost");
  const result = await fastify.inject({
    method: method || "GET",
    headers: headers as Record<string, string>,
    url: requestUrl.pathname + (requestUrl.search || ""),
    payload: body,
    query: query as Record<string, string>
  });

  context.res = {
    status: result.statusCode,
    headers: result.headers as Record<string, string>,
    body: result.body
  };
};

export default handler;
