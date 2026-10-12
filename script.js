
const button = document.querySelector("#myButton");
const message = document.querySelector("#message");

button.addEventListener("click", function() {
  message.textContent = "🎉 Yay! My button works!";

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
const gameHint = document.querySelector("#gameHint");
const gameResult = document.querySelector("#gameResult");

let starScore = 0;
let secondsLeft = 15;
let gameRunning = false;
let gameTimer = null;

// ⭐ Move the star to a random spot
function moveStar() {
  const maxLeft = Math.max(
    0,
    gameArena.clientWidth - gameStar.offsetWidth - 16
  );

  const maxTop = Math.max(
    0,
    gameArena.clientHeight - gameStar.offsetHeight - 16
  );

  const randomLeft = 8 + Math.random() * maxLeft;
  const randomTop = 8 + Math.random() * maxTop;

  gameStar.style.left = randomLeft + "px";
  gameStar.style.top = randomTop + "px";
}

// 🚀 Start the game
gameStartButton.addEventListener("click", function() {
  clearInterval(gameTimer);

  starScore = 0;
  secondsLeft = 15;
  gameRunning = true;

  gameScoreDisplay.textContent = starScore;
  gameTimeDisplay.textContent = secondsLeft;

  gameStartButton.hidden = true;
  gameHint.hidden = true;
  gameStar.hidden = false;

  gameResult.textContent = "Go! Catch those stars!";

  moveStar();

  gameTimer = setInterval(function() {
    secondsLeft--;
    gameTimeDisplay.textContent = secondsLeft;

    if (secondsLeft <= 0) {
      clearInterval(gameTimer);
      gameRunning = false;

      gameStar.hidden = true;
      gameStartButton.hidden = false;
      gameStartButton.textContent = "Play Again";
      gameHint.hidden = false;
      gameHint.textContent = "Time's up! Want another round?";

      gameResult.textContent =
        "🎉 You scored " + starScore + " points!";
    }
  }, 1000);
});

// ⭐ Catch the star to earn points!
gameStar.addEventListener("click", function() {
  if (!gameRunning) return;

  starScore++;
  gameScoreDisplay.textContent = starScore;

  moveStar();
});
