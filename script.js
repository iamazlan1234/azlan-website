// 💜 Click button
const button = document.querySelector("#myButton");
const message = document.querySelector("#message");

button.addEventListener("click", function () {
  message.textContent = "🎉 Yay! My button works!";

  // Restart the bounce animation on every click
  button.classList.remove("bounce");
  void button.offsetWidth;
  button.classList.add("bounce");
});

// 🎮 Find all the parts of our game
const gameStartButton = document.querySelector("#startGame");
const gameArena = document.querySelector("#gameArena");
const gameStar = document.querySelector("#starTarget");
const gameScoreDisplay = document.querySelector("#gameScore");
const gameTimeDisplay = document.querySelector("#gameTime");
const gameHighScoreDisplay = document.querySelector("#gameHighScore");
const gameHint = document.querySelector("#gameHint");
const gameResult = document.querySelector("#gameResult");

const GAME_SECONDS = 15;
const HIGH_SCORE_KEY = "starGameHighScore";

let starScore = 0;
let secondsLeft = GAME_SECONDS;
let gameRunning = false;
let gameTimer = null;
let highScore = 0;

// 🏆 Load the saved best score (safe if storage is blocked)
try {
  highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
} catch (error) {
  highScore = 0;
}
gameHighScoreDisplay.textContent = highScore;

function saveHighScore() {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
  } catch (error) {
    // Storage unavailable: the best score just lasts for this visit
  }
}

// 🍪 Move the cookie to a random spot
function moveStar() {
  const maxLeft = Math.max(0, gameArena.clientWidth - gameStar.offsetWidth - 16);
  const maxTop = Math.max(0, gameArena.clientHeight - gameStar.offsetHeight - 16);

  gameStar.style.left = 8 + Math.random() * maxLeft + "px";
  gameStar.style.top = 8 + Math.random() * maxTop + "px";
}

// 🏁 End the game
function endGame() {
  clearInterval(gameTimer);
  gameRunning = false;

  gameStar.hidden = true;
  gameStartButton.hidden = false;
  gameStartButton.textContent = "Play Again";
  gameHint.hidden = false;
  gameHint.textContent = "Time's up! Want another round?";

  if (starScore > highScore) {
    highScore = starScore;
    gameHighScoreDisplay.textContent = highScore;
    saveHighScore();
    gameResult.textContent = "🏆 New best! You scored " + starScore + " points!";
  } else {
    gameResult.textContent = "🎉 You scored " + starScore + " points!";
  }

  offerScoreSubmit(starScore);
}

// 🚀 Start the game
gameStartButton.addEventListener("click", function () {
  clearInterval(gameTimer);

  starScore = 0;
  secondsLeft = GAME_SECONDS;
  gameRunning = true;

  gameScoreDisplay.textContent = starScore;
  gameTimeDisplay.textContent = secondsLeft;

  gameStartButton.hidden = true;
  gameHint.hidden = true;
  gameStar.hidden = false;

  gameResult.textContent = "Go! Catch those cookies!";
  hideScoreForm();

  moveStar();

  gameTimer = setInterval(function () {
    secondsLeft--;
    gameTimeDisplay.textContent = secondsLeft;

    if (secondsLeft <= 0) {
      endGame();
    }
  }, 1000);
});

// 😋 Munching animation: a copy of the cookie gets eaten where it was
// tapped, so the real cookie can jump away right away and the game stays fast.
function munchEffect() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const left = gameStar.offsetLeft;
  const top = gameStar.offsetTop;
  const size = gameStar.offsetWidth;
  const centerX = left + size / 2;
  const centerY = top + size / 2;

  // The cookie getting munched
  const ghost = document.createElement("span");
  ghost.className = "cookie-ghost";
  ghost.textContent = "🍪";
  ghost.style.left = left + "px";
  ghost.style.top = top + "px";
  gameArena.append(ghost);
  ghost.addEventListener("animationend", function () { ghost.remove(); });

  // Crumbs flying out
  for (let i = 0; i < 7; i++) {
    const crumb = document.createElement("span");
    const angle = (Math.PI * 2 * i) / 7 + Math.random() * 0.6;
    const distance = 30 + Math.random() * 25;

    crumb.className = "cookie-crumb";
    crumb.style.left = centerX + "px";
    crumb.style.top = centerY + "px";
    crumb.style.setProperty("--dx", Math.cos(angle) * distance + "px");
    crumb.style.setProperty("--dy", Math.sin(angle) * distance + "px");
    gameArena.append(crumb);
    crumb.addEventListener("animationend", function () { crumb.remove(); });
  }

  // "nom!" floating up
  const nom = document.createElement("span");
  nom.className = "cookie-nom";
  nom.textContent = "nom!";
  nom.style.left = centerX + "px";
  nom.style.top = top + "px";
  gameArena.append(nom);
  nom.addEventListener("animationend", function () { nom.remove(); });
}

// 🍪 Catch the cookie to earn points!
gameStar.addEventListener("click", function () {
  if (!gameRunning) return;

  starScore++;
  gameScoreDisplay.textContent = starScore;

  munchEffect();
  moveStar();
});

// 🏅 LEADERBOARD
// Paste your Firebase Realtime Database URL here so every visitor shares one
// leaderboard, e.g. "https://your-project-default-rtdb.firebaseio.com"
// Leave it empty to keep scores on this device only.
const LEADERBOARD_URL = "";

const LOCAL_BOARD_KEY = "starGameLeaderboard";
const NAME_KEY = "starGamePlayerName";
const BOARD_SIZE = 10;

const scoreForm = document.querySelector("#scoreForm");
const playerNameInput = document.querySelector("#playerName");
const leaderboardList = document.querySelector("#leaderboardList");
const leaderboardStatus = document.querySelector("#leaderboardStatus");

let pendingScore = 0;

function sortAndTrim(entries) {
  return entries
    .filter(function (e) { return e && typeof e.name === "string" && Number.isFinite(e.score); })
    .sort(function (a, b) { return b.score - a.score; })
    .slice(0, BOARD_SIZE);
}

async function fetchScores() {
  if (!LEADERBOARD_URL) {
    try {
      return sortAndTrim(JSON.parse(localStorage.getItem(LOCAL_BOARD_KEY)) || []);
    } catch (error) {
      return [];
    }
  }

  const query = "?orderBy=" + encodeURIComponent('"score"') + "&limitToLast=" + BOARD_SIZE;
  const response = await fetch(LEADERBOARD_URL.replace(/\/$/, "") + "/scores.json" + query);
  if (!response.ok) throw new Error("Request failed: " + response.status);

  const data = await response.json();
  return sortAndTrim(Object.values(data || {}));
}

async function saveScore(name, score) {
  if (!LEADERBOARD_URL) {
    const entries = await fetchScores();
    entries.push({ name: name, score: score });
    try {
      localStorage.setItem(LOCAL_BOARD_KEY, JSON.stringify(sortAndTrim(entries)));
    } catch (error) {
      // Storage unavailable: nothing to save to
    }
    return;
  }

  const response = await fetch(LEADERBOARD_URL.replace(/\/$/, "") + "/scores.json", {
    method: "POST",
    body: JSON.stringify({ name: name, score: score })
  });
  if (!response.ok) throw new Error("Request failed: " + response.status);
}

function renderLeaderboard(entries) {
  leaderboardList.textContent = "";

  if (entries.length === 0) {
    leaderboardStatus.textContent = "No scores yet. Be the first!";
    return;
  }

  leaderboardStatus.textContent = LEADERBOARD_URL ? "" : "Scores are saved on this device only.";

  entries.forEach(function (entry) {
    const item = document.createElement("li");
    const name = document.createElement("span");
    const points = document.createElement("strong");

    // textContent (not innerHTML) keeps visitor-entered names safe
    name.textContent = entry.name;
    points.textContent = entry.score;

    item.append(name, points);
    leaderboardList.append(item);
  });
}

async function loadLeaderboard() {
  try {
    renderLeaderboard(await fetchScores());
  } catch (error) {
    leaderboardList.textContent = "";
    leaderboardStatus.textContent = "Couldn't load the leaderboard. Try again later.";
  }
}

function offerScoreSubmit(score) {
  if (score <= 0) return;

  pendingScore = score;
  try {
    playerNameInput.value = localStorage.getItem(NAME_KEY) || "";
  } catch (error) {
    // Ignore: the name box just starts empty
  }
  scoreForm.hidden = false;
  playerNameInput.focus();
}

function hideScoreForm() {
  pendingScore = 0;
  scoreForm.hidden = true;
}

scoreForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const name = playerNameInput.value.trim().slice(0, 20);
  if (!name || pendingScore <= 0) return;

  const submitButton = scoreForm.querySelector("button");
  submitButton.disabled = true;

  try {
    await saveScore(name, pendingScore);
    try {
      localStorage.setItem(NAME_KEY, name);
    } catch (error) {
      // Ignore: we just won't remember the name
    }
    gameResult.textContent = "✅ Score added to the leaderboard!";
    hideScoreForm();
    await loadLeaderboard();
  } catch (error) {
    gameResult.textContent = "Couldn't save your score. Please try again.";
  } finally {
    submitButton.disabled = false;
  }
});

loadLeaderboard();

// 🕴️ STICK MAN: tap him and he runs to another corner
const stickMan = document.querySelector("#stickMan");
const stickManArt = stickMan.querySelector("svg");
const CORNER_GAP = 12;
const CORNERS = ["bottom-left", "bottom-right", "top-right", "top-left"];
let stickManCorner = "bottom-left";

function placeStickMan() {
  const viewWidth = document.documentElement.clientWidth;
  const viewHeight = window.innerHeight;
  const right = viewWidth - stickMan.offsetWidth - CORNER_GAP;
  const bottom = viewHeight - stickMan.offsetHeight - CORNER_GAP;

  const x = stickManCorner.endsWith("right") ? right : CORNER_GAP;
  const y = stickManCorner.startsWith("bottom") ? bottom : CORNER_GAP;

  stickMan.style.setProperty("--x", x + "px");
  stickMan.style.setProperty("--y", y + "px");
}

stickMan.addEventListener("click", function () {
  const otherCorners = CORNERS.filter(function (corner) {
    return corner !== stickManCorner;
  });
  stickManCorner = otherCorners[Math.floor(Math.random() * otherCorners.length)];
  placeStickMan();

  stickManArt.classList.remove("hop");
  void stickManArt.getBoundingClientRect();
  stickManArt.classList.add("hop");
});

window.addEventListener("resize", placeStickMan);
placeStickMan();
