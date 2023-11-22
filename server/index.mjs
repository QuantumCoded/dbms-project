import express from "express";
import {MusicBrainzApi} from "musicbrainz-api";
import path from "path";
import {fileURLToPath} from 'url';

const app = express();
const port = 3000;

const mb_api = new MusicBrainzApi({
  appName: "dbms-project",
  appVersion: "1.0.0",
  appContactInfo: "null@void.com",
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root_dir = path.join(__dirname, "../client");

app.get("/", (_req, res) => {
  res.sendFile(path.join(root_dir, "index.html"));
});

app.get("/search", (req, res) => {
  let query = req.query.q;

  console.log("querying musicbrainz:", JSON.stringify(query));

  mb_api.search('release', {query}).then(
    search_result => {
      res
        .header("Content-Type", "text/json")
        .send(JSON.stringify(search_result));
    },

    // TODO: send actual error content
    _err => {
      res
        .header("Content-Type", "text/json")
        .send("{}");
    }
  );
})

app.get("/main.js", (_req, res) => {
  res.sendFile(path.join(root_dir, "main.js"));
});

app.listen(port, () => {
  console.log(`Server started and listening on port ${port}`);
});
