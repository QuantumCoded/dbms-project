import express from "express";
import path from "path";
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root_dir = path.join(__dirname, "../client");

app.get("/", (_req, res) => {
  res.sendFile(path.join(root_dir, "index.html"));
});

app.get("/main.js", (_req, res) => {
  res.sendFile(path.join(root_dir, "main.js"));
});

app.listen(port, () => {
  console.log(`Server started and listening on port ${port}`);
});
