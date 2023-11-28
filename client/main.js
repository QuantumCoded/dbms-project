console.log("main script loaded!");

let music_container = document.getElementById("music-container");
let search_template = document.getElementById("search-template");

const mb_search = document.getElementById("search");
const liked_tracks = new Set();

function debounce(func, timeout = 300) {
  let typing_timer;
  return (...args) => {
    clearTimeout(typing_timer);
    typing_timer = setTimeout(() => {func.apply(this, args);}, timeout);
  };
}

mb_search.addEventListener("input", debounce(() => run_mb_search(mb_search.value)));

function toggle_liked(node) {
  console.log(`toggling node with class: ${node.className}`);
  if (node.className == "music-search") {
    liked_tracks.add(node.id);
    node.className = "music-liked";
  } else {
    liked_tracks.delete(node.id);
    node.className = "music-search";
  }
}

async function run_mb_search(query) {
  console.log(`running search: "${query}"`);
  let search_result = await (await fetch(
      `/search?q=${query}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filter: Array.from(liked_tracks) })
      },
    )).json();
  
  console.log(search_result);

  // clear old search results, but leave liked songs
  music_container.querySelectorAll(".music-search").forEach(elem => elem.remove());

  for (result of search_result) {
    console.log(result);

    let { id, track, artist, album, image } = result;

    console.log(id, track, artist, album, image);
    
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
    img_node.src = image;

    music_container.appendChild(node);

    search_node.addEventListener("click", () => toggle_liked(search_node));
  }
}
