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
    a.addEventListener("click", function () {
      var li = document.getElementById("rec-" + (i + 1));
      if (li) openCard(li);
    });
    return a;
  }

  /* Left: a colourful front-facing book with its title and author. */
  function bookCover(book, i) {
    var c = binding(book);
    var btn = el("button", "tome-btn");
    btn.type = "button";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "card-" + (i + 1));
    btn.setAttribute("aria-label", book.title + " by " + book.authors.join(", ") + ": show library card");
    btn.appendChild(el("span", "peek"));
    var wrap = el("span", "tome");
    wrap.style.setProperty("--b", c[0]);
    wrap.style.setProperty("--bh", c[1]);
    var face = el("span", "tome-face");
    face.appendChild(el("span", "orn", "❦"));
    face.appendChild(el("span", "tome-title", book.title));
    face.appendChild(el("span", "tome-rule"));
    face.appendChild(el("span", "tome-author", book.authors.join(", ")));
    face.appendChild(el("span", "orn", "❦"));
    wrap.appendChild(face);
    btn.appendChild(wrap);
    return btn;
  }

  /* Right: a library card summarising the book's tropes. */
  function libraryCard(pick, i) {
    var book = pick.book;
    var card = el("article", "card libcard");
    card.id = "card-" + (i + 1);
    card.hidden = true;
    card.setAttribute("aria-label", "Library card for " + book.title);

    var top = el("div", "card-top");
    top.appendChild(el("span", null, "Library card · No. " + (i + 1)));
    top.appendChild(el("span", null, book.type === "series" ? "Series" : "Novel"));
    card.appendChild(top);

    var facts = el("dl", "facts");
    facts.appendChild(el("dt", null, "Title"));
    var titleDd = el("dd", "f-title");
    titleDd.appendChild(el("h3", null, book.title));
    facts.appendChild(titleDd);
    facts.appendChild(el("dt", null, "Author"));
    facts.appendChild(el("dd", "f-author", book.authors.join(", ")));

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
    card.appendChild(el("span", "stamp", "Recommended"));
    return card;
  }

  function card(pick, i) {
    var li = el("li", "rec fade-in");
    li.id = "rec-" + (i + 1);
    li.style.animationDelay = (i * 80) + "ms";
    var book = bookCover(pick.book, i);
    var slot = el("div", "card-slot");
    var hint = synopsis(pick);
    var lib = libraryCard(pick, i);
    slot.appendChild(hint);
    slot.appendChild(lib);
    li.appendChild(book);
    li.appendChild(slot);
    book.addEventListener("click", function () { toggle(li); });
    return li;
  }

  /* ---------- synopsis beside each closed book ---------- */
  var WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/";

  // Article title from a Wikipedia URL; null when there is none or it points into a section of another page.
  function wikiTitle(url) {
    var m = url && /\/wiki\/([^?#]+)(#?)/.exec(url);
    if (!m || m[2]) return null;
    try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
  }

  // Keep the first few sentences, up to roughly `max` characters.
  function trimExtract(text, max) {
    var sentences = text.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+["')\]]*(\s|$)/g) || [text];
    var out = "";
    for (var i = 0; i < sentences.length; i++) {
      if (out && (out + sentences[i]).length > max) break;
      out += sentences[i];
    }
    out = out.trim();
    if (out.length > max * 1.5) out = out.slice(0, max).replace(/\s+\S*$/, "") + "…";
    return out;
  }

  function tropeSummary(pick) {
    var ordered = pick.matched.concat(pick.book.tags.filter(function (t) { return pick.matched.indexOf(t) < 0; }));
    return ordered.map(function (t) { return (G.TROPES[t] || {}).blurb || label(t) + "."; }).join(" ");
  }

  function synopsis(pick) {
    var book = pick.book;
    var box = el("div", "card-hint synopsis");
    var head = el("p", "syn-k", "Synopsis");
    var text = el("p", "syn-text");
    var src = el("p", "syn-src");
    box.appendChild(head);
    box.appendChild(text);
    box.appendChild(src);

    function fallback() {
      head.textContent = "In brief";
      text.textContent = tropeSummary(pick);
      src.textContent = "";
    }

    var title = wikiTitle(book.wikipedia_url);
    if (!title || !window.fetch) { fallback(); return box; }

    text.textContent = "Consulting the archive…";
    text.classList.add("loading");
    fetch(WIKI_SUMMARY + encodeURIComponent(title.replace(/ /g, "_")), { headers: { "Accept": "application/json" } })
      .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
      .then(function (data) {
        if (!data || data.type === "disambiguation" || !data.extract) throw new Error("no summary");
        text.classList.remove("loading");
        text.textContent = trimExtract(data.extract, 360);
        var a = el("a", null, "From Wikipedia ↗");
        a.href = (data.content_urls && data.content_urls.desktop && data.content_urls.desktop.page) || book.wikipedia_url;
        a.target = "_blank";
        a.rel = "noopener";
        src.appendChild(a);
      })
      .catch(function () { text.classList.remove("loading"); fallback(); });
    return box;
  }

  /* ---------- drawing a card out of its book, and tucking it back in ---------- */
  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function isOpen(li) { return li.classList.contains("open"); }

  function openCard(li) {
    if (isOpen(li)) return;
    var lib = li.querySelector(".libcard");
    li.classList.remove("closing");
    li.classList.add("open");
    li.querySelector(".tome-btn").setAttribute("aria-expanded", "true");
    lib.hidden = false;
    lib.classList.remove("tuck");
    void lib.offsetWidth; // restart the animation
    lib.classList.add("draw");
    syncAllButton();
  }

  function closeCard(li) {
    if (!isOpen(li)) return;
    var lib = li.querySelector(".libcard");
    li.classList.remove("open");
    li.querySelector(".tome-btn").setAttribute("aria-expanded", "false");
    syncAllButton();
    if (reduceMotion) { lib.hidden = true; return; }
    li.classList.add("closing");
    lib.classList.remove("draw");
    lib.classList.add("tuck");
    lib.addEventListener("animationend", function done(e) {
      if (e.target !== lib) return;
      lib.removeEventListener("animationend", done);
      if (!isOpen(li)) { lib.hidden = true; lib.classList.remove("tuck"); li.classList.remove("closing"); }
    });
  }

  function toggle(li) { if (isOpen(li)) closeCard(li); else openCard(li); }

  var allBtn = document.getElementById("open-all");
  function rows() { return Array.prototype.slice.call(booksEl.querySelectorAll(".rec")); }
  function syncAllButton() {
    var all = rows().length && rows().every(isOpen);
    allBtn.textContent = all ? "Tuck all cards away" : "Draw out every card";
  }
  allBtn.addEventListener("click", function () {
    var all = rows().every(isOpen);
    rows().forEach(function (li, i) {
      setTimeout(function () { if (all) closeCard(li); else openCard(li); }, reduceMotion ? 0 : i * 120);
    });
  });

  function renderBooks(books) {
    var picks = G.recommend(books, profile, 5, seed);
    statusEl.hidden = true;
    caseEl.hidden = false;
    allBtn.hidden = false;
    picks.forEach(function (pick, i) {
      caseEl.appendChild(spine(pick, i));
      booksEl.appendChild(card(pick, i));
    });
  }

  fetch("fantasy_novels.json?v=20261101-3")
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
