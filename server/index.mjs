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

  // TODO: change method to post and make the query a JSON
  // object with a query and liked field to do the filtering
  // for likes on the server side

  // TODO: if the query is empty don't query musicbrainz

  console.log("querying musicbrainz:", JSON.stringify(query));

  mb_api.search('release', {query}).then(
    search_result => {

      let results = search_result.releases.map(async result => {
        let response = {
          id: result.id,
          track: result.title,
          artist: result["artist-credit"][0].name,
          album: result["release-group"].title,
          image: `https://coverartarchive.org/release/${result.id}/front-250`,
        };

        return response;
      });

      Promise.all(results).then(data => {
        res
          .header("Content-Type", "text/json")
          .send(JSON.stringify(data));
      }).catch(e => {
        console.log("error packing results", e);

        res
          .header("Content-Type", "text/json")
          .send("[]");
      });
    },

    // TODO: send actual error content
    _err => {
      console.log("error making musicbrainz call");
      res
        .header("Content-Type", "text/json")
        .send("[]");
    }
  );
})

app.get("/main.js", (_req, res) => {
  res.sendFile(path.join(root_dir, "main.js"));
});

app.listen(port, () => {
  console.log(`Server started and listening on port ${port}`);
});
