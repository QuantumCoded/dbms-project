import express from "express";
import {MusicBrainzApi} from "musicbrainz-api";
import path from "path";
import {open} from "sqlite";
import sqlite3 from "sqlite3";
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root_dir = path.join(__dirname, "../client");
const db_file = path.join(__dirname, "../music.db");

const mb_api = new MusicBrainzApi({
  appName: "dbms-project",
  appVersion: "1.0.0",
  appContactInfo: "null@void.com",
});

function search(req, res, filter = []) {
  let query = req.query.q;

  // ignore empty search queries
  if (!query || query.trim().length == 0) {
    res
      .header("Content-Type", "application/json")
      .send("[]");

    return;
  }

  console.log("querying musicbrainz:", JSON.stringify(query));

  mb_api.search('release', {query}).then(
    search_result => {
      let results = search_result.releases
        .map(result => {
          let response = {
            id: result.id,
            track: result.title,
            artist: result["artist-credit"][0].name,
            album: result["release-group"].title,
          };

          return response;
        })
        .filter(track => !filter.includes(track.id))

        res
          .header("Content-Type", "application/json")
          .send(JSON.stringify(results));
    },

    // TODO: send actual error content
    _err => {
      console.log("error making musicbrainz call");
      res
        .header("Content-Type", "application/json")
        .send("[]");
    }
  );
}

(async () => {
  const db = await open({
    filename: db_file,
    driver: sqlite3.Database
  });

  console.log("Sqlite database connection opened");

  await db.run(`
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username STRING NOT NULL UNIQUE
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS track (
      mbid STRING PRIMARY KEY,
      title STRING NOT NULL,
      artist STRING NOT NULL,
      album STRING NOT NULL
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS favorite (
      user_id INTEGER NOT NULL,
      mbid STRING NOT NULL,
      PRIMARY KEY (user_id, mbid)
    );
  `);

  console.log("finished database migrations");

  // clean up the database when closing
  ["exit", "SIGINT", "SIGUSR1", "SIGUSR2", "uncaughtException", "SIGTERM"].forEach((eventType) => {
    process.on(eventType, () => db.close().then(() => process.exit()));
  });

  const app = express();
  const port = 3000;

  // allow express to parse JSON HTTP POST requests
  app.use(express.json());

  app.get("/", (_req, res) => res.sendFile(path.join(root_dir, "index.html")));
  app.get("/main.js", (_req, res) => res.sendFile(path.join(root_dir, "main.js")));

  app.get("/search", (req, res) => search(req, res));
  app.post("/search", (req, res) => search(req, res, req.body.filter));

  app.post("/favorites", async (req, res) => {
    let { user, tracks } = req.body || {};

    console.log({ user, tracks });

    let user_id = (await db.run(
      `INSERT OR IGNORE INTO user (username) VALUES (?);`,
      [ user ]
    )).lastID;

    let queries = Object.entries(tracks).map(async entry => {
      let { title, artist, album } = entry.pop();
      let track_id = entry.pop();


      console.log("query 1");
      console.log(user_id, track_id, title, artist, album);

      await db.run(
        `INSERT OR IGNORE INTO track (mbid, title, artist, album) VALUES (?, ?, ?, ?);`,
        [ track_id, title, artist, album ]
      );

      console.log("query 2");
      console.log(user_id, track_id);

      await db.run(
        `INSERT INTO favorite (mbid, user_id) VALUES (?, ?);`,
        [ track_id, user_id ]
      );
    });

    await Promise.all(queries);

    res.end()
  });

  app.get("/random", async (_req, res) => {
    let tracks = await db.all(`
      SELECT username, title, artist, album, track.mbid
      FROM
        user
        JOIN favorite ON user.id = favorite.user_id
        JOIN track ON favorite.mbid = track.mbid
      ORDER BY RANDOM()
      LIMIT 5;
    `);

    res.end(JSON.stringify(tracks));
  });


  app.listen(port, () => console.log(`Server started and listening on port ${port}`));
})()
