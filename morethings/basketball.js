// 🏀 BASKETBALL: pull the ball back and let go to shoot.
(function () {
  "use strict";

  const W = 320;
  const H = 420;
  const R = 12;
  const G = 900;
  const START = { x: 90, y: 380 };
  const RIM_Y = 150;
  const RIM_L = 190;
  const RIM_R = 240;
  const BOARD_X = 252;
  const BOARD_TOP = 90;
  const BOARD_BOT = 170;
  const POWER = 5.5;
  const MAX_SPEED = 1100;

  // Moves the ball one step. Returns "made", "out", or null.
  function physics(b, dt) {
    b.prevY = b.y;
    b.vy += G * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Rim ends bounce the ball
    [RIM_L, RIM_R].forEach(function (rx) {
      const dx = b.x - rx;
      const dy = b.y - RIM_Y;
      const d = Math.hypot(dx, dy);
      const min = R + 4;
      if (d < min && d > 0) {
        const nx = dx / d;
        const ny = dy / d;
        b.x = rx + nx * min;
        b.y = RIM_Y + ny * min;
        const vn = b.vx * nx + b.vy * ny;
        if (vn < 0) {
          b.vx -= 1.6 * vn * nx;
          b.vy -= 1.6 * vn * ny;
        }
      }
    });

    // Backboard on the right
    if (b.x + R > BOARD_X && b.y > BOARD_TOP && b.y < BOARD_BOT && b.vx > 0) {
      b.x = BOARD_X - R;
      b.vx = -Math.abs(b.vx) * 0.5;
    }

    // Going down through the hoop counts
    if (b.prevY < RIM_Y && b.y >= RIM_Y && b.x > RIM_L + 2 && b.x < RIM_R - 2 && b.vy > 0) {
      return "made";
    }

    // Floor bounce
    if (b.y > H - R) {
      b.y = H - R;
      b.vy = -b.vy * 0.45;
      b.vx *= 0.7;
      if (Math.abs(b.vy) < 40) b.vy = 0;
    }

    if (b.x < -R || b.x > W + R || (b.y >= H - R && b.vy === 0 && Math.abs(b.vx) < 5)) {
      return "out";
    }
    return null;
  }

  function launchVelocity(px, py) {
    let vx = (START.x - px) * POWER;
    let vy = (START.y - py) * POWER;
    const speed = Math.hypot(vx, vy);
    if (speed > MAX_SPEED) {
      vx = (vx / speed) * MAX_SPEED;
      vy = (vy / speed) * MAX_SPEED;
    }
    return { vx: vx, vy: vy };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { physics, launchVelocity, START, W, H, R };
  }

  const canvas = typeof document !== "undefined" && document.querySelector("#bballCanvas");
  if (!canvas) return;

  const FB = (typeof FIREBASE_URL === "string" && FIREBASE_URL) ? FIREBASE_URL.replace(/\/$/, "") : "";
  const bbForm = document.querySelector("#bbForm");
  const bbName = document.querySelector("#bbName");
  const bbYouScore = document.querySelector("#bbYouScore");
  const bbSubmit = document.querySelector("#bbSubmit");
  const bbFormStatus = document.querySelector("#bbFormStatus");
  const bbBoardStatus = document.querySelector("#bbBoardStatus");
  const bbBoard = document.querySelector("#bbBoard");

  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const scoreEl = document.querySelector("#bballScore");
  const shotsEl = document.querySelector("#bballShots");
  const timeEl = document.querySelector("#bballTime");
  const bestEl = document.querySelector("#bballBest");
  const message = document.querySelector("#bballMessage");
  const startBtn = document.querySelector("#bballStart");

  let best = 0;
  try { best = Number(localStorage.getItem("bballBest")) || 0; } catch (error) { best = 0; }
  bestEl.textContent = best;

  let ball = { x: START.x, y: START.y, vx: 0, vy: 0, prevY: START.y };
  let state = "idle"; // idle, ready, aim, flying, done
  let running = false;
  let dragging = false;
  let pointer = null;
  let timeLeft = 60;
  let made = 0;
  let shots = 0;
  let resetTimer = null;
  let last = 0;

  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (W / rect.width),
      y: (event.clientY - rect.top) * (H / rect.height)
    };
  }

  function resetBall() {
    ball = { x: START.x, y: START.y, vx: 0, vy: 0, prevY: START.y };
    state = running ? "ready" : "idle";
  }

  function finish() {
    running = false;
    state = "idle";
    startBtn.hidden = false;
    startBtn.textContent = "Play Again";
    let text = "🏁 Time's up! You scored " + made + " from " + shots + " shots.";
    if (made > best) {
      best = made;
      bestEl.textContent = best;
      try { localStorage.setItem("bballBest", String(best)); } catch (error) { /* ignore */ }
      if (made > 0) text += " New best!";
    }
    message.textContent = text;

    if (made > 0) {
      bbYouScore.textContent = made;
      bbFormStatus.textContent = "";
      bbSubmit.disabled = false;
      try { bbName.value = localStorage.getItem("bbName") || ""; } catch (error) { bbName.value = ""; }
      bbForm.hidden = false;
      bbName.focus();
    }
  }

  function afterShot(text) {
    state = "done";
    message.textContent = text;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(function () {
      if (running) resetBall();
    }, 800);
  }

  function update(dt) {
    if (running) {
      timeLeft -= dt;
      timeEl.textContent = Math.max(0, Math.ceil(timeLeft));
      if (timeLeft <= 0) {
        finish();
        return;
      }
    }

    if (state === "flying") {
      // Two smaller steps keeps the bounces accurate
      for (let i = 0; i < 2; i++) {
        const result = physics(ball, dt / 2);
        if (result === "made") {
          made++;
          scoreEl.textContent = made;
          afterShot("🏀 SWISH! Nice shot!");
          return;
        }
        if (result === "out") {
          afterShot("Miss! Try again.");
          return;
        }
      }
    }
  }

  function trajectory(vx, vy) {
    const b = { x: START.x, y: START.y, vx: vx, vy: vy, prevY: START.y };
    const points = [];
    for (let i = 0; i < 90; i++) {
      if (physics(b, 1 / 60)) break;
      if (i % 4 === 0) points.push({ x: b.x, y: b.y });
    }
    return points;
  }

  function draw() {
    // Court
    const floor = ctx.createLinearGradient(0, 0, 0, H);
    floor.addColorStop(0, "#1e3a8a");
    floor.addColorStop(1, "#7c2d12");
    ctx.fillStyle = floor;
    ctx.fillRect(0, 0, W, H);

    // Backboard and rim
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(BOARD_X, BOARD_TOP, 8, BOARD_BOT - BOARD_TOP);
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(RIM_L, RIM_Y);
    ctx.lineTo(RIM_R, RIM_Y);
    ctx.stroke();
    ctx.strokeStyle = "#ffffffaa";
    ctx.lineWidth = 1;
    for (let x = RIM_L + 6; x < RIM_R; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, RIM_Y);
      ctx.lineTo(x - 4, RIM_Y + 20);
      ctx.stroke();
    }

    // Aim line while dragging
    if (dragging && pointer) {
      const v = launchVelocity(pointer.x, pointer.y);
      ctx.fillStyle = "#fde047";
      trajectory(v.vx, v.vy).forEach(function (p) {
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(START.x, START.y);
      ctx.lineTo(pointer.x, pointer.y);
      ctx.stroke();
    }

    // Ball
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ball.x - R, ball.y);
    ctx.lineTo(ball.x + R, ball.y);
    ctx.moveTo(ball.x, ball.y - R);
    ctx.lineTo(ball.x, ball.y + R);
    ctx.stroke();
  }

  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  // Dragging works even when the pointer leaves the canvas
  canvas.addEventListener("pointerdown", function (event) {
    if (!running || state !== "ready") return;
    const p = toCanvas(event);
    if (Math.hypot(p.x - ball.x, p.y - ball.y) > 40) return;
    dragging = true;
    pointer = p;
    state = "aim";
    message.textContent = "Let go to shoot! 🏀";
  });

  window.addEventListener("pointermove", function (event) {
    if (dragging) pointer = toCanvas(event);
  });

  window.addEventListener("pointerup", function (event) {
    if (!dragging) return;
    dragging = false;
    const p = toCanvas(event);
    const pull = Math.hypot(START.x - p.x, START.y - p.y);
    if (pull < 15) {
      state = "ready";
      message.textContent = "Pull the ball further back to shoot.";
      return;
    }
    const v = launchVelocity(p.x, p.y);
    ball = { x: START.x, y: START.y, vx: v.vx, vy: v.vy, prevY: START.y };
    shots++;
    shotsEl.textContent = shots;
    state = "flying";
    message.textContent = "";
  });

  startBtn.addEventListener("click", function () {
    made = 0;
    shots = 0;
    timeLeft = 60;
    scoreEl.textContent = 0;
    shotsEl.textContent = 0;
    timeEl.textContent = 60;
    running = true;
    startBtn.hidden = true;
    bbForm.hidden = true;
    clearTimeout(resetTimer);
    resetBall();
    message.textContent = "Drag the ball down and let go! 🏀";
  });

  function renderBoard(entries) {
    bbBoard.textContent = "";
    if (entries.length === 0) {
      bbBoardStatus.textContent = "No scores yet. Be the first!";
      return;
    }
    bbBoardStatus.textContent = "";
    entries.forEach(function (entry) {
      const item = document.createElement("li");
      const name = document.createElement("span");
      const score = document.createElement("strong");
      name.textContent = entry.name;
      score.textContent = entry.score;
      item.append(name, score);
      bbBoard.append(item);
    });
  }

  async function loadBoard() {
    if (!FB) {
      bbBoardStatus.textContent = "The leaderboard isn't connected yet.";
      return;
    }
    try {
      const query = "?orderBy=" + encodeURIComponent('"score"') + "&limitToLast=10";
      const response = await fetch(FB + "/basketballScores.json" + query);
      if (!response.ok) throw new Error("Request failed: " + response.status);
      const data = (await response.json()) || {};
      const entries = Object.values(data)
        .filter(function (e) { return e && typeof e.name === "string" && Number.isFinite(e.score); })
        .sort(function (a, b) { return b.score - a.score; })
        ;
      renderBoard(Board.bestOnly(entries));
    } catch (error) {
      bbBoardStatus.textContent = "Couldn't load the leaderboard. Try again later.";
    }
  }

  bbForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const name = Board.cleanName(bbName.value);
    if (!name) {
      bbFormStatus.textContent = "Please enter your first name and last initial, like Bob S.";
      return;
    }
    if (!FB) {
      bbFormStatus.textContent = "The leaderboard isn't connected yet. Please tell Azlan!";
      return;
    }
    bbSubmit.disabled = true;
    bbFormStatus.textContent = "Saving…";
    try {
      const result = await Board.submitBest(FB, "basketballScores", name, Math.min(made, 100));
      if (!result.saved) {
        bbFormStatus.textContent = "You already have a higher score saved (" + result.best + "), so this one wasn't kept.";
        bbSubmit.disabled = false;
        return;
      }
      try { localStorage.setItem("bbName", name); } catch (error) { /* ignore */ }
      bbFormStatus.textContent = "✅ Saved to the leaderboard!";
      bbForm.hidden = true;
      await loadBoard();
    } catch (error) {
      bbFormStatus.textContent = "Couldn't save your score. Please try again.";
      bbSubmit.disabled = false;
    }
  });

  loadBoard();
  requestAnimationFrame(frame);
})();
