import express from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic } from "./vite.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup Vite or static serving based on environment
if (process.env.NODE_ENV === "production") {
  serveStatic(app);
} else {
  await setupVite(app);
}

// Register API routes
const server = await registerRoutes(app);

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
