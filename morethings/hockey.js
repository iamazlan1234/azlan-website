// 🏒 PUPPET HOCKEY: an original side-view ice hockey game with rubbery puppet players.
// Controls: A/D or arrow keys to skate, hold F to charge a shot and release to fire,
// S to check (shove) the opponent. Mouse/touch: hold to charge, release to shoot.
(function () {
  "use strict";

  const FB = (typeof FIREBASE_URL === "string" && FIREBASE_URL) ? FIREBASE_URL.replace(/\/$/, "") : "";
  const W = 400;
  const H = 300;
  const ICE = 238;             // y of the ice surface
  const BOARD_L = 12;          // inside edge of the boards
  const BOARD_R = 388;
  const NET_TOP = ICE - 78;    // top of the goal opening
  const NET_BOTTOM = ICE - 6;
  const GRAVITY = 900;
  const MATCH_SECONDS = 60;
  const SKATE_ACCEL = 1100;
  const SKATE_MAX = 210;
  const CPU_MAX = 190;

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

  let you, cpu, puck, running, timeLeft, youGoals, aiGoals, flash, flashT, keys, mouseDown, last, sTimer;
  let t = 0;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function makePlayer(x, facing, jersey, number, label, ai) {
    return { x: x, vx: 0, facing: facing, jersey: jersey, number: number, label: label, ai: ai,
             charge: 0, charging: false, swing: 0, checkT: 0, squash: 0, phase: Math.random() * 6 };
  }

  function resetPositions() {
    you.x = 110; you.vx = 0; you.facing = 1;
    cpu.x = 290; cpu.vx = 0; cpu.facing = -1;
  }

  function servePuck(towardYou) {
    puck = { x: W / 2, y: ICE - 6, vx: 0, vy: 0, owner: null };
    if (towardYou) puck.vx = 0;
  }

  function bladeX(p) { return p.x + p.facing * 34; }
  function bladeY() { return ICE - 6; }

  function shootFrom(p, power) {
    puck.owner = null;
    puck.x = bladeX(p);
    puck.y = bladeY() - 6;
    const speed = 240 + power * 380;
    puck.vx = p.facing * speed;
    puck.vy = -(40 + power * 110);
    p.swing = 0.25;
    p.squash = 0.2;
  }

  function showFlash(text) {
    flash = text;
    flashT = 1.3;
  }

  function updateHud() {
    youEl.textContent = youGoals;
    aiEl.textContent = aiGoals;
    timeEl.textContent = Math.max(0, Math.ceil(timeLeft));
  }

  // ---------- simulation ----------
  function skate(p, dir, dt) {
    p.vx += dir * SKATE_ACCEL * dt;
    if (dir === 0) p.vx *= Math.pow(0.02, dt);      // quick stop on the ice
    p.vx = clamp(p.vx, -SKATE_MAX, SKATE_MAX);
    p.x += p.vx * dt;
    p.x = clamp(p.x, BOARD_L + 22, BOARD_R - 22);
    if (dir !== 0) p.facing = dir;
  }

  function stepYou(dt) {
    let dir = 0;
    if (keys.KeyA || keys.ArrowLeft) dir -= 1;
    if (keys.KeyD || keys.ArrowRight) dir += 1;
    skate(you, dir, dt);
    you.checkT = Math.max(0, you.checkT - dt);
    you.swing = Math.max(0, you.swing - dt);
    you.squash = Math.max(0, you.squash - dt);

    if (you.charging) you.charge = Math.min(1, you.charge + dt * 1.1);

    // Pick up a loose puck near the blade
    if (!puck.owner && Math.abs(puck.x - bladeX(you)) < 20 && Math.abs(puck.y - bladeY()) < 20 && Math.abs(puck.vy) < 80) {
      puck.owner = "you";
    }
  }

  function stepCpu(dt) {
    cpu.checkT = Math.max(0, cpu.checkT - dt);
    cpu.swing = Math.max(0, cpu.swing - dt);
    cpu.squash = Math.max(0, cpu.squash - dt);
    sTimer -= dt;

    let target;
    if (puck.owner === "cpu") {
      target = 300;                                   // carry toward your goal
    } else if (puck.owner === "you") {
      target = clamp(you.x + 60, 180, 320);           // stay between you and the cpu goal... roughly
    } else {
      target = puck.x + (puck.vx > 0 ? 25 : -10);      // go for loose pucks
    }
    const dir = clamp(target - cpu.x, -1, 1);
    skate(cpu, Math.abs(target - cpu.x) < 4 ? 0 : dir, dt * CPU_MAX / SKATE_MAX);

    if (!puck.owner && Math.abs(puck.x - bladeX(cpu)) < 20 && Math.abs(puck.y - bladeY()) < 20 && Math.abs(puck.vy) < 80) {
      puck.owner = "cpu";
    }
    if (puck.owner === "cpu" && sTimer <= 0) {
      if (cpu.x > 250 || Math.random() < 0.15) {
        shootFrom(cpu, 0.6 + Math.random() * 0.4);
        sTimer = 1.2 + Math.random();
      } else {
        sTimer = 0.3;
      }
    }
    if (puck.owner === "you" && Math.random() < 0.6 * dt && Math.abs(cpu.x - you.x) < 60 && cpu.checkT <= 0) {
      cpu.checkT = 1.2;
      cpu.swing = 0.25;
      you.vx += 90 * (you.x > cpu.x ? 1 : -1);
    }
  }

  function step(dt) {
    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateHud();
      finish();
      return;
    }

    stepYou(dt);
    stepCpu(dt);

    // Puck follows its owner's blade, otherwise moves with physics
    if (puck.owner === "you") {
      puck.x = bladeX(you); puck.y = bladeY() - 6; puck.vx = 0; puck.vy = 0;
    } else if (puck.owner === "cpu") {
      puck.x = bladeX(cpu); puck.y = bladeY() - 6; puck.vx = 0; puck.vy = 0;
    } else {
      puck.vy += GRAVITY * dt;
      puck.x += puck.vx * dt;
      puck.y += puck.vy * dt;
      if (puck.y > ICE - 5) {
        puck.y = ICE - 5;
        puck.vy = -puck.vy * 0.25;
        if (Math.abs(puck.vy) < 40) puck.vy = 0;
        puck.vx *= Math.pow(0.6, dt * 6);           // ice friction
        if (Math.abs(puck.vx) < 4) puck.vx = 0;
      }
      // Side boards and the net openings
      const inLeftNet = puck.y > NET_TOP && puck.y < NET_BOTTOM;
      if (puck.x < BOARD_L && !(inLeftNet)) { puck.x = BOARD_L; puck.vx = Math.abs(puck.vx) * 0.5; }
      if (puck.x > BOARD_R && !(inLeftNet)) { puck.x = BOARD_R; puck.vx = -Math.abs(puck.vx) * 0.5; }
      if (puck.x > W - 6 && inLeftNet) { youGoals++; showFlash("🚨 GOAL! Nice shot!"); resetAfterGoal(false); }
      if (puck.x < 6 && inLeftNet) { aiGoals++; showFlash("😬 The computer scores"); resetAfterGoal(true); }
      if (puck.x < BOARD_L - 14 || puck.x > BOARD_R + 14) { /* safety: keep the puck visible */ puck.x = clamp(puck.x, 0, W); }
    }

    if (flashT > 0) { flashT -= dt; if (flashT <= 0) flash = ""; }
    updateHud();
  }

  function resetAfterGoal(towardYou) {
    resetPositions();
    servePuck(towardYou);
    you.charging = false;
    you.charge = 0;
  }

  // ---------- drawing (puppet players) ----------
  function wobble(p, k) {
    return Math.sin(t * 9 + p.phase + k) * 3;
  }

  function drawPuppet(p) {
    const sx = 1 + p.squash * 0.6;
    const sy = 1 - p.squash * 0.35;
    const ground = ICE;
    const bob = Math.abs(Math.sin(t * 10 + p.phase)) * (p.vx !== 0 ? 2.5 : 0.5);

    ctx.save();
    ctx.translate(p.x, ground);
    ctx.scale(p.facing * sx, sy);

    // skate blades
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-10, -1); ctx.lineTo(12, -1);
    ctx.moveTo(-12, -4); ctx.lineTo(-6, -4);
    ctx.stroke();

    // rubbery legs
    ctx.strokeStyle = p.jersey;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-3, -22 - bob);
    ctx.quadraticCurveTo(-8 + wobble(p, 0), -12, -4 + wobble(p, 1), -4);
    ctx.moveTo(4, -22 - bob);
    ctx.quadraticCurveTo(9 + wobble(p, 2), -12, 6 + wobble(p, 3), -4);
    ctx.stroke();

    // body (big rounded jersey)
    ctx.fillStyle = p.jersey;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-11, -46 - bob, 22, 26, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.number, 0, -33 - bob);

    // arms: rubbery, swing when shooting
    const armSwing = p.swing > 0 ? -18 : wobble(p, 4);
    ctx.strokeStyle = p.jersey;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-6, -40 - bob);
    ctx.quadraticCurveTo(-14, -30, -10 + armSwing * 0.2, -22);
    ctx.moveTo(8, -40 - bob);
    ctx.quadraticCurveTo(16 + armSwing * 0.3, -30, 22 + armSwing, -28 - (p.swing > 0 ? 10 : 0));
    ctx.stroke();

    // stick (from the hands to the blade)
    ctx.strokeStyle = "#7c2d12";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(22 + armSwing, -28 - (p.swing > 0 ? 10 : 0));
    ctx.lineTo(34, -6);
    ctx.stroke();
    ctx.fillStyle = "#111827";
    ctx.fillRect(31, -8, 8, 3);

    // head: big puppet head with googly eyes
    const headY = -58 - bob;
    ctx.fillStyle = "#fcd5b0";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, headY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // helmet
    ctx.fillStyle = p.jersey;
    ctx.beginPath();
    ctx.arc(0, headY - 2, 15, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    // eyes
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(3, headY + 2, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath(); ctx.arc(4.5, headY + 2.5, 2, 0, Math.PI * 2); ctx.fill();
    // smile
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(2, headY + 7, 4, 0.1, Math.PI - 0.6);
    ctx.stroke();

    ctx.restore();

    // name tag above the head
    ctx.font = "bold 10px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(p.label, p.x, ICE - 82);
  }

  function drawRink() {
    // ice and boards
    const ice = ctx.createLinearGradient(0, 0, 0, H);
    ice.addColorStop(0, "#dbeafe");
    ice.addColorStop(1, "#bfdbfe");
    ctx.fillStyle = ice;
    ctx.fillRect(0, 0, W, H);

    // crowd bands behind the boards
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, W, 30);
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, 30, W, 10);

    // boards
    ctx.fillStyle = "#7c2d12";
    ctx.fillRect(0, ICE, W, H - ICE);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(0, ICE - 4, W, 4);

    // lines
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(W / 2 - 2, ICE - 150, 4, 150);
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(130, ICE - 150, 4, 150);
    ctx.fillRect(266, ICE - 150, 4, 150);

    // nets
    drawNet(0, true);
    drawNet(W, false);
  }

  function drawNet(x, left) {
    const w = 12;
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(left ? 0 : W - w, NET_TOP, w, NET_BOTTOM - NET_TOP);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = NET_TOP; y <= NET_BOTTOM; y += 6) {
      ctx.moveTo(left ? 0 : W - w, y);
      ctx.lineTo(left ? w : W, y);
    }
    for (let xx = left ? 0 : W - w; xx <= (left ? w : W); xx += 4) {
      ctx.moveTo(xx, NET_TOP);
      ctx.lineTo(xx, NET_BOTTOM);
    }
    ctx.stroke();
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(left ? w - 2 : W - w, NET_TOP, 2, NET_BOTTOM - NET_TOP);
  }

  function drawPuck() {
    ctx.fillStyle = "#0f172a55";
    ctx.beginPath();
    ctx.ellipse(puck.x + 2, ICE - 1, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.ellipse(puck.x, puck.y, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCharge() {
    if (!you.charging) return;
    const x = you.x - 22, y = ICE - 100;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x, y, 44, 7);
    ctx.fillStyle = you.charge > 0.8 ? "#ef4444" : "#facc15";
    ctx.fillRect(x + 1, y + 1, 42 * you.charge, 5);
  }

  function draw() {
    drawRink();
    drawPuppet(cpu);
    drawPuppet(you);
    drawPuck();
    drawCharge();

    if (flash) {
      ctx.font = "bold 22px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 5;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0f172a";
      ctx.strokeText(flash, W / 2, 80);
      ctx.fillStyle = "#fde047";
      ctx.fillText(flash, W / 2, 80);
    }
    if (!running && !(youGoals || aiGoals)) {
      ctx.font = "bold 18px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#0f172a";
      ctx.fillText("Press Start Game", W / 2, 130);
    }
  }

  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;
    t += dt;
    if (running) step(dt);
    draw();
    requestAnimationFrame(frame);
  }

  // ---------- match end and leaderboard ----------
  function finish() {
    running = false;
    you.charging = false;
    keys = {};
    startBtn.hidden = false;
    startBtn.textContent = "Play Again";
    message.textContent = "🏁 Full time! You " + youGoals + " – " + aiGoals + " computer.";
    if (youGoals > 0) {
      youScoreEl.textContent = youGoals;
      try { nameIn.value = localStorage.getItem("hkName") || ""; } catch (e) { nameIn.value = ""; }
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
      const query = "?orderBy=" + encodeURIComponent('"score"') + "&limitToLast=30";
      const response = await fetch(FB + "/hockeyScores.json" + query);
      if (!response.ok) throw new Error("Request failed: " + response.status);
      const data = (await response.json()) || {};
      const entries = Object.values(data)
        .filter(function (e) { return e && typeof e.name === "string" && Number.isFinite(e.score); });
      renderBoard(Board.bestOnly(entries));
    } catch (error) {
      boardStatus.textContent = "Couldn't load the leaderboard. Try again later.";
    }
  }

  formBox.addEventListener("submit", async function (event) {
    event.preventDefault();
    const name = Board.cleanName(nameIn.value);
    if (!name) {
      formStatus.textContent = "Please enter your first name and last initial, like Bob S.";
      return;
    }
    if (!FB) {
      formStatus.textContent = "The leaderboard isn't connected yet. Please tell Azlan!";
      return;
    }
    submitBtn.disabled = true;
    formStatus.textContent = "Saving…";
    try {
      const result = await Board.submitBest(FB, "hockeyScores", name, Math.min(youGoals, 50));
      if (!result.saved) {
        formStatus.textContent = "You already have a higher score saved (" + result.best + "), so this one wasn't kept.";
        submitBtn.disabled = false;
        return;
      }
      try { localStorage.setItem("hkName", name); } catch (error) { /* ignore */ }
      formStatus.textContent = "✅ Saved to the leaderboard!";
      formBox.hidden = true;
      await loadBoard();
    } catch (error) {
      formStatus.textContent = "Couldn't save your score. Please try again.";
      submitBtn.disabled = false;
    }
  });

  // ---------- controls ----------
  const GAME_KEYS = ["KeyA", "KeyD", "ArrowLeft", "ArrowRight", "KeyF", "KeyS"];

  window.addEventListener("keydown", function (event) {
    if (!running) return;
    if (GAME_KEYS.indexOf(event.code) !== -1) event.preventDefault();
    keys[event.code] = true;
    if (event.code === "KeyF" && !event.repeat && !you.charging) {
      you.charging = true;
      you.charge = 0;
    }
    if (event.code === "KeyS" && !event.repeat && you.checkT <= 0 && Math.abs(cpu.x - you.x) < 40) {
      you.checkT = 0.8;
      you.swing = 0.2;
      cpu.vx += 160 * (cpu.x > you.x ? 1 : -1);
      if (puck.owner === "cpu") {
        puck.owner = null;
        puck.vx = (cpu.x > you.x ? 1 : -1) * 140;
        puck.vy = -60;
      }
    }
  });

  window.addEventListener("keyup", function (event) {
    keys[event.code] = false;
    if (running && event.code === "KeyF" && you.charging) releaseShot();
  });

  function releaseShot() {
    you.charging = false;
    if (puck.owner === "you") shootFrom(you, you.charge);
    you.charge = 0;
  }

  canvas.addEventListener("pointerdown", function (event) {
    if (!running || you.charging) return;
    mouseDown = true;
    you.charging = true;
    you.charge = 0;
    event.preventDefault();
  });
  window.addEventListener("pointerup", function () {
    if (!running || !mouseDown) return;
    mouseDown = false;
    releaseShot();
  });

  startBtn.addEventListener("click", function () {
    you = makePlayer(110, 1, "#22c55e", "10", "YOU", false);
    cpu = makePlayer(290, -1, "#ef4444", "1", "CPU", true);
    keys = {};
    youGoals = 0;
    aiGoals = 0;
    timeLeft = MATCH_SECONDS;
    flash = "";
    flashT = 0;
    sTimer = 0.5;
    resetPositions();
    servePuck(false);
    formBox.hidden = true;
    running = true;
    startBtn.hidden = true;
    message.textContent = "Go! A/D to skate, hold F to shoot, S to check!";
    updateHud();
  });

  // initial state
  keys = {};
  mouseDown = false;
  you = makePlayer(110, 1, "#22c55e", "10", "YOU", false);
  cpu = makePlayer(290, -1, "#ef4444", "1", "CPU", true);
  puck = { x: W / 2, y: ICE - 6, vx: 0, vy: 0, owner: null };
  youGoals = 0;
  aiGoals = 0;
  timeLeft = MATCH_SECONDS;
  sTimer = 0.5;
  running = false;
  updateHud();
  loadBoard();
  last = performance.now();
  requestAnimationFrame(frame);
})();
