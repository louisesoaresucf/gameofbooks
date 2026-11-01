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

  // Bright cloth bindings for the recommended books: [base, highlight].
  var BINDINGS = [
    ["#a8242c", "#e2584b"], ["#1d7149", "#43b57c"], ["#1d4b98", "#4f8ad9"], ["#b8691a", "#f0ad4a"],
    ["#642a8a", "#a463cc"], ["#11706f", "#3fb6ae"], ["#a83a66", "#e47ba0"], ["#30318a", "#6b6bcc"]
  ];
  // Each book in the list gets its own colour: start from its hash, skip colours already used.
  var assigned = {}, used = {};
  function binding(book) {
    if (!assigned[book.id]) {
      var k = Room.hash(book.id) % BINDINGS.length;
      while (used[k]) k = (k + 1) % BINDINGS.length;
      used[k] = true;
      assigned[book.id] = BINDINGS[k];
    }
    return assigned[book.id];
  }

  function spine(pick, i) {
    var book = pick.book, h = Room.hash(book.id), c = binding(book);
    var a = el("a", "spine shelved" + (book.type === "series" ? " series" : ""));
    a.href = "#rec-" + (i + 1);
    a.style.setProperty("--c", c[0]);
    a.style.setProperty("--w", (book.type === "series" ? 46 + (h >> 4) % 10 : 34 + (h >> 4) % 10) + "px");
    a.style.setProperty("--h", 128 + (h >> 9) % 34 + "px");
    a.style.setProperty("--i", i);
    a.title = book.title + " — " + book.authors.join(", ");
    a.setAttribute("aria-label", "No. " + (i + 1) + ": " + book.title);
    a.appendChild(el("span", "st", book.title));
    a.appendChild(el("span", "rk", ROMAN[i]));
    return a;
  }

  /* Left: a colourful front-facing book with its title and author. */
  function bookCover(book) {
    var c = binding(book);
    var wrap = el("div", "tome");
    wrap.setAttribute("aria-hidden", "true");
    wrap.style.setProperty("--b", c[0]);
    wrap.style.setProperty("--bh", c[1]);
    var face = el("div", "tome-face");
    face.appendChild(el("span", "orn", "❦"));
    face.appendChild(el("p", "tome-title", book.title));
    face.appendChild(el("span", "tome-rule"));
    face.appendChild(el("p", "tome-author", book.authors.join(", ")));
    face.appendChild(el("span", "orn", "❦"));
    wrap.appendChild(face);
    return wrap;
  }

  /* Right: a library card summarising the book's tropes. */
  function libraryCard(pick, i) {
    var book = pick.book;
    var card = el("article", "card libcard");
    card.setAttribute("aria-label", "Library card for " + book.title + " by " + book.authors.join(", "));

    var top = el("div", "card-top");
    top.appendChild(el("span", null, "Library card · No. " + (i + 1)));
    top.appendChild(el("span", null, book.type === "series" ? "Series" : "Novel"));
    card.appendChild(top);

    var facts = el("dl", "facts");

    // Matched tropes lead the summary, then the book's other tropes.
    var ordered = pick.matched.concat(book.tags.filter(function (t) { return pick.matched.indexOf(t) < 0; }));
    facts.appendChild(el("dt", null, "Summary"));
    facts.appendChild(el("dd", "f-summary", ordered.map(function (t) {
      return (G.TROPES[t] || {}).blurb || label(t) + ".";
    }).join(" ")));

    facts.appendChild(el("dt", null, "Tropes"));
    var tropeDd = el("dd");
    var chips = el("ul", "chips");
    ordered.forEach(function (t) {
      var hit = pick.matched.indexOf(t) >= 0;
      var chip = el("li", "chip" + (hit ? " hit" : ""), (hit ? "✓ " : "") + label(t));
      if (hit) chip.title = "Matches your answers";
      chips.appendChild(chip);
    });
    tropeDd.appendChild(chips);
    facts.appendChild(tropeDd);

    facts.appendChild(el("dt", null, "Source"));
    var src = el("dd");
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
    facts.appendChild(src);
    card.appendChild(facts);

    if (pick.matched.length) {
      card.appendChild(el("p", "matchnote", "✓ " + pick.matched.length + " of " + book.tags.length +
        " tropes match your answers"));
    }
    card.appendChild(el("span", "stamp show", "Recommended"));
    return card;
  }

  function card(pick, i) {
    var li = el("li", "rec fade-in");
    li.id = "rec-" + (i + 1);
    li.style.animationDelay = (i * 80) + "ms";
    li.appendChild(bookCover(pick.book));
    li.appendChild(libraryCard(pick, i));
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
