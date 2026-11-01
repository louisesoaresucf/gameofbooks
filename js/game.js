/* Runs the ten-question game on index.html, then redirects to results.html. */
(function () {
  "use strict";

  var QUESTIONS = window.GameOfBooks.QUESTIONS;
  var intro = document.getElementById("intro");
  var quiz = document.getElementById("quiz");
  var questionEl = document.getElementById("question");
  var progressLabel = document.getElementById("progress-label");
  var progressFill = document.getElementById("progress-fill");
  var backBtn = document.getElementById("back");

  var answers = [];
  var current = 0;
  var locked = false;

  function start() {
    answers = [];
    current = 0;
    intro.hidden = true;
    quiz.hidden = false;
    render();
  }

  function render() {
    var q = QUESTIONS[current];
    progressLabel.textContent = (current + 1) + " / " + QUESTIONS.length;
    progressFill.style.width = (current / QUESTIONS.length) * 100 + "%";
    backBtn.disabled = current === 0;

    questionEl.innerHTML = "";
    questionEl.classList.remove("fade-in");
    void questionEl.offsetWidth; // restart the animation
    questionEl.classList.add("fade-in");

    var heading = document.createElement("h2");
    heading.textContent = q.prompt;
    heading.tabIndex = -1;
    questionEl.appendChild(heading);

    var list = document.createElement("ul");
    list.className = "answers";
    q.answers.forEach(function (answer, i) {
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "answer" + (answers[current] === i ? " selected" : "");
      btn.innerHTML = '<span class="key" aria-hidden="true">' + (i + 1) + "</span>";
      btn.appendChild(document.createTextNode(answer.text));
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
    buttons[index].classList.add("selected");

    setTimeout(function () {
      if (current < QUESTIONS.length - 1) {
        current++;
        render();
      } else {
        progressFill.style.width = "100%";
        window.location.href = "results.html?a=" + answers.join("");
      }
    }, 280);
  }

  function back() {
    if (current > 0 && !locked) {
      current--;
      render();
    }
  }

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
