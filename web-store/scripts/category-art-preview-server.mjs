import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    if (url.pathname === "/" || url.pathname === "/gallery.html") {
      await run(process.execPath, ["scripts/category-art-gallery.mjs"]);
      response.writeHead(200, {"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"});
      response.end(await readFile("output/category-art/gallery.html"));
      return;
    }
    const match = url.pathname.match(/^\/public\/static\/category-cards\/([a-z0-9-]+\.(?:webp|png))$/);
    if (!match) { response.writeHead(404); response.end(); return; }
    const image = await readFile(`public/static/category-cards/${match[1]}`);
    response.writeHead(200, {"Content-Type":match[1].endsWith(".webp") ? "image/webp" : "image/png"});
    response.end(image);
  } catch {
    response.writeHead(500);
    response.end("Preview unavailable");
  }
});
server.listen(3021, "127.0.0.1", () => console.log("Category artwork preview: http://127.0.0.1:3021"));
