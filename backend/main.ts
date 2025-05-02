import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";

const kv = await Deno.openKv();

serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "POST" && url.pathname === "/api/record") {
    const body = await req.json();
    const { name, score, level } = body;

    for await (const entry of kv.list({ prefix: ["records"] })) {
      const record = entry.value;
      if (record.name === name && record.score === score && record.level === level) {
        return new Response("Дублирующие записи", {
          status: 409,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
          }
        });
      }
    }

    const id = `${Date.now()}`;
    await kv.set(["records", name, score, level], body);

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

  if (req.method === "DELETE" && url.pathname === "/api/records") {
    const auth = req.headers.get("Authorization");

    if (auth !== "secret-token") {
      return new Response("Не авторизован", { status: 401 });
    }

    let deleted = 0;
    for await (const entry of kv.list({ prefix: ["records"] })) {
      await kv.delete(entry.key);
      deleted++;
    }

    return new Response(`Удалено ${deleted} Записей.`, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "DELETE, OPTIONS",
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
