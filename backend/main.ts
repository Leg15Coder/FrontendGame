import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";

const kv = await Deno.openKv();

serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "POST" && url.pathname === "/api/record") {
    const body = await req.json();
    const id = `${Date.now()}-${crypto.randomUUID()}`;
    await kv.set(["records", id], body);
    return new Response("OK", {
      status: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      }
    });
  }

  if (req.method === "GET" && url.pathname === "/api/records") {
    const records: any[] = [];

    for await (const entry of kv.list({ prefix: ["records"] })) {
      records.push(entry.value);
    }

    records.sort((a, b) => b.score - a.score || new Date(a.time) - new Date(b.time));
    return new Response(JSON.stringify(records.slice(0, 100)), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",  // Разрешить все домены
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",  // Разрешенные методы
      }
    });
  }

  return serveDir(req, {
    fsRoot: ".",
    urlRoot: "",
    showDirListing: false,
    enableCors: true,
  });
});
