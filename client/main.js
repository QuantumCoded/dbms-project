console.log("main script loaded!");

let typingTimer;
const mb_search = document.getElementById("search");

mb_search.addEventListener("input", () => {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(run_mb_search(mb_search.value), 100);
});

async function run_mb_search(query) {
  let search_result = JSON.parse(await fetch(`/search?q=${query}`));
  console.log(search_result);
}
