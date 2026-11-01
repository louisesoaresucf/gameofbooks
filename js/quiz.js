/*
 * Shared quiz data and scoring for the Game of Books.
 * Loaded by both index.html (the game) and results.html (the recommendations).
 * Trope keys match the "tags" on each book in fantasy_novels.json.
 */
(function (global) {
  "use strict";

  var TROPES = {
    "chosen-one": { label: "Chosen One", blurb: "An unlikely hero discovers that fate has been waiting for them." },
    "coming-of-age": { label: "Coming of Age", blurb: "A young protagonist grows up, makes mistakes and finds out who they are." },
    "court-intrigue": { label: "Court Intrigue", blurb: "Thrones, alliances and betrayals are traded in whispers at court." },
    "cozy": { label: "Cozy Fantasy", blurb: "The stakes stay gentle and the mood is warm, like tea by the fire." },
    "dragons": { label: "Dragons", blurb: "Dragons take to the skies as foes, mounts or friends." },
    "dreamlike-literary": { label: "Dreamlike & Literary", blurb: "Lyrical prose and strange, dreamlike turns reward a slow read." },
    "epic-quest": { label: "Epic Quest", blurb: "A long road, a vital goal and a world unfolding mile by mile." },
    "faerie": { label: "Faerie & the Fair Folk", blurb: "The Fair Folk are near: beautiful, bargaining and never quite safe." },
    "fairy-tale-retelling": { label: "Fairy-Tale Retelling", blurb: "A familiar fairy tale is retold with new twists." },
    "found-family": { label: "Found Family", blurb: "Strangers and misfits become a family of their own choosing." },
    "good-vs-evil": { label: "Good vs. Evil", blurb: "Light stands against a rising darkness, with the world in the balance." },
    "gothic-horror": { label: "Gothic & Eerie", blurb: "Shadows, hauntings and a creeping sense of dread." },
    "grimdark": { label: "Grimdark", blurb: "A brutal world where heroes are scarce and morals run grey." },
    "high-seas": { label: "High Seas", blurb: "Salt spray, ships and adventures on open water." },
    "historical-fantasy": { label: "Historical Fantasy", blurb: "Real history, with the magic left in." },
    "humor": { label: "Humor", blurb: "Wit and comedy keep the pages turning with a grin." },
    "magic-school": { label: "Magic School", blurb: "Lessons, rivalries and secrets at a school for magic." },
    "mystery": { label: "Mystery", blurb: "A puzzle to unravel, with clues hidden along the way." },
    "myths-and-legends": { label: "Myths & Legends", blurb: "Gods, heroes and old legends walk the pages." },
    "non-european-settings": { label: "Beyond Europe", blurb: "Draws on cultures and myths beyond medieval Europe." },
    "portal-world": { label: "Portal to Another World", blurb: "A doorway leads out of our world into another." },
    "rogues-and-thieves": { label: "Rogues & Thieves", blurb: "Clever thieves, con artists and daring capers." },
    "romance": { label: "Romance", blurb: "Love is at the heart of the story." },
    "sword-and-sorcery": { label: "Sword & Sorcery", blurb: "Swaggering adventures of blades, sorcerers and monsters." },
    "talking-animals": { label: "Talking Animals", blurb: "Animals speak, scheme and lead their own adventures." },
    "urban-fantasy": { label: "Urban Fantasy", blurb: "Magic hides in the streets of a modern city." },
    "war-and-armies": { label: "War & Armies", blurb: "Battles, sieges and generals shape the fate of nations." },
    "witchcraft": { label: "Witchcraft", blurb: "Witches, spells, herbs and hedge magic." },
    "young-readers": { label: "Young-Reader Friendly", blurb: "A classic-feeling tale that welcomes younger readers." }
  };

  // Each answer adds (or subtracts) weight for the tropes it names.
  var QUESTIONS = [
    {
      prompt: "A door appears before you. Which one do you open?",
      answers: [
        { text: "A wardrobe at the back of a dusty spare room", weights: { "portal-world": 3, "young-readers": 1, "epic-quest": 1 } },
        { text: "The iron gates of an ancient academy of magic", weights: { "magic-school": 3, "coming-of-age": 1 } },
        { text: "A rain-slick alley door where modern magic hides", weights: { "urban-fantasy": 3, "mystery": 1 } },
        { text: "The gangplank of a ship leaving port at dawn", weights: { "high-seas": 3, "epic-quest": 1 } }
      ]
    },
    {
      prompt: "Which role would you play in the tale?",
      answers: [
        { text: "The hero a prophecy has been waiting for", weights: { "chosen-one": 3, "good-vs-evil": 1 } },
        { text: "A charming thief with one last job", weights: { "rogues-and-thieves": 3, "found-family": 1 } },
        { text: "A courtier whispering in the monarch's ear", weights: { "court-intrigue": 3 } },
        { text: "The scholar who unravels the puzzle", weights: { "mystery": 3, "magic-school": 1 } }
      ]
    },
    {
      prompt: "Choose a travelling companion.",
      answers: [
        { text: "A dragon, bonded to you for life", weights: { "dragons": 3 } },
        { text: "A wise and talkative animal", weights: { "talking-animals": 3, "young-readers": 1 } },
        { text: "A ragtag band of misfits who become family", weights: { "found-family": 3 } },
        { text: "A beautiful, untrustworthy stranger from the hollow hills", weights: { "faerie": 3, "romance": 1 } }
      ]
    },
    {
      prompt: "How should the story make you feel?",
      answers: [
        { text: "Laughing out loud", weights: { "humor": 3, "cozy": 1 } },
        { text: "Warm, safe, and wrapped in a blanket", weights: { "cozy": 3, "found-family": 1, "humor": 1 } },
        { text: "Gutted — give me blood, grit, and grey morals", weights: { "grimdark": 3, "war-and-armies": 1 } },
        { text: "Uneasy, with candles guttering in the dark", weights: { "gothic-horror": 3 } }
      ]
    },
    {
      prompt: "What about matters of the heart?",
      answers: [
        { text: "Romance front and centre, please", weights: { "romance": 3 } },
        { text: "A slow burn simmering in the background", weights: { "romance": 1.5, "found-family": 1 } },
        { text: "I'd rather watch someone grow up and find themselves", weights: { "coming-of-age": 3 } },
        { text: "Keep the kissing out of my sword fights", weights: { "romance": -2, "sword-and-sorcery": 1, "war-and-armies": 1 } }
      ]
    },
    {
      prompt: "How big are the stakes?",
      answers: [
        { text: "A Dark Lord threatens the whole world", weights: { "good-vs-evil": 3, "epic-quest": 1, "chosen-one": 1 } },
        { text: "Nations at war: sieges, generals, and campaigns", weights: { "war-and-armies": 3, "court-intrigue": 1 } },
        { text: "One swordsman, one sorcerer, one tavern brawl at a time", weights: { "sword-and-sorcery": 3 } },
        { text: "Small and personal — a village, a family, a single life", weights: { "cozy": 2, "dreamlike-literary": 1, "coming-of-age": 1 } }
      ]
    },
    {
      prompt: "Which old story should your book draw from?",
      answers: [
        { text: "Gods, heroes, and ancient myth", weights: { "myths-and-legends": 3 } },
        { text: "Fairy tales, twisted and retold", weights: { "fairy-tale-retelling": 3, "faerie": 1 } },
        { text: "Real history, with the magic left in", weights: { "historical-fantasy": 3 } },
        { text: "Legends from beyond medieval Europe", weights: { "non-european-settings": 3, "myths-and-legends": 1 } }
      ]
    },
    {
      prompt: "Pick your kind of magic.",
      answers: [
        { text: "Hedge witchery: herbs, charms, and a cauldron", weights: { "witchcraft": 3 } },
        { text: "Rigorous study, spellbooks, and exams", weights: { "magic-school": 2, "mystery": 1 } },
        { text: "Wild, old magic that lives under the hill", weights: { "faerie": 2, "myths-and-legends": 1 } },
        { text: "Strange, unexplained, running on dream logic", weights: { "dreamlike-literary": 3 } }
      ]
    },
    {
      prompt: "How do you like your prose?",
      answers: [
        { text: "Lyrical and luminous — I read for the sentences", weights: { "dreamlike-literary": 3 } },
        { text: "A fast-paced page-turner", weights: { "rogues-and-thieves": 1, "urban-fantasy": 1, "mystery": 1, "epic-quest": 1 } },
        { text: "A sprawling doorstopper with maps and appendices", weights: { "epic-quest": 2, "good-vs-evil": 1, "court-intrigue": 1, "war-and-armies": 1 } },
        { text: "Like a classic you'd read aloud at bedtime", weights: { "young-readers": 3, "talking-animals": 1 } }
      ]
    },
    {
      prompt: "Which final scene do you want to read?",
      answers: [
        { text: "Travellers coming home after a long, long road", weights: { "epic-quest": 3, "found-family": 1 } },
        { text: "A crown changing hands in a silent throne room", weights: { "court-intrigue": 2, "war-and-armies": 1 } },
        { text: "The monster finally vanquished in the dark", weights: { "gothic-horror": 2, "sword-and-sorcery": 1 } },
        { text: "Happily ever after, sealed with a kiss", weights: { "romance": 2, "fairy-tale-retelling": 1 } }
      ]
    }
  ];

  /** Turn a list of answer indexes into a trope -> weight profile. */
  function buildProfile(answerIndexes) {
    var profile = {};
    answerIndexes.forEach(function (answerIndex, questionIndex) {
      var weights = QUESTIONS[questionIndex].answers[answerIndex].weights;
      Object.keys(weights).forEach(function (trope) {
        profile[trope] = (profile[trope] || 0) + weights[trope];
      });
    });
    return profile;
  }

  /** Tropes with a positive score, strongest first. */
  function topTropes(profile, limit) {
    return Object.keys(profile)
      .filter(function (t) { return profile[t] > 0; })
      .sort(function (a, b) { return profile[b] - profile[a] || a.localeCompare(b); })
      .slice(0, limit);
  }

  /** Small deterministic hash so the same answers always give the same tie-breaks. */
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /**
   * Rank books against the profile and return the best `count`,
   * allowing at most one pick per author so the list stays varied.
   */
  function recommend(books, profile, count, seed) {
    var scored = books.map(function (book) {
      var matched = book.tags.filter(function (t) { return profile[t] > 0; });
      var score = book.tags.reduce(function (sum, t) { return sum + (profile[t] || 0); }, 0);
      return {
        book: book,
        score: score,
        matched: matched.sort(function (a, b) { return profile[b] - profile[a]; }),
        tiebreak: hash(seed + book.id)
      };
    });

    scored.sort(function (a, b) {
      return b.score - a.score ||
        b.matched.length - a.matched.length ||
        a.tiebreak - b.tiebreak;
    });

    var picks = [];
    var seenAuthors = {};
    for (var i = 0; i < scored.length && picks.length < count; i++) {
      var entry = scored[i];
      var authorKey = entry.book.authors.join("|");
      if (seenAuthors[authorKey]) continue;
      seenAuthors[authorKey] = true;
      picks.push(entry);
    }
    return picks;
  }

  /** Parse "?a=0123..." into answer indexes, or null if invalid. */
  function parseAnswers(search) {
    var match = /[?&]a=([0-9]+)/.exec(search || "");
    if (!match || match[1].length !== QUESTIONS.length) return null;
    var answers = match[1].split("").map(Number);
    for (var i = 0; i < answers.length; i++) {
      if (answers[i] >= QUESTIONS[i].answers.length) return null;
    }
    return answers;
  }

  global.GameOfBooks = {
    TROPES: TROPES,
    QUESTIONS: QUESTIONS,
    buildProfile: buildProfile,
    topTropes: topTropes,
    recommend: recommend,
    hash: hash,
    parseAnswers: parseAnswers
  };
})(window);
