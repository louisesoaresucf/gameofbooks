/* Builds the five-book recommendation list on results.html from ?a=<answers>. */
(function () {
  "use strict";

  var G = window.GameOfBooks;
  var answers = G.parseAnswers(window.location.search);

  // No valid answers (e.g. someone opened results.html directly): send them to the game.
  if (!answers) {
    window.location.replace("./");
    return;
  }

  var profile = G.buildProfile(answers);
  var statusEl = document.getElementById("status");
  var booksEl = document.getElementById("books");
  var tropesEl = document.getElementById("tropes");
  var seed = answers.join("");

  function chip(trope, strong) {
    var li = document.createElement("li");
    var info = G.TROPES[trope] || { label: trope, icon: "" };
    li.className = "chip" + (strong ? " strong" : "");
    li.textContent = (info.icon ? info.icon + " " : "") + info.label;
    return li;
  }

  G.topTropes(profile, 4).forEach(function (t) {
    tropesEl.appendChild(chip(t, true));
  });

  function renderBooks(books) {
    var picks = G.recommend(books, profile, 5, seed);
    statusEl.hidden = true;

    picks.forEach(function (pick) {
      var book = pick.book;
      var li = document.createElement("li");
      li.className = "book card fade-in";

      var title = document.createElement("h3");
      title.textContent = book.title;
      li.appendChild(title);

      var meta = document.createElement("p");
      meta.className = "meta";
      meta.textContent = "by " + book.authors.join(", ") + (book.type === "series" ? " · series" : "");
      li.appendChild(meta);

      var tags = document.createElement("ul");
      tags.className = "chips";
      tags.setAttribute("aria-label", "Matching tropes");
      pick.matched.forEach(function (t) { tags.appendChild(chip(t, false)); });
      li.appendChild(tags);

      var links = document.createElement("p");
      links.className = "links";
      if (book.wikipedia_url) {
        var a = document.createElement("a");
        a.href = book.wikipedia_url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "Read about it on Wikipedia ↗";
        links.appendChild(a);
      } else {
        var search = document.createElement("a");
        search.href = "https://www.google.com/search?q=" +
          encodeURIComponent(book.title + " " + book.authors.join(" ") + " novel");
        search.target = "_blank";
        search.rel = "noopener";
        search.textContent = "Look it up ↗";
        links.appendChild(search);
      }
      li.appendChild(links);

      booksEl.appendChild(li);
    });
  }

  fetch("fantasy_novels.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) { renderBooks(data.books); })
    .catch(function () {
      statusEl.textContent = "The library doors are stuck — we couldn't load the book list. " +
        "If you opened this file directly from disk, serve the folder over HTTP instead.";
    });

  document.getElementById("share").addEventListener("click", function () {
    var btn = this;
    var url = window.location.href;
    function done(msg) {
      btn.textContent = msg;
      setTimeout(function () { btn.textContent = "Copy link to this list"; }, 2000);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { done("Link copied!"); }, function () { done("Copy failed"); });
    } else {
      window.prompt("Copy this link:", url);
    }
  });
})();
