import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  base: "/",
  plugins: [
    {
      name: "profiles-reload",
      configureServer(server) {
        const file = path.resolve("public/data/profiles.json");
        server.watcher.add(file);
        server.watcher.on("change", (changed) => {
          if (changed === file) {
            server.ws.send({ type: "full-reload" });
          }
        });
      }
    }
  ]
});
