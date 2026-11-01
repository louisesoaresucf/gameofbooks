/* Runs the ten-question game on index.html, then redirects to results.html. */
(function () {
  "use strict";

  var QUESTIONS = window.GameOfBooks.QUESTIONS;
  var intro = document.getElementById("intro");
  var quiz = document.getElementById("quiz");
  var shelf = document.getElementById("shelf");
  var questionEl = document.getElementById("question");
  var progressLabel = document.getElementById("progress-label");
  var backBtn = document.getElementById("back");
  var stamp = document.getElementById("stamp");

  var answers = [];
  var current = 0;
  var locked = false;

  // One leather volume per question; they light up as the shelf fills.
  var vols = QUESTIONS.map(function (q, i) {
    var v = document.createElement("span");
    var h = window.GameOfBooks.hash("question-" + i);
    v.className = "vol";
    v.style.setProperty("--c", window.ReadingRoom.leather("q" + i));
    v.style.setProperty("--h", 44 + (h >> 5) % 18 + "px");
    shelf.appendChild(v);
    return v;
  });

  function start() {
    answers = [];
    current = 0;
    intro.hidden = true;
    quiz.hidden = false;
    render();
  }

  function render() {
    var q = QUESTIONS[current];
    progressLabel.textContent = "Question " + (current + 1) + " of " + QUESTIONS.length;
    backBtn.disabled = current === 0;
    stamp.classList.remove("show");
    vols.forEach(function (v, i) {
      v.classList.toggle("done", i < current);
      v.classList.toggle("now", i === current);
    });

    questionEl.innerHTML = "";
    questionEl.classList.remove("fade-in");
    void questionEl.offsetWidth; // restart the animation
    questionEl.classList.add("fade-in");

    var heading = document.createElement("h2");
    heading.textContent = q.prompt;
    heading.tabIndex = -1;
    questionEl.appendChild(heading);

    var list = document.createElement("ol");
    list.className = "answers";
    q.answers.forEach(function (answer, i) {
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "answer" + (answers[current] === i ? " selected" : "");
      btn.innerHTML = '<span class="key" aria-hidden="true">' + (i + 1) + ".</span>";
      var text = document.createElement("span");
      text.textContent = answer.text;
      btn.appendChild(text);
      btn.addEventListener("click", function () { choose(i); });
      li.appendChild(btn);
      list.appendChild(li);
    });
    questionEl.appendChild(list);
    heading.focus({ preventScroll: true });
    locked = false;
  }

  function choose(index) {
    if (locked) return;
    locked = true;
    answers[current] = index;

    var buttons = questionEl.querySelectorAll(".answer");
    Array.prototype.forEach.call(buttons, function (b, i) { b.classList.toggle("selected", i === index); });
    stamp.classList.add("show");
    vols[current].classList.add("done");

    setTimeout(function () {
      if (current < QUESTIONS.length - 1) {
        current++;
        render();
      } else {
        stamp.textContent = "Shelved";
        window.location.href = "results.html?a=" + answers.join("");
      }
    }, 420);
  }

  function back() {
    if (current > 0 && !locked) {
      current--;
      render();
    }
  }

  // Coming Back from results.html can restore this page from the back/forward cache,
  // still locked on the last question. Unlock it so the reader can revise their answers.
  window.addEventListener("pageshow", function (e) {
    if (e.persisted && !quiz.hidden) {
      stamp.textContent = "Noted";
      current = Math.min(current, QUESTIONS.length - 1);
      render();
    }
  });

  document.getElementById("start").addEventListener("click", start);
  backBtn.addEventListener("click", back);

  document.addEventListener("keydown", function (e) {
    if (quiz.hidden || e.altKey || e.ctrlKey || e.metaKey) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= QUESTIONS[current].answers.length) {
      choose(n - 1);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      back();
    }
  });
})();
