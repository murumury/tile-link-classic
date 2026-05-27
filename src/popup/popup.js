import { RetroGame } from "../game/game.js";

const root = document.querySelector("[data-game-root]");
const game = new RetroGame(root);

await game.init();

root.querySelector("[data-difficulty]").addEventListener("change", (event) => {
  game.setDifficulty(event.target.value);
});

root.querySelector("[data-language]").addEventListener("change", (event) => {
  game.setLanguage(event.target.value);
});

root.addEventListener("click", (event) => {
  const tile = event.target.closest("[data-row][data-col]");

  if (tile) {
    game.selectTile(Number(tile.dataset.row), Number(tile.dataset.col));
    return;
  }

  const action = event.target.closest("[data-action]")?.dataset?.action;

  if (action === "start") {
    game.start();
  }

  if (action === "pause") {
    game.pause();
  }

  if (action === "reset") {
    game.reset();
  }

  if (action === "play-again") {
    game.reset();
  }

  if (action === "hint") {
    game.useHint();
  }

  if (action === "shuffle") {
    game.shuffle();
  }
});
