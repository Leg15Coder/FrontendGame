import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

const env = await load({ export: true });
const SECRET_TOKEN = env.SECRET_TOKEN || Deno.env.get("SECRET_TOKEN");
const kv = await Deno.openKv();

console.log("Game raised, secret key=" + SECRET_TOKEN)

serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "POST" && url.pathname === "/api/record") {
    const body = await req.json();
    const { name, score, level, time } = body;
    const auth = req.headers.get("Authorization");

    if (auth !== SECRET_TOKEN) {  // || Math.abs(Date.now() - new Date(time).getTime()) > 60) {
      return new Response("Не авторизован", { status: 401 });
    }

    for await (const entry of kv.list({ prefix: ["records"] })) {
      const record = entry.value;
      if (record.name === name && record.score === score && record.level === level) {
        return new Response("Дублирующие записи", {
          status: 208,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
          }
        });
      }
    }

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
    const userName = url.searchParams.get("userName");
    let limit = Number(url.searchParams.get("limit") ?? 100);
    if (limit < 0) limit = 0;
    const records: any[] = [];

    for await (const entry of kv.list({ prefix: ["records"] })) {
      if (userName && entry.value.name !== userName) continue;
      if (entry.value.name.length > 64) continue;
      records.push(entry.value);
    }

    records.sort((a, b) => b.score - a.score || new Date(a.time) - new Date(b.time));
    return new Response(JSON.stringify(records.slice(0, limit)), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",  // Разрешить все домены
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",  // Разрешенные методы
      }
    });
  }

  if (req.method === "GET" && url.pathname === "/api/config") {
    const auth = req.headers.get("Authorization");
    if (auth !== SECRET_TOKEN && SECRET_TOKEN !== null) {
      return new Response("Не авторизован", { status: 401 });
    }

    return new Response(JSON.stringify({'SECRET_TOKEN': SECRET_TOKEN, 'API_URL': env.API_URL, 'summery': [SECRET_TOKEN, env.API_URL]}), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      }
    });
  }

  if (req.method === "DELETE" && url.pathname === "/api/records") {
    const userName = url.searchParams.get("userName");
    const dataTime = url.searchParams.get("time");
    const maxLength = Number(url.searchParams.get("maxLength") ?? 1000);
    const auth = req.headers.get("Authorization");

    if (auth !== SECRET_TOKEN && SECRET_TOKEN !== null) {
      return new Response("Не авторизован", { status: 401 });
    }

    let deleted = 0;
    for await (const entry of kv.list({ prefix: ["records"] })) {
      if (userName && userName === entry.value.name ||
          dataTime && dataTime == entry.value.time ||
          maxLength && entry.value.name.length > maxLength) {
        await kv.delete(entry.key);
        deleted++;
      }
    }

    return new Response(`Удалено ${deleted} Записей`, {
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
