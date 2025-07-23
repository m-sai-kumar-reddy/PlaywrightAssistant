import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function setupVite(app) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
    base: "/",
    root: resolve(__dirname, "..", "client"),
  });
  
  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
}

export function serveStatic(app) {
  const distPath = resolve(__dirname, "..", "dist", "public");
  app.use(express.static(distPath));
  
  app.get("*", (req, res) => {
    res.sendFile(resolve(distPath, "index.html"));
  });
}