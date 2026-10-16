// ⚽ PENALTY SHOOTOUT: pick a team, then take turns shooting and saving!
(function () {
  "use strict";

  // ---------- The teams (rename or recolour them here) ----------
  // shirt/trim = team colours, gk = goalkeeper kit colour,
  // players = the order they take penalties in, keeper = the goalkeeper,
  // newSignings = players who joined in the summer 2026 transfer window
  // (squads as of October 2026)
  const TEAMS = [
    { name: "Manchester Red", shirt: "#dc2626", trim: "#ffffff", gk: "#22c55e",
      players: ["Bruno Fernandes", "Bryan Mbeumo", "Matheus Cunha", "Benjamin Šeško", "Andrey Santos"],
      newSignings: ["Andrey Santos"],
      keeper: "Senne Lammens" },
    { name: "Manchester Blue", shirt: "#38bdf8", trim: "#ffffff", gk: "#f97316",
      players: ["Erling Haaland", "Phil Foden", "Enzo Fernández", "Elliot Anderson", "Iliman Ndiaye"],
      newSignings: ["Enzo Fernández", "Elliot Anderson", "Iliman Ndiaye"],
      keeper: "Gianluigi Donnarumma" },
    { name: "FC Barkalona", shirt: "#1d4ed8", trim: "#b91c1c", gk: "#facc15", stripes: true,
      players: ["Lamine Yamal", "Raphinha", "Pedri", "Anthony Gordon", "Rodri"],
      newSignings: ["Anthony Gordon", "Rodri"],
      keeper: "Joan García" },
    { name: "Madrid White", shirt: "#f8fafc", trim: "#facc15", gk: "#a855f7",
      players: ["Kylian Mbappé", "Vinícius Júnior", "Jude Bellingham", "Yan Diomande", "Bernardo Silva"],
      newSignings: ["Yan Diomande", "Bernardo Silva"],
      keeper: "Thibaut Courtois" },
    { name: "Paris", shirt: "#1e3a8a", trim: "#dc2626", gk: "#22d3ee",
      players: ["Ousmane Dembélé", "Khvicha Kvaratskhelia", "Désiré Doué", "Ferran Torres", "Maghnes Akliouche"],
      newSignings: ["Ferran Torres", "Maghnes Akliouche"],
      keeper: "Lucas Chevalier" },
    { name: "Inter", shirt: "#1d4ed8", trim: "#0f172a", gk: "#f97316", stripes: true,
      players: ["Lautaro Martínez", "Marcus Thuram", "Hakan Çalhanoğlu", "Curtis Jones", "John Stones"],
      newSignings: ["Curtis Jones", "John Stones"],
      keeper: "Josep Martínez" },
    { name: "Liverp", shirt: "#b91c1c", trim: "#fde047", gk: "#14b8a6",
      players: ["Florian Wirtz", "Alexander Isak", "Dominik Szoboszlai", "Cody Gakpo", "Jérémy Jacquet"],
      newSignings: ["Jérémy Jacquet"],
      keeper: "Alisson Becker" },
    { name: "Bay. Munich", shirt: "#dc2626", trim: "#1e3a8a", gk: "#84cc16",
      players: ["Harry Kane", "Michael Olise", "Luis Díaz", "Ismael Saibari", "Nathaniel Brown"],
      newSignings: ["Ismael Saibari", "Nathaniel Brown"],
      keeper: "Manuel Neuer" },
    { name: "Arson", shirt: "#ef4444", trim: "#ffffff", gk: "#6366f1",
      players: ["Bukayo Saka", "Martin Ødegaard", "Viktor Gyökeres", "Bruno Guimarães", "Piero Hincapié"],
      newSignings: ["Bruno Guimarães", "Piero Hincapié"],
      keeper: "David Raya" },
    { name: "Juve Stripes", shirt: "#ffffff", trim: "#111827", gk: "#ec4899", stripes: true,
      players: ["Kenan Yıldız", "Teun Koopmeiners", "Weston McKennie", "Manuel Locatelli", "Jhon Lucumí"],
      newSignings: ["Jhon Lucumí"],
      keeper: "Guglielmo Vicario" }
  ];

  const KICKS = 5; // kicks each before sudden death

  // Who has won? Returns "you", "opp" or null if the shootout goes on.
  // Standard rules: stop early once a team can't be caught; if it's level
  // after 5 kicks each, play sudden death rounds.
  function matchWinner(taken, score) {
    if (taken.you >= KICKS && taken.opp >= KICKS) {
      if (taken.you === taken.opp && score.you !== score.opp) {
        return score.you > score.opp ? "you" : "opp";
      }
      return null;
    }
    const leftYou = Math.max(0, KICKS - taken.you);
    const leftOpp = Math.max(0, KICKS - taken.opp);
    if (score.you > score.opp + leftOpp) return "you";
    if (score.opp > score.you + leftYou) return "opp";
    return null;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { matchWinner, TEAMS };
  }

  const canvas = typeof document !== "undefined" && document.querySelector("#soccerCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const pickerBox = document.querySelector("#soccerPicker");
  const teamsBox = document.querySelector("#soccerTeams");
  const matchBox = document.querySelector("#soccerMatch");
  const boardBox = document.querySelector("#soccerBoard");
  const messageBox = document.querySelector("#soccerMessage");
  const againButton = document.querySelector("#soccerAgain");
  const changeButton = document.querySelector("#soccerChange");
  const winsDisplay = document.querySelector("#soccerWins");

  // Everything is drawn on a 400 x 300 field and scaled to fit the screen
  const W = 400;
  const H = 300;
  const GOAL = { l: 90, r: 310, t: 40, b: 140 };
  const SPOT = { x: 200, y: 205 };
  const GOALIE_HOME = { x: 200, y: 112 };
  const BALL_R = 13;

  const SHOOT_MS = 550;
  const DIVE_MS = 420;
  const RESULT_MS = 1300;
  const SAVE_RADIUS = 46;
  const WINS_KEY = "soccerShootoutWins";

  let you = null;
  let opp = null;
  let mode = "idle"; // idle, wait, aim (you shoot), dive (you keep), shoot, result
  let first = "you";
  let turn = 0;
  let shooter = "you";
  let score = { you: 0, opp: 0 };
  let taken = { you: 0, opp: 0 };
  let results = { you: [], opp: [] };
  let shot = { x: 200, y: 90 };
  let goalieTarget = { x: 200, y: 90 };
  let outcome = "";
  let kicker = "";
  let kickerIsNew = false;
  let startTime = 0;
  let resultTime = 0;
  let waitUntil = 0;
  let afterWait = null;
  let wins = 0;
  const aim = { x: 200, y: 90, visible: false };

  // ---------- Setup ----------
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  try {
    wins = Number(localStorage.getItem(WINS_KEY)) || 0;
  } catch (error) {
    wins = 0;
  }
  winsDisplay.textContent = wins;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function easeOut(t) { return 1 - (1 - t) * (1 - t); }
  function say(text) { messageBox.textContent = text; }
  function other(who) { return who === "you" ? "opp" : "you"; }
  function teamOf(who) { return who === "you" ? you : opp; }

  function crestBackground(team) {
    if (team.stripes) {
      return "repeating-linear-gradient(90deg, " + team.shirt + " 0 6px, " + team.trim + " 6px 12px)";
    }
    return "linear-gradient(135deg, " + team.shirt + " 0 55%, " + team.trim + " 55% 100%)";
  }

  // ---------- Team picker ----------
  TEAMS.forEach(function (team) {
    const button = document.createElement("button");
    const crest = document.createElement("span");
    const name = document.createElement("span");

    button.type = "button";
    button.className = "team-btn";
    crest.className = "crest big";
    crest.style.background = crestBackground(team);
    name.textContent = team.name;

    button.append(crest, name);
    button.addEventListener("click", function () { startMatch(team); });
    teamsBox.append(button);
  });

  // ---------- Scoreboard ----------
  function renderBoard() {
    boardBox.textContent = "";
    ["you", "opp"].forEach(function (who) {
      const team = teamOf(who);
      const row = document.createElement("div");
      const crest = document.createElement("span");
      const name = document.createElement("span");
      const dots = document.createElement("span");
      const total = document.createElement("strong");

      row.className = "soccer-row" + (mode !== "idle" && shooter === who ? " active" : "");
      crest.className = "crest";
      crest.style.background = crestBackground(team);
      name.className = "soccer-name";
      name.textContent = team.name + (who === "you" ? " (you)" : "");

      dots.className = "soccer-dots";
      const slots = Math.max(KICKS, results[who].length);
      for (let i = 0; i < slots; i++) {
        const r = results[who][i];
        dots.append(r === "goal" ? "✅" : r === "miss" ? "❌" : "⚪");
      }

      total.className = "soccer-score";
      total.textContent = score[who];

      row.append(crest, name, dots, total);
      boardBox.append(row);
    });
  }

  // ---------- Match flow ----------
  function wait(ms, fn, now) {
    mode = "wait";
    waitUntil = now + ms;
    afterWait = fn;
  }

  function startMatch(team) {
    you = team;
    const others = TEAMS.filter(function (t) { return t !== team; });
    opp = others[Math.floor(Math.random() * others.length)];

    score = { you: 0, opp: 0 };
    taken = { you: 0, opp: 0 };
    results = { you: [], opp: [] };
    turn = 0;
    first = Math.random() < 0.5 ? "you" : "opp";
    shooter = first;

    pickerBox.hidden = true;
    matchBox.hidden = false;
    againButton.hidden = true;
    changeButton.hidden = false;

    mode = "wait";
    waitUntil = Infinity;
    renderBoard();
    say("🪙 Coin toss: " + teamOf(first).name + " shoot first!");
    wait(1600, beginTurn, performance.now());
    canvas.focus({ preventScroll: true });
  }

  function beginTurn() {
    shooter = (turn % 2 === 0) ? first : other(first);
    const suddenDeath = taken.you >= KICKS && taken.opp >= KICKS;
    const prefix = suddenDeath ? "SUDDEN DEATH! " : "";

    const team = teamOf(shooter);
    kicker = team.players[taken[shooter] % team.players.length];
    kickerIsNew = team.newSignings.indexOf(kicker) !== -1;
    const who = kicker + (kickerIsNew ? " (new signing ★)" : "");

    if (shooter === "you") {
      mode = "aim";
      say(prefix + who + " steps up for " + team.name + ". Tap where you want to shoot.");
    } else {
      mode = "dive";
      say(prefix + who + " steps up for " + team.name + ". Tap where " + you.keeper + " should dive 🧤");
    }
    renderBoard();
  }

  // You shoot: you pick the target, the keeper guesses at random
  function playerShoots(x, y, now) {
    shot = { x: clamp(x, 10, W - 10), y: clamp(y, 8, 170) };
    // The keeper doesn't peek: he dives to a random spot in the goal.
    // Corner shots are harder to save, but easier to miss.
    const sx = Math.random();
    const sy = Math.random();
    goalieTarget = {
      x: GOAL.l + 20 + (GOAL.r - GOAL.l - 40) * sx,
      y: GOAL.t + 25 + (GOAL.b - GOAL.t - 35) * sy
    };
    launch(now);
  }

  // Opponent shoots: you pick where the keeper dives, they pick a corner
  function playerDives(x, y, now) {
    goalieTarget = {
      x: clamp(x, GOAL.l + 10, GOAL.r - 10),
      y: clamp(y, GOAL.t + 10, GOAL.b - 5)
    };
    const w = GOAL.r - GOAL.l;
    const h = GOAL.b - GOAL.t;

    if (Math.random() < 0.12) {
      // Misses: either the post or wide
      const hitPost = Math.random() < 0.5;
      const side = Math.random() < 0.5 ? -1 : 1;
      const edge = side < 0 ? GOAL.l : GOAL.r;
      if (Math.random() < 0.75) {
        shot = { x: edge + side * (hitPost ? 6 : 38), y: GOAL.t + h * (0.15 + Math.random() * 0.7) };
      } else {
        shot = { x: GOAL.l + w * (0.2 + Math.random() * 0.6), y: GOAL.t - (hitPost ? 6 : 34) };
      }
    } else {
      // Most penalties go to the corners
      let fx;
      if (Math.random() < 0.7) {
        fx = Math.random() < 0.5 ? 0.08 + Math.random() * 0.22 : 0.7 + Math.random() * 0.22;
      } else {
        fx = 0.3 + Math.random() * 0.4;
      }
      shot = { x: GOAL.l + w * fx, y: GOAL.t + h * (0.1 + Math.random() * 0.8) };
    }
    launch(now);
  }

  function launch(now) {
    mode = "shoot";
    startTime = now;
  }

  function resolveShot(now) {
    const inside = shot.x >= GOAL.l && shot.x <= GOAL.r && shot.y >= GOAL.t && shot.y <= GOAL.b;
    const nearFrame = shot.x >= GOAL.l - 12 && shot.x <= GOAL.r + 12 && shot.y >= GOAL.t - 12 && shot.y <= GOAL.b + 12;
    const reached = Math.hypot(shot.x - goalieTarget.x, shot.y - goalieTarget.y) < SAVE_RADIUS;
    const team = teamOf(shooter);
    const keeper = teamOf(other(shooter)).keeper;

    if (inside && reached) {
      outcome = "saved";
      say(shooter === "you" ? "🧤 " + keeper + " saves it!" : "🧤 SAVED! " + keeper + " keeps it out! Amazing!");
    } else if (inside) {
      outcome = "goal";
      say(shooter === "you" ? "⚽ GOAL! " + kicker + " scores!" : "😬 " + kicker + " scores for " + team.name + ".");
    } else if (nearFrame) {
      outcome = "post";
      say("😬 " + kicker + " hits the post!");
    } else {
      outcome = "wide";
      say("😅 " + kicker + " misses wide!");
    }

    taken[shooter]++;
    results[shooter].push(outcome === "goal" ? "goal" : "miss");
    if (outcome === "goal") score[shooter]++;

    mode = "result";
    resultTime = now;
    renderBoard();
  }

  function afterKick() {
    const winner = matchWinner(taken, score);
    if (winner) {
      endMatch(winner);
    } else {
      turn++;
      beginTurn();
    }
  }

  function endMatch(winner) {
    mode = "idle";
    const a = score.you;
    const b = score.opp;

    if (winner === "you") {
      wins++;
      winsDisplay.textContent = wins;
      try {
        localStorage.setItem(WINS_KEY, String(wins));
      } catch (error) {
        // Storage unavailable: wins last for this visit only
      }
      say("🏆 " + you.name + " win the shootout " + a + "-" + b + "! 🎉");
    } else {
      say("😢 " + opp.name + " win the shootout " + b + "-" + a + ". Try again!");
    }
    renderBoard();
    againButton.hidden = false;
  }

  againButton.addEventListener("click", function () { startMatch(you); });

  changeButton.addEventListener("click", function () {
    mode = "idle";
    matchBox.hidden = true;
    pickerBox.hidden = false;
  });

  // ---------- Drawing ----------
  function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
    ctx.fill();
  }

  function drawField() {
    ctx.fillStyle = "#15803d";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#16a34a";
    for (let y = 0; y < H; y += 60) ctx.fillRect(0, y, W, 30);

    ctx.strokeStyle = "#ffffffcc";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, GOAL.b);
    ctx.lineTo(W - 10, GOAL.b);
    ctx.stroke();
    ctx.strokeRect(50, GOAL.b, W - 100, 100);

    ctx.fillStyle = "#ffffffcc";
    ctx.beginPath();
    ctx.arc(SPOT.x, SPOT.y + BALL_R + 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawNet() {
    ctx.fillStyle = "#0f3d1f66";
    ctx.fillRect(GOAL.l, GOAL.t, GOAL.r - GOAL.l, GOAL.b - GOAL.t);
    ctx.strokeStyle = "#ffffff44";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = GOAL.l; x <= GOAL.r; x += 12) {
      ctx.moveTo(x, GOAL.t);
      ctx.lineTo(x, GOAL.b);
    }
    for (let y = GOAL.t; y <= GOAL.b; y += 12) {
      ctx.moveTo(GOAL.l, y);
      ctx.lineTo(GOAL.r, y);
    }
    ctx.stroke();
  }

  function drawPosts() {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(GOAL.l, GOAL.b);
    ctx.lineTo(GOAL.l, GOAL.t);
    ctx.lineTo(GOAL.r, GOAL.t);
    ctx.lineTo(GOAL.r, GOAL.b);
    ctx.stroke();
  }

  function drawGoalie(now) {
    const keeperTeam = shooter === "you" ? opp : you;
    const color = keeperTeam ? keeperTeam.gk : "#facc15";

    let p = 0;
    if (mode === "shoot" || mode === "result") {
      p = easeOut(clamp((now - startTime) / DIVE_MS, 0, 1));
    }
    const x = lerp(GOALIE_HOME.x, goalieTarget.x, p);
    const y = lerp(GOALIE_HOME.y, goalieTarget.y, p);
    const lean = ((goalieTarget.x - GOALIE_HOME.x) / 110) * 1.1 * p;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean);

    ctx.fillStyle = "#1f2937";
    ctx.fillRect(-10, 16, 8, 15);
    ctx.fillRect(2, 16, 8, 15);

    ctx.strokeStyle = color;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.lineTo(-30, -26);
    ctx.moveTo(12, -12);
    ctx.lineTo(30, -26);
    ctx.stroke();

    ctx.fillStyle = color;
    roundedRect(-13, -19, 26, 38, 6);

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-30, -26, 7, 0, Math.PI * 2);
    ctx.arc(30, -26, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fcd5b0";
    ctx.beginPath();
    ctx.arc(0, -28, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // The player taking the penalty, in his team's colours
  function drawShooter(now) {
    const team = teamOf(shooter);
    if (!team) return;

    let step = 0;
    if (mode === "shoot") step = easeOut(clamp((now - startTime) / 180, 0, 1));
    else if (mode === "result") step = 1;

    const x = SPOT.x - 36 + step * 14;
    const y = SPOT.y + 4 - step * 6;

    ctx.fillStyle = "#1f2937";
    ctx.fillRect(x - 8, y + 16, 7, 18);
    ctx.fillRect(x + 1, y + 16, 7, 18);

    ctx.fillStyle = team.shirt;
    roundedRect(x - 12, y - 14, 24, 32, 6);
    ctx.fillStyle = team.trim;
    ctx.fillRect(x - 12, y - 2, 24, 4);

    ctx.fillStyle = "#fcd5b0";
    ctx.beginPath();
    ctx.arc(x, y - 23, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3b2a1a";
    ctx.beginPath();
    ctx.arc(x, y - 26, 9, Math.PI, 0);
    ctx.fill();

    if (kicker) {
      ctx.font = "bold 13px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 4;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0b1020";
      const tag = kicker + (kickerIsNew ? " ★" : "");
      ctx.strokeText(tag, x, y - 44);
      ctx.fillStyle = kickerIsNew ? "#fde047" : "#ffffff";
      ctx.fillText(tag, x, y - 44);
    }
  }

  function ballPosition(now) {
    if (mode === "shoot") {
      const t = clamp((now - startTime) / SHOOT_MS, 0, 1);
      const e = easeOut(t);
      return {
        x: lerp(SPOT.x, shot.x, e),
        y: lerp(SPOT.y, shot.y, e) - Math.sin(Math.PI * t) * 22,
        scale: lerp(1, 0.6, e)
      };
    }
    if (mode === "result") {
      const rt = (now - resultTime) / 1000;
      if (outcome === "goal") {
        return { x: shot.x, y: shot.y + rt * 8, scale: 0.6 };
      }
      if (outcome === "saved") {
        let dx = shot.x - goalieTarget.x;
        let dy = shot.y - goalieTarget.y;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;
        return { x: shot.x + dx * rt * 140, y: shot.y + dy * rt * 60 + 220 * rt * rt, scale: 0.6 };
      }
      const dx = shot.x - SPOT.x;
      const dy = shot.y - SPOT.y;
      const len = Math.hypot(dx, dy) || 1;
      return {
        x: shot.x + (dx / len) * rt * 140,
        y: shot.y + (dy / len) * rt * 140,
        scale: Math.max(0.3, 0.6 - rt * 0.3)
      };
    }
    return { x: SPOT.x, y: SPOT.y, scale: 1 };
  }

  function drawBall(now) {
    const b = ballPosition(now);
    const size = Math.round(BALL_R * 2 * b.scale + 6);
    ctx.font = size + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000000";
    ctx.fillText("⚽", b.x, b.y);
  }

  function drawResultText(now) {
    if (mode !== "result") return;
    const labels = {
      goal: shooter === "you" ? ["GOAL! ⚽", "#fde047"] : ["THEY SCORE ⚽", "#fca5a5"],
      saved: shooter === "you" ? ["SAVED! 🧤", "#fca5a5"] : ["YOU SAVED IT! 🧤", "#86efac"],
      post: ["POST! 😬", "#fdba74"],
      wide: ["WIDE! 😅", "#fdba74"]
    };
    const label = labels[outcome];
    const pop = 1 + 0.15 * Math.sin(clamp((now - resultTime) / 300, 0, 1) * Math.PI);

    ctx.save();
    ctx.translate(W / 2, 185);
    ctx.scale(pop, pop);
    ctx.font = "bold 34px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 7;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e1b4b";
    ctx.strokeText(label[0], 0, 0);
    ctx.fillStyle = label[1];
    ctx.fillText(label[0], 0, 0);
    ctx.restore();
  }

  function drawAim() {
    if ((mode !== "aim" && mode !== "dive") || !aim.visible) return;
    ctx.strokeStyle = mode === "aim" ? "#fde047" : "#86efac";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(aim.x, aim.y, 12, 0, Math.PI * 2);
    ctx.moveTo(aim.x - 20, aim.y);
    ctx.lineTo(aim.x - 6, aim.y);
    ctx.moveTo(aim.x + 6, aim.y);
    ctx.lineTo(aim.x + 20, aim.y);
    ctx.moveTo(aim.x, aim.y - 20);
    ctx.lineTo(aim.x, aim.y - 6);
    ctx.moveTo(aim.x, aim.y + 6);
    ctx.lineTo(aim.x, aim.y + 20);
    ctx.stroke();
  }

  function frame(now) {
    if (mode === "wait" && now >= waitUntil && afterWait) {
      const fn = afterWait;
      afterWait = null;
      fn();
    }
    if (mode === "shoot" && now - startTime >= SHOOT_MS) resolveShot(now);
    if (mode === "result" && now - resultTime >= RESULT_MS) afterKick();

    ctx.clearRect(0, 0, W, H);
    drawField();
    drawNet();
    drawGoalie(now);
    drawShooter(now);
    drawBall(now);
    drawPosts();
    drawResultText(now);
    drawAim();

    requestAnimationFrame(frame);
  }

  // ---------- Controls ----------
  function toField(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (W / rect.width),
      y: (event.clientY - rect.top) * (H / rect.height)
    };
  }

  function act(x, y) {
    const now = performance.now();
    if (mode === "aim") playerShoots(x, y, now);
    else if (mode === "dive") playerDives(x, y, now);
  }

  canvas.addEventListener("pointermove", function (event) {
    if (event.pointerType !== "mouse") return;
    const p = toField(event);
    aim.x = p.x;
    aim.y = p.y;
    aim.visible = true;
  });

  canvas.addEventListener("pointerdown", function (event) {
    const p = toField(event);
    act(p.x, p.y);
  });

  // Keyboard: arrow keys move the aim, Enter or Space shoots / dives
  canvas.addEventListener("keydown", function (event) {
    const step = 12;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };

    if (moves[event.key]) {
      event.preventDefault();
      aim.visible = true;
      aim.x = clamp(aim.x + moves[event.key][0], 10, W - 10);
      aim.y = clamp(aim.y + moves[event.key][1], 8, 170);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      aim.visible = true;
      act(aim.x, aim.y);
    }
  });

  requestAnimationFrame(frame);
})();
