import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";

const kv = await Deno.openKv();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...CORS_HEADERS,
        "Access-Control-Allow-Origin": req.headers.get("Origin") || "*",
      },
    });
  }

  const setCorsHeaders = (response: Response) => {
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      headers.set(key, value);
    }
    headers.set("Access-Control-Allow-Origin", req.headers.get("Origin") || "*");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };

  try {
    if (req.method === "POST" && url.pathname === "/api/record") {
      const body = await req.json();

      if (!body.name || !body.score || !body.level) {
        return setCorsHeaders(
          new Response(JSON.stringify({ error: "Missing required fields" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      const id = `${Date.now()}-${crypto.randomUUID()}`;
      await kv.set(["records", id], {
        ...body,
        id,
        time: new Date().toISOString(),
      });

      return setCorsHeaders(
        new Response(JSON.stringify({ success: true, id }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        })
      );
    }

    if (req.method === "GET" && url.pathname === "/api/records") {
      const records = [];
      for await (const entry of kv.list({ prefix: ["records"] })) {
        records.push(entry.value);
      }

      records.sort((a, b) => b.score - a.score || new Date(a.time).getTime() - new Date(b.time).getTime());

      return setCorsHeaders(
        Response.json(records.slice(0, 100))
      );
    }

    const fileResponse = await serveDir(req, {
      fsRoot: "public",
      urlRoot: "",
      showDirListing: false,
      enableCors: true,
    });

    return setCorsHeaders(fileResponse);

  } catch (error) {
    console.error("Server error:", error);
    return setCorsHeaders(
      new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );
  }
});
