/*
 * The reading-room soundtrack, carried over from the Fantasy Reading Room:
 * ambient music composed live in the browser with Web Audio. Four pieces follow
 * the viewer's local hour (night, dawn, day, dusk), switching at the end of a phrase.
 * Needs js/room.js (for the hour) and the .music controls in the page.
 */
(function () {
  "use strict";

  const Music = (() => {
    // each chord: bass note, pad voicing, melody notes (MIDI numbers)
    const PIECES = {
      night: {name:"Moonlit Stacks", cutoff:850, beat:.7, arp:.32, chords:[
        {bass:38, pad:[57,60,62,65], arp:[62,65,69,72,74,77]},
        {bass:34, pad:[58,62,65,69], arp:[62,65,69,70,74,77]},
        {bass:41, pad:[57,60,64,67], arp:[60,64,67,69,72,76]},
        {bass:36, pad:[55,60,62,64], arp:[60,62,67,72,74,76]}]},
      dawn: {name:"First Light on the Spires", cutoff:1500, beat:.62, arp:.45, chords:[
        {bass:43, pad:[59,62,66,67], arp:[66,67,71,74,78,79]},
        {bass:43, pad:[61,64,69,71], arp:[64,69,71,73,76,81]},
        {bass:40, pad:[55,59,62,66], arp:[62,66,67,71,74,78]},
        {bass:36, pad:[55,59,64,67], arp:[64,66,67,71,76,78]}]},
      day: {name:"Sunlit Folios", cutoff:2000, beat:.56, arp:.55, chords:[
        {bass:41, pad:[57,60,65,67], arp:[65,67,69,72,77,79]},
        {bass:40, pad:[55,60,64,67], arp:[64,67,69,72,74,76]},
        {bass:38, pad:[57,60,62,65], arp:[62,65,69,72,74,77]},
        {bass:34, pad:[58,62,65,69], arp:[65,69,70,72,74,77]}]},
      dusk: {name:"The Ember Hour", cutoff:1200, beat:.64, arp:.4, chords:[
        {bass:45, pad:[55,59,60,64], arp:[64,67,69,71,72,76]},
        {bass:43, pad:[55,59,62,64], arp:[62,64,67,71,74,76]},
        {bass:41, pad:[57,60,64,65], arp:[64,65,69,71,72,76]},
        {bass:40, pad:[55,59,62,64], arp:[62,64,67,71,74,76]}]},
    };
    const MOOD_OF = {Night:"night", Evening:"night", Dawn:"dawn", Morning:"day", Afternoon:"day", Dusk:"dusk"};
    const BEATS = 16, LOOKAHEAD = 1.6;
    const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
    let ctx = null, master, padBus, fxBus, timer = null, playing = false;
    let mood = "night", pendingMood = null, nextTime = 0, beat = 0, chord = 0, vol = .45, lastIdx = 2;

    function impulse(sec, decay){
      const len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random()*2 - 1) * Math.pow(1 - i/len, decay); }
      return b;
    }
    function build(){
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
      master.connect(comp); comp.connect(ctx.destination);
      const rev = ctx.createConvolver(); rev.buffer = impulse(4.5, 2.8);
      const revOut = ctx.createGain(); revOut.gain.value = .55; rev.connect(revOut); revOut.connect(master);
      const dly = ctx.createDelay(2); dly.delayTime.value = .46;
      const dlyLp = ctx.createBiquadFilter(); dlyLp.type = "lowpass"; dlyLp.frequency.value = 2600;
      const fb = ctx.createGain(); fb.gain.value = .38;
      dly.connect(dlyLp); dlyLp.connect(fb); fb.connect(dly);
      const dlyOut = ctx.createGain(); dlyOut.gain.value = .35; dlyLp.connect(dlyOut); dlyOut.connect(master); dlyOut.connect(rev);
      padBus = ctx.createGain(); padBus.connect(master); padBus.connect(rev);
      fxBus = ctx.createGain(); fxBus.connect(master); fxBus.connect(rev); fxBus.connect(dly);
      return true;
    }
    function pad(notes, t, dur, cutoff){
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = cutoff; lp.Q.value = .4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + 2.8);
      g.gain.setValueAtTime(.05, t + dur - .4); g.gain.linearRampToValueAtTime(0, t + dur + 3);
      lp.connect(g); g.connect(padBus);
      notes.forEach(n => [["triangle", -7, 1], ["sawtooth", 7, .3]].forEach(([type, det, amp]) => {
        const o = ctx.createOscillator(), og = ctx.createGain();
        o.type = type; o.frequency.value = mtof(n); o.detune.value = det; og.gain.value = amp;
        o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 3.2);
      }));
    }
    function bass(n, t, dur){
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = mtof(n);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.15, t + 2);
      g.gain.setValueAtTime(.15, t + dur - .4); g.gain.linearRampToValueAtTime(0, t + dur + 2.5);
      o.connect(g); g.connect(padBus); o.start(t); o.stop(t + dur + 2.7);
    }
    function pluck(n, t, vel){
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.085 * vel, t + .006); g.gain.exponentialRampToValueAtTime(.0005, t + 2.4);
      g.connect(fxBus);
      [[1, "triangle", 1], [2, "sine", .35], [3, "sine", .12]].forEach(([m, type, a]) => {
        const o = ctx.createOscillator(), og = ctx.createGain();
        o.type = type; o.frequency.value = mtof(n) * m; og.gain.value = a;
        o.connect(og); og.connect(g); o.start(t); o.stop(t + 2.5);
      });
    }
    function bell(n, t){
      [[1, .05, 4], [2.76, .02, 2.2], [5.4, .01, 1.2]].forEach(([m, a, d]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = mtof(n) * m;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
        o.connect(g); g.connect(fxBus); o.start(t); o.stop(t + d + .1);
      });
    }
    function schedule(){
      while (nextTime < ctx.currentTime + LOOKAHEAD) {
        const P = PIECES[mood], C = P.chords[chord % P.chords.length], t = nextTime;
        if (beat === 0) {
          pad(C.pad, t, P.beat * BEATS, P.cutoff); bass(C.bass, t, P.beat * BEATS);
          if (Math.random() < .35) bell(C.arp[C.arp.length - 1] + 12, t + P.beat * (4 + Math.floor(Math.random() * 8)));
        }
        const chance = beat % 2 === 0 ? P.arp : P.arp * .35;
        if (beat < BEATS - 2 && Math.random() < chance) {
          const steps = [-2, -1, -1, 1, 1, 2, 0];
          lastIdx = Math.max(0, Math.min(C.arp.length - 1, lastIdx + steps[Math.floor(Math.random() * steps.length)]));
          pluck(C.arp[lastIdx], t + (Math.random() - .5) * .02, .6 + Math.random() * .5);
        }
        nextTime += P.beat; beat++;
        if (beat >= BEATS) {
          beat = 0; chord++;
          if (pendingMood) { mood = pendingMood; pendingMood = null; chord = 0; }
        }
      }
    }
    async function play(){
      if (!ctx && !build()) return false;
      try { await ctx.resume(); } catch (e) { return false; }
      if (ctx.state !== "running") return false;
      playing = true;
      const n = ctx.currentTime;
      master.gain.cancelScheduledValues(n); master.gain.setValueAtTime(master.gain.value, n); master.gain.linearRampToValueAtTime(vol, n + 2.5);
      nextTime = n + .1; beat = 0;
      schedule(); clearInterval(timer); timer = setInterval(schedule, 250);
      return true;
    }
    function pause(){
      if (!ctx) return;
      playing = false; clearInterval(timer);
      const n = ctx.currentTime;
      master.gain.cancelScheduledValues(n); master.gain.setValueAtTime(master.gain.value, n); master.gain.linearRampToValueAtTime(0, n + 1.2);
      setTimeout(() => { if (!playing) ctx.suspend(); }, 1400);
    }
    return {
      play, pause,
      isPlaying: () => playing,
      title: () => PIECES[pendingMood || mood].name,
      setVolume(v){ vol = v; if (ctx && playing) master.gain.setTargetAtTime(v, ctx.currentTime, .15); },
      setMood(phase){ const m = MOOD_OF[phase] || "night"; if (!playing) { mood = m; chord = 0; } else if (m !== mood) pendingMood = m; },
    };
  })();

  var $ = function (id) { return document.getElementById(id); };
  var btn = $("musicBtn"), lbl = $("musicLbl"), now = $("musicNow"), vol = $("vol");
  if (!btn) return;

  // Remembered across pages and visits: volume, and whether the music was left playing.
  function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function save(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }

  function updateMusicUI() {
    var on = Music.isPlaying();
    btn.setAttribute("aria-pressed", on);
    lbl.textContent = on ? "Pause music" : "Play music";
    now.textContent = "";
    now.appendChild(document.createTextNode(on ? "Now playing " : "This hour's piece: "));
    var title = document.createElement("i");
    title.textContent = Music.title();
    now.appendChild(title);
  }

  function start() {
    return Music.play().then(function (ok) {
      updateMusicUI();
      if (!ok) now.textContent = "Sound couldn't start in this browser. Check that the tab isn't muted and try again.";
      else save("gob-music", "on");
      return ok;
    });
  }

  var savedVol = load("gob-vol");
  if (savedVol !== null) vol.value = savedVol;
  Music.setVolume(vol.value / 100);
  vol.addEventListener("input", function () { Music.setVolume(vol.value / 100); save("gob-vol", vol.value); });

  btn.addEventListener("click", function () {
    disarm();
    if (Music.isPlaying()) { Music.pause(); save("gob-music", "off"); updateMusicUI(); return; }
    start();
  });

  // Follow the reading room's hour.
  var Room = window.ReadingRoom;
  if (Room && Room.phase()) Music.setMood(Room.phase());
  document.addEventListener("roomphase", function (e) { Music.setMood(e.detail); updateMusicUI(); });
  updateMusicUI();

  // If the music was playing on the previous page, pick it up again. Browsers only allow
  // audio after a gesture on this page, so resume on the reader's first click or key press.
  function resumeOnGesture(e) {
    if (e.target && e.target.closest && e.target.closest("#musicBtn")) return; // the button handles itself
    disarm();
    if (!Music.isPlaying()) start();
  }
  function disarm() {
    document.removeEventListener("pointerdown", resumeOnGesture, true);
    document.removeEventListener("keydown", resumeOnGesture, true);
  }
  if (load("gob-music") === "on") {
    now.textContent = "";
    now.appendChild(document.createTextNode("Music resumes on your next click: "));
    var t = document.createElement("i");
    t.textContent = Music.title();
    now.appendChild(t);
    document.addEventListener("pointerdown", resumeOnGesture, true);
    document.addEventListener("keydown", resumeOnGesture, true);
  }
})();
