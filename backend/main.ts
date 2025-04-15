import { serve } from "https://deno.land/std/http/server.ts";
import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";

Deno.serve((req) => serveDir(req, {
  fsRoot: ".",
  urlRoot: "",
  showDirListing: false,
  enableCors: true,
}));

const kv = await Deno.openKv();

serve(async (req) => {
  const url = new URL(req.url);

  // Добавить новый рекорд
  if (req.method === "POST" && url.pathname === "/api/record") {
    const body = await req.json();
    const id = `${Date.now()}-${crypto.randomUUID()}`;
    await kv.set(["records", id], body);
    return new Response("OK", { status: 201 });
  }

  // Получить топ рекордов
  if (req.method === "GET" && url.pathname === "/api/records") {
    const records: any[] = [];

    for await (const entry of kv.list({ prefix: ["records"] })) {
      records.push(entry.value);
    }

    // Сортировка по очкам и дате
    records.sort((a, b) => b.score - a.score || new Date(a.time) - new Date(b.time));
    return Response.json(records.slice(0, 100));
  }

  return new Response("Not found", { status: 404 });
});
