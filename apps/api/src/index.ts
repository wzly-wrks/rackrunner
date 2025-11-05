import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import Fastify from "fastify";
import dotenv from "dotenv";
import { registerRackRoutes } from "./routes/racks";
import { registerPlannerRoutes } from "./routes/planner";

dotenv.config();

const fastify = Fastify({ logger: false });

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
