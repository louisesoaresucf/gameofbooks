/* Builds the five-book recommendation list on results.html from ?a=<answers>. */
(function () {
  "use strict";

  var G = window.GameOfBooks;
  var Room = window.ReadingRoom;
  var answers = G.parseAnswers(window.location.search);

  // No valid answers (e.g. someone opened results.html directly): send them to the game.
  if (!answers) {
    window.location.replace("./");
    return;
  }

  var profile = G.buildProfile(answers);
  var statusEl = document.getElementById("status");
  var caseEl = document.getElementById("case");
  var booksEl = document.getElementById("books");
  var tropesEl = document.getElementById("tropes");
  var seed = answers.join("");
  var ROMAN = ["i", "ii", "iii", "iv", "v"];

  function label(trope) { return (G.TROPES[trope] || { label: trope }).label; }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  G.topTropes(profile, 4).forEach(function (t) {
    tropesEl.appendChild(el("li", "tag", label(t)));
  });

  function whyText(pick) {
    var names = pick.matched.slice(0, 2).map(label);
    var p = el("p", "why");
    if (!names.length) {
      p.textContent = "A wildcard from the stacks.";
      return p;
    }
    p.appendChild(document.createTextNode("For your love of "));
    names.forEach(function (n, i) {
      if (i) p.appendChild(document.createTextNode(" and "));
      p.appendChild(el("em", null, n));
    });
    p.appendChild(document.createTextNode("."));
    return p;
  }

  function spine(pick, i) {
    var book = pick.book, h = Room.hash(book.id);
    var a = el("a", "spine shelved" + (book.type === "series" ? " series" : ""));
    a.href = "#rec-" + (i + 1);
    a.style.setProperty("--c", Room.leather(book.id));
    a.style.setProperty("--w", (book.type === "series" ? 46 + (h >> 4) % 10 : 34 + (h >> 4) % 10) + "px");
    a.style.setProperty("--h", 128 + (h >> 9) % 34 + "px");
    a.style.setProperty("--i", i);
    a.title = book.title + " — " + book.authors.join(", ");
    a.setAttribute("aria-label", "No. " + (i + 1) + ": " + book.title);
    a.appendChild(el("span", "st", book.title));
    a.appendChild(el("span", "rk", ROMAN[i]));
    return a;
  }

  function card(pick, i) {
    var book = pick.book;
    var li = el("li", "card rec fade-in");
    li.id = "rec-" + (i + 1);
    li.style.animationDelay = (i * 80) + "ms";

    var cover = el("div", "cover");
    cover.setAttribute("aria-hidden", "true");
    cover.style.setProperty("--c", Room.leather(book.id));
    var frame = el("div", "frame");
    frame.appendChild(el("span", "orn", "❧"));
    frame.appendChild(el("p", "ct", book.title));
    frame.appendChild(el("span", "orn", "❧"));
    cover.appendChild(frame);
    li.appendChild(cover);

    var body = el("div");
    body.appendChild(el("p", "rn", "No. " + (i + 1) + (book.type === "series" ? " · Series" : " · Novel")));
    body.appendChild(el("h3", null, book.title));
    body.appendChild(el("p", "ra", "by " + book.authors.join(", ")));
    body.appendChild(whyText(pick));

    var chips = el("ul", "chips");
    chips.setAttribute("aria-label", "Matching tropes");
    pick.matched.forEach(function (t) { chips.appendChild(el("li", "chip", label(t))); });
    if (pick.matched.length) body.appendChild(chips);

    var src = el("p", "src");
    var link = el("a");
    link.target = "_blank";
    link.rel = "noopener";
    if (book.wikipedia_url) {
      link.href = book.wikipedia_url;
      link.textContent = "Wikipedia article ↗";
    } else {
      link.href = "https://www.google.com/search?q=" +
        encodeURIComponent(book.title + " " + book.authors.join(" ") + " novel");
      link.textContent = "Look it up ↗";
    }
    src.appendChild(link);
    body.appendChild(src);

    li.appendChild(body);
    return li;
  }

  function renderBooks(books) {
    var picks = G.recommend(books, profile, 5, seed);
    statusEl.hidden = true;
    caseEl.hidden = false;
    picks.forEach(function (pick, i) {
      caseEl.appendChild(spine(pick, i));
      booksEl.appendChild(card(pick, i));
    });
  }

  fetch("fantasy_novels.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) { renderBooks(data.books); })
    .catch(function () {
      statusEl.textContent = "The library doors are stuck: the book list couldn't be loaded. " +
        "If you opened this file straight from disk, serve the folder over HTTP instead.";
    });

  document.getElementById("share").addEventListener("click", function () {
    var btn = this;
    var url = window.location.href.split("#")[0];
    function done(msg) {
      btn.textContent = msg;
      setTimeout(function () { btn.textContent = "Copy link to this list"; }, 2000);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { done("Link copied"); }, function () { done("Copy failed"); });
    } else {
      window.prompt("Copy this link:", url);
    }
  });
})();
