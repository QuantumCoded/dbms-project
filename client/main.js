console.log("main script loaded!");

const music_container = document.getElementById("music-container");
const search_template = document.getElementById("search-template");
const random_button = document.getElementById("random");
const submit_button = document.getElementById("submit");
const username = document.getElementById("username");

const mb_search = document.getElementById("search");
const liked_tracks = { user: null, tracks: {} };

function debounce(func, timeout = 300) {
  let typing_timer;
  return (...args) => {
    clearTimeout(typing_timer);
    typing_timer = setTimeout(() => {func.apply(this, args);}, timeout);
  };
}

mb_search.addEventListener("input", debounce(() => run_mb_search(mb_search.value)));
submit_button.addEventListener("click", async event => {
  if (event.button == 0) {
    liked_tracks.user = username.value || null;

    if (!liked_tracks.user) {
      alert("a username is required");
      return;
    }

    await fetch(
      "/favorites",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(liked_tracks),
      }
    );

    alert("favorites have been submitted");

    cleanup();
  }
});

random_button.addEventListener("click", async event => {
  if (event.button == 0) {
    let random = await (await fetch("/random")).json();

    cleanup();

    for (track of random) {
      // HACK: trying to alert ${track.username} prints the same name for all tracks
      // setting username = track.username and alerting username is correct for all tracks
      let username = track.username;

      add_result(track.mbid, track.title, track.artist, track.album, () => {
        alert(`This track was favorited by ${username}.`);
      });
    }
  }
});

function cleanup() {
  music_container.innerHTML = "";
  liked_tracks.user = null;
  liked_tracks.tracks = {};
  username.value = "";
  mb_search.value = "";
}

function toggle_liked(node) {
  console.log(`toggling node with class: ${node.className}`);
  if (node.className == "music-search") {
    let title = node.querySelector(".title").innerHTML;
    let artist = node.querySelector(".artist").innerHTML;
    let album = node.querySelector(".album").innerHTML;

    liked_tracks.tracks[node.id] = { title, artist, album };

    node.className = "music-liked";
  } else {
    delete liked_tracks[node.id];
    node.className = "music-search";
  }
}

function add_result(id, track, artist, album, onclick) {
  let node = search_template.content.cloneNode(true);

  let search_node = node.querySelector("div");
  let title_node = node.querySelector(".title");
  let artist_node = node.querySelector(".artist");
  let album_node = node.querySelector(".album");
  let img_node = node.querySelector("img");

  search_node.id = id;
  title_node.innerHTML = track;
  artist_node.innerHTML = artist;
  album_node.innerHTML = album;
  img_node.src = `https://coverartarchive.org/release/${id}/front-250`;

  music_container.appendChild(node);

  const context = {
    search_node,
    title_node,
    artist_node,
    album_node,
    img_node,
  };

  if (onclick) search_node.addEventListener("click", event => {
    if (event.button == 0) onclick(context);
  });
}

async function run_mb_search(query) {
  console.log(`running search: "${query}"`);

  let search_result = await (await fetch(
      `/search?q=${query}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filter: Object.keys(liked_tracks.tracks)
        })
      },
    )).json();
  
  console.log(search_result);

  // clear old search results, but leave liked songs
  music_container.querySelectorAll(".music-search").forEach(elem => elem.remove());

  for (result of search_result) {
    let { id, track, artist, album } = result;

    add_result(id, track, artist, album, context => {
      toggle_liked(context.search_node);
    });
  }
}
