// ⛶ FULL SCREEN: adds a full-screen button to every game section.
(function () {
  "use strict";

  const GAME_PARTS = "canvas, .game-arena, #chessBoard, #craftPantry, #moleGrid, #soccerCanvas";

  function label(button) {
    button.textContent = document.fullscreenElement ? "✖ Exit full screen" : "⛶ Full screen";
  }

  document.querySelectorAll("section.game-card").forEach(function (section) {
    if (!section.querySelector(GAME_PARTS)) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "fs-btn";
    button.setAttribute("aria-label", "Play this game full screen");
    label(button);

    button.addEventListener("click", function () {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        return;
      }
      if (!section.requestFullscreen) {
        button.textContent = "Full screen isn't supported here";
        return;
      }
      section.requestFullscreen().catch(function () {
        button.textContent = "Full screen was blocked by your browser";
      });
    });

    const heading = section.querySelector("h2");
    if (heading) heading.insertAdjacentElement("afterend", button);
    else section.prepend(button);
  });

  document.addEventListener("fullscreenchange", function () {
    document.querySelectorAll(".fs-btn").forEach(label);
  });
})();
