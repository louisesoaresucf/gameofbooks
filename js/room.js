/*
 * The reading-room backdrop shared by every page: an arched window whose sky
 * follows the viewer's local hour, floating candles, side stacks and drifting
 * motes of light. Purely decorative (aria-hidden).
 */
(function () {
  "use strict";

  var ROOM_HTML =
    '<div class="room" aria-hidden="true">' +
      '<div class="hall-stacks l"></div><div class="hall-stacks r"></div>' +
      '<canvas id="motes"></canvas>' +
      [
        ["3%", "18%", "0s", 1, ""], ["8%", "46%", "-2s", .85, "far"], ["94%", "24%", "-4s", 1, ""],
        ["97%", "60%", "-1s", .8, "far"], ["14%", "8%", "-3s", .9, "far"], ["86%", "9%", "-5s", .9, "far"],
        ["4%", "78%", "-6s", .75, "far"], ["92%", "86%", "-2.5s", .85, ""]
      ].map(function (c) {
        return '<span class="candle ' + c[4] + '" style="--x:' + c[0] + ";--y:" + c[1] + ";--d:" + c[2] + ";--s:" + c[3] + '"></span>';
      }).join("") +
    "</div>" +
    '<div class="skyband" aria-hidden="true">' +
      '<div class="beam"></div>' +
      '<div class="win side"><div class="sky"></div><div class="stars"></div><div class="clouds"></div><div class="tracery"></div></div>' +
      '<div class="win main"><div class="sky"></div><div class="stars"></div><div class="stars b"></div><div class="clouds"></div><div class="orb"></div><div class="tracery"></div></div>' +
      '<div class="win side"><div class="sky"></div><div class="stars"></div><div class="clouds"></div><div class="tracery"></div></div>' +
      '<div class="sill"></div>' +
    "</div>";

  document.body.insertAdjacentHTML("afterbegin", ROOM_HTML);

  // hour, sky top, sky mid, horizon, room floor, window light, stars, clouds, candles, cloud tint
  var SKY = [
    [0, "#05071a", "#0c1433", "#1b2350", "#0c0e17", "#6f86c9", 1, .12, 1, "#4a5478"],
    [5, "#0b1030", "#2a2a5a", "#6b4a6e", "#0f0f19", "#8a7fb8", .7, .15, .9, "#6a5a80"],
    [6.5, "#3b4a8a", "#c77a8a", "#f2b27a", "#19121a", "#f2b27a", .08, .4, .6, "#f6c6b4"],
    [8.5, "#4f86c6", "#8fbbe2", "#e9d9b8", "#1b1510", "#f3dfb0", 0, .6, .35, "#ffffff"],
    [12, "#3a7bd5", "#7fb4ea", "#cfe6f7", "#1d1712", "#fff1cc", 0, .7, .25, "#ffffff"],
    [16.5, "#4a7fc0", "#9cbfe0", "#f0d9a8", "#1c1510", "#ffe2a6", 0, .6, .35, "#fff6ea"],
    [18.5, "#2e3f7a", "#c0587a", "#f39a4a", "#1a110d", "#f39a4a", .08, .5, .7, "#f5b3a0"],
    [20, "#121a42", "#3d2f6b", "#9a4f6a", "#120f17", "#b07aa0", .5, .3, .9, "#a08aa8"],
    [22, "#070a20", "#111a3d", "#26305e", "#0d0e17", "#7088cc", .95, .15, 1, "#4a5478"],
    [24, "#05071a", "#0c1433", "#1b2350", "#0c0e17", "#6f86c9", 1, .12, 1, "#4a5478"]
  ];

  function hexRGB(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  function mix(a, b, t) {
    var x = hexRGB(a), y = hexRGB(b);
    return "#" + x.map(function (v, i) { return Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0"); }).join("");
  }
  function rgba(h, a) { var c = hexRGB(h); return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
  function phaseName(h) {
    if (h >= 5 && h < 8) return "Dawn";
    if (h >= 8 && h < 12) return "Morning";
    if (h >= 12 && h < 17) return "Afternoon";
    if (h >= 17 && h < 20) return "Dusk";
    if (h >= 20 && h < 22) return "Evening";
    return "Night";
  }

  var magic = .9;

  function setSky() {
    var now = new Date(), h = now.getHours() + now.getMinutes() / 60;
    var i = 0;
    while (i < SKY.length - 2 && h >= SKY[i + 1][0]) i++;
    var A = SKY[i], B = SKY[i + 1], t = (h - A[0]) / (B[0] - A[0]);
    var col = function (k) { return mix(A[k], B[k], t); };
    var num = function (k) { return A[k] + (B[k] - A[k]) * t; };
    var bg = col(4), glow = col(5), r = document.documentElement.style;

    r.setProperty("--sky-top", col(1)); r.setProperty("--sky-mid", col(2)); r.setProperty("--sky-low", col(3));
    r.setProperty("--night", bg); r.setProperty("--wall", mix(bg, glow, .07)); r.setProperty("--room-top", mix(bg, glow, .16));
    r.setProperty("--glow", glow); r.setProperty("--glow-soft", rgba(glow, .22)); r.setProperty("--glow-faint", rgba(glow, .08));
    r.setProperty("--star-op", num(6).toFixed(2)); r.setProperty("--cloud-op", num(7).toFixed(2)); r.setProperty("--candle-op", num(8).toFixed(2));
    r.setProperty("--cloud", rgba(col(9), .6));
    magic = num(8);

    // sun from 6:00 to 18:30, moon the rest of the night, each on an arc across the window
    var sun = h >= 6 && h < 18.5;
    var p = sun ? (h - 6) / 12.5 : ((h - 18.5 + 24) % 24) / 11.5;
    r.setProperty("--orb-x", (10 + 80 * p).toFixed(1) + "%");
    r.setProperty("--orb-y", (78 - 58 * Math.sin(Math.PI * p)).toFixed(1) + "%");
    if (sun) {
      var low = 1 - Math.sin(Math.PI * p);
      r.setProperty("--orb-bg", "radial-gradient(circle,#fffbe8," + mix("#ffe39a", "#ff9a4a", low) + " 62%," + mix("#ffcf6a", "#f0703a", low) + ")");
      r.setProperty("--orb-glow", rgba(mix("#ffdc8c", "#ff8a40", low), .55));
    } else {
      r.setProperty("--orb-bg", "radial-gradient(circle at 36% 34%,#f6f7fb,#d3d9e8 55%,#a9b2c7)");
      r.setProperty("--orb-glow", "rgba(200,215,255,.32)");
    }

    var clock = document.getElementById("skytime");
    if (clock) {
      var time = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
      clock.innerHTML = "<b>" + phaseName(h) + "</b> over the reading room · " + time;
    }
  }

  function seeded(s) { return function () { return (s = (s * 16807) % 2147483647) / 2147483647; }; }

  // star fields: fixed pseudo-random dots drawn as box-shadows inside each window
  Array.prototype.forEach.call(document.querySelectorAll(".win .stars"), function (el, k) {
    var rnd = seeded(97 + k * 131), dots = [];
    for (var n = 0; n < 70; n++) {
      var x = Math.round(rnd() * 580), y = Math.round(rnd() * 360), big = rnd() > .86, a = (.45 + rnd() * .55).toFixed(2);
      dots.push(x + "px " + y + "px 0 " + (big ? 1 : 0) + "px rgba(255,250,235," + a + ")");
    }
    el.style.boxShadow = dots.join(",");
  });

  // drifting motes of light
  (function motes() {
    var cv = document.getElementById("motes"), ctx = cv.getContext && cv.getContext("2d");
    if (!ctx) return;
    var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var W = 0, H = 0, P = [], rnd = seeded(4242);
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    addEventListener("resize", size);
    for (var i = 0; i < 38; i++) P.push({ x: rnd(), y: rnd(), r: .6 + rnd() * 1.6, v: .00006 + rnd() * .00014, ph: rnd() * 6.28, tw: .5 + rnd() * 1.5 });
    function draw(ts) {
      ctx.clearRect(0, 0, W, H);
      P.forEach(function (p) {
        if (!still) { p.y -= p.v * 16; if (p.y < -.02) { p.y = 1.02; p.x = rnd(); } }
        var x = (p.x + Math.sin(ts / 4000 + p.ph) * .01) * W, y = p.y * H;
        var a = (.25 + .35 * (0.5 + 0.5 * Math.sin(ts / 900 * p.tw + p.ph))) * magic;
        var g = ctx.createRadialGradient(x, y, 0, x, y, p.r * 4);
        g.addColorStop(0, "rgba(255,226,150," + a + ")");
        g.addColorStop(1, "rgba(255,226,150,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, p.r * 4, 0, 6.283); ctx.fill();
      });
      if (!still) requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  })();

  setSky();
  setInterval(setSky, 60000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) setSky(); });

  /* Shared helpers for leather-bound spines and covers. */
  var LEATHER = ["--l0", "--l1", "--l2", "--l3", "--l4", "--l5", "--l6", "--l7"];
  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  window.ReadingRoom = {
    hash: hash,
    leather: function (key) { return "var(" + LEATHER[hash(key) % LEATHER.length] + ")"; }
  };
})();
