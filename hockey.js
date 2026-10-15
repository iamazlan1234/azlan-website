// 🏒 PUPPET HOCKEY: an air-hockey style game with a shared leaderboard.
(function () {
  "use strict";

  const FB = (typeof FIREBASE_URL === "string" && FIREBASE_URL) ? FIREBASE_URL.replace(/\/$/, "") : "";
  const W = 400;
  const H = 300;
  const PUCK_R = 9;
  const PAD_R = 22;
  const GOAL_TOP = 105;
  const GOAL_BOTTOM = 195;
  const MATCH_SECONDS = 60;
  const AI_SPEED = 190;
  const PLAYER_SPEED = 900;

  const canvas = document.querySelector("#hockeyCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const youEl = document.querySelector("#hkYou");
  const aiEl = document.querySelector("#hkAi");
  const timeEl = document.querySelector("#hkTime");
  const message = document.querySelector("#hkMessage");
  const startBtn = document.querySelector("#hkStart");
  const formBox = document.querySelector("#hkForm");
  const youScoreEl = document.querySelector("#hkYouScore");
  const nameIn = document.querySelector("#hkName");
  const submitBtn = document.querySelector("#hkSubmit");
  const formStatus = document.querySelector("#hkFormStatus");
  const boardStatus = document.querySelector("#hkBoardStatus");
  const boardList = document.querySelector("#hkBoard");

  let puck, player, ai, target, running, timeLeft, youGoals, aiGoals, flash, flashTime, scored;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (W / rect.width),
      y: (event.clientY - rect.top) * (H / rect.height)
    };
  }

  function servePuck(towardPlayer) {
    puck = {
      x: W / 2,
      y: H / 2,
      vx: (towardPlayer ? 1 : -1) * (130 + Math.random() * 50),
      vy: (Math.random() - 0.5) * 120
    };
  }

  function bounceOff(p) {
    const dx = puck.x - p.x;
    const dy = puck.y - p.y;
    const d = Math.hypot(dx, dy);
    const min = PUCK_R + PAD_R;
    if (d >= min || d === 0) return;
    const nx = dx / d;
    const ny = dy / d;
    puck.x = p.x + nx * min;
    puck.y = p.y + ny * min;
    const rvx = puck.vx - p.vx;
    const rvy = puck.vy - p.vy;
    const vn = rvx * nx + rvy * ny;
    if (vn < 0) {
      puck.vx -= 1.9 * vn * nx;
      puck.vy -= 1.9 * vn * ny;
    }
    const speed = Math.hypot(puck.vx, puck.vy);
    if (speed > 900) {
      puck.vx = puck.vx / speed * 900;
      puck.vy = puck.vy / speed * 900;
    }
  }

  function showFlash(text) {
    flash = text;
    flashTime = 1.2;
  }

  function updateHud() {
    youEl.textContent = youGoals;
    aiEl.textContent = aiGoals;
    timeEl.textContent = Math.max(0, Math.ceil(timeLeft));
  }

  function step(dt) {
    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateHud();
      finish();
      return;
    }

    // Your puppet follows the pointer (bottom half only)
    const prevPlayer = { x: player.x, y: player.y };
    if (target) {
      const tx = clamp(target.x, PAD_R, W - PAD_R);
      const ty = clamp(target.y, H / 2 + PAD_R, H - PAD_R);
      const sp = PLAYER_SPEED * dt;
      player.x += clamp(tx - player.x, -sp, sp);
      player.y += clamp(ty - player.y, -sp, sp);
    }
    player.vx = (player.x - prevPlayer.x) / dt;
    player.vy = (player.y - prevPlayer.y) / dt;

    // Computer puppet chases the puck in the top half
    const prevAi = { x: ai.x, y: ai.y };
    const aiTx = clamp(puck.x, PAD_R, W - PAD_R);
    const aiTy = clamp(puck.y < H / 2 ? puck.y : H * 0.25, PAD_R, H / 2 - PAD_R);
    const asp = AI_SPEED * dt;
    ai.x += clamp(aiTx - ai.x, -asp, asp);
    ai.y += clamp(aiTy - ai.y, -asp, asp);
    ai.vx = (ai.x - prevAi.x) / dt;
    ai.vy = (ai.y - prevAi.y) / dt;

    // Puck movement with a little friction
    const friction = Math.pow(0.992, dt * 60);
    puck.vx *= friction;
    puck.vy *= friction;
    puck.x += puck.vx * dt;
    puck.y += puck.vy * dt;

    bounceOff(player);
    bounceOff(ai);

    // Top and bottom walls
    if (puck.y < PUCK_R) { puck.y = PUCK_R; puck.vy = Math.abs(puck.vy) * 0.9; }
    if (puck.y > H - PUCK_R) { puck.y = H - PUCK_R; puck.vy = -Math.abs(puck.vy) * 0.9; }

    // Side walls, with goal mouths
    const inMouth = puck.y > GOAL_TOP && puck.y < GOAL_BOTTOM;
    if (puck.x > W - PUCK_R && !inMouth) { puck.x = W - PUCK_R; puck.vx = -Math.abs(puck.vx) * 0.9; }
    if (puck.x < PUCK_R && !inMouth) { puck.x = PUCK_R; puck.vx = Math.abs(puck.vx) * 0.9; }

    // You score into the right goal, the computer into the left
    if (puck.x > W + PUCK_R) {
      youGoals++;
      showFlash("⚽ GOAL! You scored!");
      servePuck(false);
    } else if (puck.x < -PUCK_R) {
      aiGoals++;
      showFlash("🤖 The computer scores!");
      servePuck(true);
    }

    flashTime -= dt;
    if (flashTime <= 0) flash = "";
    updateHud();
  }

  function drawPuppet(x, y, color, face) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, PAD_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffffcc";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = "22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";
    ctx.fillText(face, x, y + 1);
  }

  function draw() {
    // Ice
    const ice = ctx.createLinearGradient(0, 0, W, H);
    ice.addColorStop(0, "#e0f2fe");
    ice.addColorStop(1, "#bae6fd");
    ctx.fillStyle = ice;
    ctx.fillRect(0, 0, W, H);

    // Lines
    ctx.strokeStyle = "#ef4444aa";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.strokeStyle = "#38bdf8aa";
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 40, 0, Math.PI * 2);
    ctx.stroke();

    // Goals (left belongs to the computer, right to you)
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(W - 6, GOAL_TOP, 6, GOAL_BOTTOM - GOAL_TOP);
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(0, GOAL_TOP, 6, GOAL_BOTTOM - GOAL_TOP);

    // Walls
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, GOAL_TOP);
    ctx.moveTo(W, GOAL_BOTTOM); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.lineTo(0, GOAL_BOTTOM);
    ctx.moveTo(0, GOAL_TOP); ctx.lineTo(0, 0);
    ctx.stroke();

    // Puck
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.arc(puck.x, puck.y, PUCK_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f8fafc";
    ctx.lineWidth = 2;
    ctx.stroke();

    drawPuppet(ai.x, ai.y, "#ef4444", "🤖");
    drawPuppet(player.x, player.y, "#22c55e", "🎭");

    if (flash) {
      ctx.font = "bold 24px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 5;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0f172a";
      ctx.strokeText(flash, W / 2, H / 2 - 60);
      ctx.fillStyle = "#fde047";
      ctx.fillText(flash, W / 2, H / 2 - 60);
    }
  }

  let last = 0;
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;
    if (running) step(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function finish() {
    running = false;
    target = null;
    startBtn.hidden = false;
    startBtn.textContent = "Play Again";
    message.textContent = "🏁 Full time! You " + youGoals + " – " + aiGoals + " computer.";
    if (youGoals > 0) {
      youScoreEl.textContent = youGoals;
      nameIn.value = (function () { try { return localStorage.getItem("hkName") || ""; } catch (e) { return ""; } })();
      formStatus.textContent = "";
      submitBtn.disabled = false;
      formBox.hidden = false;
      nameIn.focus();
    } else {
      message.textContent += " Try again to get on the leaderboard!";
    }
  }

  function renderBoard(entries) {
    boardList.textContent = "";
    if (entries.length === 0) {
      boardStatus.textContent = "No scores yet. Be the first!";
      return;
    }
    boardStatus.textContent = "";
    entries.forEach(function (entry) {
      const item = document.createElement("li");
      const name = document.createElement("span");
      const score = document.createElement("strong");
      name.textContent = entry.name;
      score.textContent = entry.score;
      item.append(name, score);
      boardList.append(item);
    });
  }

  async function loadBoard() {
    if (!FB) {
      boardStatus.textContent = "The leaderboard isn't connected yet.";
      return;
    }
    try {
      const query = "?orderBy=" + encodeURIComponent('"score"') + "&limitToLast=10";
      const response = await fetch(FB + "/hockeyScores.json" + query);
      if (!response.ok) throw new Error("Request failed: " + response.status);
      const data = (await response.json()) || {};
      const entries = Object.values(data)
        .filter(function (e) { return e && typeof e.name === "string" && Number.isFinite(e.score); })
        .sort(function (a, b) { return b.score - a.score; })
        .slice(0, 10);
      renderBoard(entries);
    } catch (error) {
      boardStatus.textContent = "Couldn't load the leaderboard. Try again later.";
    }
  }

  formBox.addEventListener("submit", async function (event) {
    event.preventDefault();
    const name = nameIn.value.trim().slice(0, 20);
    if (!name) {
      formStatus.textContent = "Please type your name.";
      return;
    }
    if (!FB) {
      formStatus.textContent = "The leaderboard isn't connected yet. Please tell Azlan!";
      return;
    }
    submitBtn.disabled = true;
    formStatus.textContent = "Saving…";
    try {
      const response = await fetch(FB + "/hockeyScores.json", {
        method: "POST",
        body: JSON.stringify({ name: name, score: Math.min(youGoals, 50), time: Date.now() })
      });
      if (!response.ok) throw new Error("Request failed: " + response.status);
      try { localStorage.setItem("hkName", name); } catch (error) { /* ignore */ }
      formStatus.textContent = "✅ Saved to the leaderboard!";
      formBox.hidden = true;
      await loadBoard();
    } catch (error) {
      formStatus.textContent = "Couldn't save your score. Please try again.";
      submitBtn.disabled = false;
    }
  });

  canvas.addEventListener("pointerdown", function (event) {
    if (!running) return;
    target = toCanvas(event);
    event.preventDefault();
  });
  canvas.addEventListener("pointermove", function (event) {
    if (!running) return;
    if (event.pointerType === "mouse" || event.buttons) target = toCanvas(event);
  });

  // Arrow keys nudge the puppet
  canvas.addEventListener("keydown", function (event) {
    const moves = { ArrowLeft: [-30, 0], ArrowRight: [30, 0], ArrowUp: [0, -30], ArrowDown: [0, 30] };
    if (!running || !moves[event.key]) return;
    event.preventDefault();
    target = { x: player.x + moves[event.key][0], y: player.y + moves[event.key][1] };
  });

  startBtn.addEventListener("click", function () {
    player = { x: W / 2, y: H - 40, vx: 0, vy: 0 };
    ai = { x: W / 2, y: 40, vx: 0, vy: 0 };
    target = null;
    youGoals = 0;
    aiGoals = 0;
    timeLeft = MATCH_SECONDS;
    flash = "";
    formBox.hidden = true;
    servePuck(Math.random() < 0.5);
    running = true;
    startBtn.hidden = true;
    message.textContent = "Go! Shoot the puck into the 🤖 goal on the right!";
    updateHud();
  });

  player = { x: W / 2, y: H - 40, vx: 0, vy: 0 };
  ai = { x: W / 2, y: 40, vx: 0, vy: 0 };
  puck = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
  youGoals = 0;
  aiGoals = 0;
  timeLeft = MATCH_SECONDS;
  updateHud();
  loadBoard();
  requestAnimationFrame(frame);
})();
