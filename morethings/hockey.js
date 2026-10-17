// 🏒 PUPPET HOCKEY: an original 2D hockey game with cartoon players.
// Controls: WASD or arrow keys to skate, F to shoot the puck (or click/tap to shoot).
(function () {
  "use strict";

  const FB = (typeof FIREBASE_URL === "string" && FIREBASE_URL) ? FIREBASE_URL.replace(/\/$/, "") : "";
  const W = 400;
  const H = 300;
  const PUCK_R = 7;
  const BODY_R = 14;
  const STICK = 30;
  const GOAL_TOP = 110;
  const GOAL_BOTTOM = 190;
  const MATCH_SECONDS = 60;
  const PLAYER_SPEED = 240;
  const AI_SPEED = 175;
  const SHOT_SPEED = 640;
  const SHOT_COOLDOWN = 0.35;

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

  let puck, you, cpu, running, timeLeft, youGoals, aiGoals, flash, flashTime, keys, shotCooldown, lastShot;
  let last = 0;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (W / rect.width),
      y: (event.clientY - rect.top) * (H / rect.height)
    };
  }

  function makeSkater(x, y, facingY) {
    return { x: x, y: y, vx: 0, vy: 0, fx: 0, fy: facingY, swing: 0 };
  }

  function servePuck(towardYou) {
    puck = {
      x: W / 2,
      y: H / 2,
      vx: (towardYou ? 1 : -1) * (120 + Math.random() * 40),
      vy: (Math.random() - 0.5) * 100
    };
  }

  function tipOf(s) {
    return { x: s.x + s.fx * STICK, y: s.y + s.fy * STICK };
  }

  // Bodies push the puck away
  function bodyHit(s) {
    const dx = puck.x - s.x;
    const dy = puck.y - s.y;
    const d = Math.hypot(dx, dy);
    const min = PUCK_R + BODY_R;
    if (d >= min || d === 0) return;
    const nx = dx / d;
    const ny = dy / d;
    puck.x = s.x + nx * min;
    puck.y = s.y + ny * min;
    const rvx = puck.vx - s.vx;
    const rvy = puck.vy - s.vy;
    const vn = rvx * nx + rvy * ny;
    if (vn < 0) {
      puck.vx -= 1.6 * vn * nx;
      puck.vy -= 1.6 * vn * ny;
    }
  }

  // Shooting: the puck must be close to the stick blade
  function shoot(s, speed) {
    const tip = tipOf(s);
    const d = Math.hypot(puck.x - tip.x, puck.y - tip.y);
    s.swing = 0.25;
    if (d > PUCK_R + 14) return false;
    const len = Math.hypot(s.fx, s.fy) || 1;
    puck.vx = (s.fx / len) * speed + s.vx * 0.4;
    puck.vy = (s.fy / len) * speed + s.vy * 0.4;
    puck.x = tip.x + (s.fx / len) * (PUCK_R + 2);
    puck.y = tip.y + (s.fy / len) * (PUCK_R + 2);
    return true;
  }

  function showFlash(text) {
    flash = text;
    flashTime = 1.1;
  }

  function updateHud() {
    youEl.textContent = youGoals;
    aiEl.textContent = aiGoals;
    timeEl.textContent = Math.max(0, Math.ceil(timeLeft));
  }

  function movePlayer(dt) {
    let dx = 0;
    let dy = 0;
    if (keys.KeyA || keys.ArrowLeft) dx -= 1;
    if (keys.KeyD || keys.ArrowRight) dx += 1;
    if (keys.KeyW || keys.ArrowUp) dy -= 1;
    if (keys.KeyS || keys.ArrowDown) dy += 1;
    const len = Math.hypot(dx, dy);
    const vx = len ? (dx / len) * PLAYER_SPEED : 0;
    const vy = len ? (dy / len) * PLAYER_SPEED : 0;
    you.vx = vx;
    you.vy = vy;
    you.x = clamp(you.x + vx * dt, BODY_R, W - BODY_R);
    you.y = clamp(you.y + vy * dt, H / 2 + BODY_R, H - BODY_R);
    if (len) {
      you.fx = dx / len;
      you.fy = dy / len;
    }
    you.swing = Math.max(0, you.swing - dt);
  }

  function moveCpu(dt) {
    // Chase the puck when it's in its half, otherwise guard the goal
    const tx = clamp(puck.x, BODY_R, W - BODY_R);
    const ty = clamp(puck.y < H / 2 ? puck.y : H * 0.22, BODY_R, H / 2 - BODY_R);
    const prevX = cpu.x;
    const prevY = cpu.y;
    const sp = AI_SPEED * dt;
    cpu.x += clamp(tx - cpu.x, -sp, sp);
    cpu.y += clamp(ty - cpu.y, -sp, sp);
    cpu.vx = (cpu.x - prevX) / dt;
    cpu.vy = (cpu.y - prevY) / dt;
    // Face the puck, and take a shot when it's in range
    const ax = puck.x - cpu.x;
    const ay = puck.y - cpu.y;
    const alen = Math.hypot(ax, ay) || 1;
    cpu.fx = ax / alen;
    cpu.fy = ay / alen;
    cpu.swing = Math.max(0, cpu.swing - dt);
    shotCooldown -= dt;
    const tip = tipOf(cpu);
    if (shotCooldown <= 0 && Math.hypot(puck.x - tip.x, puck.y - tip.y) < PUCK_R + 14 && puck.y < H / 2 + 40) {
      if (Math.random() < 0.6) {
        shoot(cpu, 420 + Math.random() * 120);
        shotCooldown = 0.9;
      }
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

    movePlayer(dt);
    moveCpu(dt);

    shotCooldown -= 0; // cooldown for you is handled on F press

    // Puck movement with a little friction
    const friction = Math.pow(0.99, dt * 60);
    puck.vx *= friction;
    puck.vy *= friction;
    puck.x += puck.vx * dt;
    puck.y += puck.vy * dt;

    bodyHit(you);
    bodyHit(cpu);

    // Top and bottom boards
    if (puck.y < PUCK_R) { puck.y = PUCK_R; puck.vy = Math.abs(puck.vy) * 0.9; }
    if (puck.y > H - PUCK_R) { puck.y = H - PUCK_R; puck.vy = -Math.abs(puck.vy) * 0.9; }

    // Side boards, with the goal openings
    const inMouth = puck.y > GOAL_TOP && puck.y < GOAL_BOTTOM;
    if (puck.x > W - PUCK_R && !inMouth) { puck.x = W - PUCK_R; puck.vx = -Math.abs(puck.vx) * 0.9; }
    if (puck.x < PUCK_R && !inMouth) { puck.x = PUCK_R; puck.vx = Math.abs(puck.vx) * 0.9; }

    if (puck.x > W + PUCK_R) {
      youGoals++;
      showFlash("🚨 GOAL! Nice shot!");
      servePuck(false);
    } else if (puck.x < -PUCK_R) {
      aiGoals++;
      showFlash("😬 The computer scores");
      servePuck(true);
    }

    flashTime -= dt;
    if (flashTime <= 0) flash = "";
    updateHud();
  }

  // ---------- drawing ----------
  function drawRink() {
    // ice
    ctx.fillStyle = "#e0f2fe";
    roundRect(0, 0, W, H, 18);
    ctx.fill();

    // center and blue lines
    ctx.fillStyle = "#dc2626aa";
    ctx.fillRect(W / 2 - 2, 0, 4, H);
    ctx.fillStyle = "#2563ebaa";
    ctx.fillRect(W * 0.3, 0, 4, H);
    ctx.fillRect(W * 0.7 - 4, 0, 4, H);

    // center circle and face-off dots
    ctx.strokeStyle = "#dc2626aa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 40, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#dc2626aa";
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 4, 0, Math.PI * 2); ctx.fill();

    // goal crease areas
    ctx.strokeStyle = "#2563ebaa";
    ctx.beginPath(); ctx.arc(0, H / 2, 50, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(W, H / 2, 50, Math.PI / 2, Math.PI * 1.5); ctx.stroke();

    // goals
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, GOAL_TOP, 7, GOAL_BOTTOM - GOAL_TOP);
    ctx.fillRect(W - 7, GOAL_TOP, 7, GOAL_BOTTOM - GOAL_TOP);
    ctx.fillStyle = "#f8fafc";
    for (let y = GOAL_TOP + 6; y < GOAL_BOTTOM; y += 8) {
      ctx.fillRect(0, y, 7, 1);
      ctx.fillRect(W - 7, y, 7, 1);
    }

    // boards (the rink walls)
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 6;
    roundRect(3, 3, W - 6, H - 6, 18);
    ctx.stroke();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }

  // A cartoon skater: helmet, face, jersey with a number, and a stick
  function drawSkater(s, jersey, number, label) {
    const tip = tipOf(s);
    // shadow
    ctx.fillStyle = "#0f172a33";
    ctx.beginPath();
    ctx.ellipse(s.x + 2, s.y + 6, BODY_R, BODY_R * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // stick (from the hands to the blade)
    const swing = s.swing > 0 ? 6 : 0;
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(s.x - s.fy * 6, s.y + s.fx * 6);
    ctx.lineTo(tip.x + s.fy * swing, tip.y - s.fx * swing);
    ctx.stroke();
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tip.x - s.fy * 3, tip.y + s.fx * 3);
    ctx.lineTo(tip.x + s.fy * 5 + s.fx * 3, tip.y - s.fx * 5 + s.fy * 3);
    ctx.stroke();

    // body: jersey
    ctx.fillStyle = jersey;
    ctx.beginPath();
    ctx.arc(s.x, s.y, BODY_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.stroke();

    // number
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(number, s.x, s.y + 1);

    // helmet/head on top
    ctx.fillStyle = "#f5d0a9";
    ctx.beginPath();
    ctx.arc(s.x + s.fx * 3, s.y - 2 + s.fy * 3, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1f2937";
    ctx.beginPath();
    ctx.arc(s.x + s.fx * 3, s.y - 3 + s.fy * 3, 7.5, Math.PI, 0);
    ctx.fill();

    // name tag
    ctx.font = "bold 10px Arial, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(label, s.x, s.y - BODY_R - 8);
  }

  function drawPuck() {
    ctx.fillStyle = "#0f172a55";
    ctx.beginPath();
    ctx.ellipse(puck.x + 2, puck.y + 3, PUCK_R, PUCK_R * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.arc(puck.x, puck.y, PUCK_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawRink();
    drawSkater(cpu, "#ef4444", "1", "CPU");
    drawSkater(you, "#22c55e", "10", "YOU");
    drawPuck();

    if (flash) {
      ctx.font = "bold 22px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 5;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0f172a";
      ctx.strokeText(flash, W / 2, H / 2 - 60);
      ctx.fillStyle = "#fde047";
      ctx.fillText(flash, W / 2, H / 2 - 60);
    }
    if (!running && !(youGoals || aiGoals)) {
      ctx.font = "bold 18px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#0f172a";
      ctx.fillText("Press Start Game", W / 2, H / 2 + 60);
    }
  }

  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;
    if (running) step(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function finish() {
    running = false;
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
      const query = "?orderBy=" + encodeURIComponent('"score"') + "&limitToLast=10";
      const response = await fetch(FB + "/hockeyScores.json" + query);
      if (!response.ok) throw new Error("Request failed: " + response.status);
      const data = (await response.json()) || {};
      const entries = Object.values(data)
        .filter(function (e) { return e && typeof e.name === "string" && Number.isFinite(e.score); })
        .sort(function (a, b) { return b.score - a.score; })
        ;
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
  const GAME_KEYS = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

  window.addEventListener("keydown", function (event) {
    if (!running) return;
    if (GAME_KEYS.indexOf(event.code) !== -1) {
      event.preventDefault();
      keys[event.code] = true;
    }
    if (event.code === "KeyF" && !event.repeat && shotCooldown <= 0) {
      event.preventDefault();
      shotCooldown = SHOT_COOLDOWN;
      if (shoot(you, SHOT_SPEED)) showFlash("🏒 Shot!");
    }
  });

  window.addEventListener("keyup", function (event) {
    keys[event.code] = false;
  });

  canvas.addEventListener("pointerdown", function (event) {
    if (!running || shotCooldown > 0) return;
    // Click or tap: aim toward the pointer, then shoot
    const p = toCanvas(event);
    const dx = p.x - you.x;
    const dy = p.y - you.y;
    const len = Math.hypot(dx, dy) || 1;
    you.fx = dx / len;
    you.fy = dy / len;
    shotCooldown = SHOT_COOLDOWN;
    if (shoot(you, SHOT_SPEED)) showFlash("🏒 Shot!");
  });

  startBtn.addEventListener("click", function () {
    you = makeSkater(W / 2, H - 45, 0);
    you.fy = -1;
    cpu = makeSkater(W / 2, 45, 0);
    cpu.fy = 1;
    keys = {};
    youGoals = 0;
    aiGoals = 0;
    timeLeft = MATCH_SECONDS;
    flash = "";
    shotCooldown = 0;
    formBox.hidden = true;
    servePuck(Math.random() < 0.5);
    running = true;
    startBtn.hidden = true;
    message.textContent = "Go! WASD or arrows to skate, F to shoot!";
    updateHud();
  });

  keys = {};
  you = makeSkater(W / 2, H - 45, 0);
  you.fy = -1;
  cpu = makeSkater(W / 2, 45, 0);
  cpu.fy = 1;
  puck = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
  youGoals = 0;
  aiGoals = 0;
  timeLeft = MATCH_SECONDS;
  shotCooldown = 0;
  updateHud();
  loadBoard();
  requestAnimationFrame(frame);
})();
