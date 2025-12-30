import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Use absolute path relative to project root
  const distPath = path.resolve(process.cwd(), "dist", "public");
  
  console.log(`[static] Checking for static files at: ${distPath}`);
  
  if (!fs.existsSync(distPath)) {
    console.error(`[static] Build directory NOT found at: ${distPath}`);
    return;
  }

  console.log(`[static] Serving static files from: ${distPath}`);
  
  // Important: serve index.html with no-cache to avoid blank page issues after redeploy
  app.get("/", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.sendFile(indexPath);
  });

  app.use(express.static(distPath, {
    setHeaders: (res, path) => {
      if (path.endsWith(".html")) {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      }
    }
  }));

  app.use("*", (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Not Found");
    }
  });
}
