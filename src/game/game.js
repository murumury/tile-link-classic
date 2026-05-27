import { DIFFICULTIES } from "../shared/constants.js";
import { getBestScores, getSettings, saveBestScore, saveSettings } from "../shared/storage.js";
import {
  countVisibleTiles,
  createPlayableBoard,
  findAvailableMove,
  reshuffleVisibleTiles
} from "./board.js";
import { findConnection } from "./pathfinder.js";

const TEXT = {
  en: {
    best: "Best",
    autoShuffleNotice: "No moves - shuffled!",
    clearSubtitle: "Perfect!",
    clearTitle: "Stage Clear!",
    combo: "Combo",
    difficulty: {
      easy: "Easy",
      hard: "Hard",
      normal: "Normal"
    },
    hint: "Hint",
    language: "Lang",
    maxCombo: "Max Combo",
    mode: "Mode",
    pause: "Pause",
    playAgain: "Play Again",
    reset: "Reset",
    score: "Score",
    shuffle: "Shuffle",
    start: "Start",
    continue: "Continue",
    status: {
      paused: "PAUSE",
      ready: "READY",
      running: "RUN",
      won: "CLEAR"
    },
    time: "Time"
  },
  zh: {
    autoShuffleNotice: "无可消除 - 已重排！",
    best: "最佳",
    clearSubtitle: "完美！",
    clearTitle: "恭喜通关!",
    combo: "连击",
    difficulty: {
      easy: "简单",
      hard: "困难",
      normal: "普通"
    },
    hint: "提示",
    language: "语言",
    maxCombo: "最高连击",
    mode: "难度",
    pause: "暂停",
    playAgain: "再来一局",
    reset: "重置",
    score: "分数",
    shuffle: "重排",
    start: "开始",
    continue: "继续",
    status: {
      paused: "暂停",
      ready: "准备",
      running: "进行中",
      won: "通关"
    },
    time: "时间"
  },
  "zh-Hant": {
    autoShuffleNotice: "無可消除 - 已重排！",
    best: "最佳",
    clearSubtitle: "完美！",
    clearTitle: "恭喜通關!",
    combo: "連擊",
    difficulty: {
      easy: "簡單",
      hard: "困難",
      normal: "普通"
    },
    hint: "提示",
    language: "語言",
    maxCombo: "最高連擊",
    mode: "難度",
    pause: "暫停",
    playAgain: "再來一局",
    reset: "重置",
    score: "分數",
    shuffle: "重排",
    start: "開始",
    continue: "繼續",
    status: {
      paused: "暫停",
      ready: "準備",
      running: "進行中",
      won: "通關"
    },
    time: "時間"
  },
  ja: {
    autoShuffleNotice: "手がありません - シャッフル！",
    best: "ベスト",
    clearSubtitle: "パーフェクト！",
    clearTitle: "クリア！",
    combo: "コンボ",
    difficulty: {
      easy: "かんたん",
      hard: "むずかしい",
      normal: "ふつう"
    },
    hint: "ヒント",
    language: "言語",
    maxCombo: "最大コンボ",
    mode: "難易度",
    pause: "一時停止",
    playAgain: "もう一度",
    reset: "リセット",
    score: "スコア",
    shuffle: "シャッフル",
    start: "スタート",
    continue: "続ける",
    status: {
      paused: "停止中",
      ready: "準備",
      running: "プレイ中",
      won: "クリア"
    },
    time: "時間"
  }
};

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function samePoint(a, b) {
  return a?.row === b?.row && a?.col === b?.col;
}

export class RetroGame {
  constructor(root) {
    this.root = root;
    this.settings = null;
    this.config = null;
    this.timer = null;
    this.clearPathTimer = null;
    this.clearHintTimer = null;
    this.noticeTimer = null;
    this.state = null;
    this.elements = {
      board: root.querySelector("[data-board]"),
      pathLayer: root.querySelector("[data-path-layer]"),
      score: root.querySelector("[data-score]"),
      best: root.querySelector("[data-best]"),
      time: root.querySelector("[data-time]"),
      combo: root.querySelector("[data-combo]"),
      controls: {
        hint: root.querySelector("[data-action='hint']"),
        pause: root.querySelector("[data-action='pause']"),
        start: root.querySelector("[data-action='start']"),
        shuffle: root.querySelector("[data-action='shuffle']")
      },
      difficulty: root.querySelector("[data-difficulty]"),
      finalCombo: root.querySelector("[data-final-combo]"),
      finalScore: root.querySelector("[data-final-score]"),
      finalTime: root.querySelector("[data-final-time]"),
      hints: root.querySelector("[data-hints]"),
      language: root.querySelector("[data-language]"),
      perfect: root.querySelector("[data-perfect]"),
      shuffleNotice: root.querySelector("[data-shuffle-notice]"),
      shuffles: root.querySelector("[data-shuffles]"),
      status: root.querySelector("[data-status]"),
      frame: root.querySelector("[data-game-frame]"),
      winOverlay: root.querySelector("[data-win-overlay]")
    };
  }

  async init() {
    this.settings = await getSettings();
    this.settings.language = TEXT[this.settings.language] ? this.settings.language : "en";
    this.config = DIFFICULTIES[this.settings.difficulty] ?? DIFFICULTIES.normal;
    this.elements.frame.style.setProperty(
      "--scanline-opacity",
      this.settings.scanlinesEnabled ? "0.55" : "0"
    );
    this.elements.difficulty.value = this.settings.difficulty;
    this.elements.language.value = this.settings.language;
    this.renderStaticText();

    await this.reset();
  }

  async setDifficulty(difficulty) {
    if (!DIFFICULTIES[difficulty] || difficulty === this.settings.difficulty) {
      return;
    }

    this.settings = {
      ...this.settings,
      difficulty
    };
    this.config = DIFFICULTIES[difficulty];
    this.elements.difficulty.value = difficulty;
    await saveSettings(this.settings);
    await this.reset();
  }

  async setLanguage(language) {
    if (!TEXT[language] || language === this.settings.language) {
      return;
    }

    this.settings = {
      ...this.settings,
      language
    };
    this.elements.language.value = language;
    await saveSettings(this.settings);
    this.renderStaticText();
    this.render();
  }

  async reset() {
    this.stopTimer();
    this.stopPathTimers();
    this.hideShuffleNotice();
    const bestScores = await getBestScores();

    this.state = {
      status: "ready",
      board: createPlayableBoard(this.config),
      selected: null,
      hinted: null,
      path: [],
      score: 0,
      combo: 0,
      maxCombo: 0,
      pairCount: (this.config.rows * this.config.cols) / 2,
      elapsedTime: 0,
      hintsLeft: this.config.hints,
      shufflesLeft: this.config.shuffles,
      bestScore: bestScores[this.settings.difficulty] ?? 0
    };

    this.render();
  }

  start() {
    if (this.state.status === "running") {
      return;
    }

    if (this.state.status === "won") {
      return;
    }

    this.state.status = "running";
    this.startTimer();
    this.render();
  }

  pause() {
    if (this.state.status !== "running") {
      return;
    }

    this.state.status = "paused";
    this.stopTimer();
    this.render();
  }

  async selectTile(row, col) {
    if (this.state.status === "ready") {
      this.start();
    }

    if (this.state.status !== "running") {
      return;
    }

    const tile = this.state.board[row]?.[col];

    if (!tile?.visible) {
      return;
    }

    const selected = this.state.selected;

    if (!selected) {
      this.state.selected = { row, col };
      this.renderBoard();
      return;
    }

    if (samePoint(selected, { row, col })) {
      this.state.selected = null;
      this.renderBoard();
      return;
    }

    const path = findConnection(this.state.board, selected, { row, col });

    if (!path) {
      this.hideActivePath();
      this.state.selected = { row, col };
      this.state.combo = 0;
      this.render();
      return;
    }

    this.matchTiles(selected, { row, col }, path);
    await this.afterMove();
  }

  useHint() {
    if (this.state.status !== "running") {
      return;
    }

    if (this.state.hintsLeft <= 0) {
      return;
    }

    const move = findAvailableMove(this.state.board);

    if (!move) {
      this.state.status = "paused";
      this.stopTimer();
      this.renderHud();
      return;
    }

    this.state.hintsLeft -= 1;
    this.state.hinted = [move.first, move.second];
    this.state.path = move.path;
    this.render();
    this.drawPath(move.path);
    this.clearHintLater();
  }

  async shuffle({ automatic = false } = {}) {
    if (!automatic && this.state.status !== "running") {
      return;
    }

    if (this.state.status === "won") {
      return;
    }

    if (this.state.shufflesLeft <= 0 || countVisibleTiles(this.state.board) <= 2) {
      return;
    }

    this.state.shufflesLeft -= 1;
    this.state.selected = null;
    this.state.hinted = null;
    this.state.path = [];
    this.state.board = reshuffleVisibleTiles(this.state.board);

    for (let attempt = 0; attempt < 20 && !findAvailableMove(this.state.board); attempt += 1) {
      this.state.board = reshuffleVisibleTiles(this.state.board);
    }

    this.render();

    if (automatic) {
      this.showShuffleNotice();
    }
  }

  matchTiles(first, second, path) {
    this.state.board[first.row][first.col].visible = false;
    this.state.board[first.row][first.col].matched = true;
    this.state.board[second.row][second.col].visible = false;
    this.state.board[second.row][second.col].matched = true;
    this.state.selected = null;
    this.state.hinted = null;
    this.state.path = path;
    this.state.combo += 1;
    this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
    this.state.score += 100 + this.state.combo * 15;
    this.drawPath(path);
  }

  async afterMove() {
    const remainingTiles = countVisibleTiles(this.state.board);

    if (remainingTiles === 0) {
      this.state.status = "won";
      this.state.score += this.getTimeBonus();
      this.state.bestScore = await saveBestScore(this.settings.difficulty, this.state.score);
      this.stopTimer();
      this.render();
      return;
    }

    if (!findAvailableMove(this.state.board)) {
      this.state.combo = 0;

      if (this.state.shufflesLeft > 0) {
        await this.shuffle({ automatic: true });
      } else {
        this.state.status = "paused";
        this.stopTimer();
        this.render();
      }

      return;
    }

    this.render();
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.state.elapsedTime += 1;
      this.renderHud();
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  clearHintLater() {
    if (this.clearHintTimer) {
      clearTimeout(this.clearHintTimer);
    }

    this.clearHintTimer = setTimeout(() => {
      this.state.hinted = null;
      this.state.path = [];
      this.renderBoard();
      this.clearRenderedPath();
    }, 900);
  }

  drawPath(path) {
    if (this.clearPathTimer) {
      clearTimeout(this.clearPathTimer);
    }

    this.state.path = path;
    this.renderPath(path);
    this.clearPathTimer = setTimeout(() => {
      this.state.path = [];
      this.clearRenderedPath();
    }, 620);
  }

  clearRenderedPath() {
    this.elements.pathLayer.replaceChildren();
  }

  hideActivePath() {
    this.stopPathTimers();
    this.state.path = [];
    this.clearRenderedPath();
  }

  stopPathTimers() {
    if (this.clearPathTimer) {
      clearTimeout(this.clearPathTimer);
      this.clearPathTimer = null;
    }

    if (this.clearHintTimer) {
      clearTimeout(this.clearHintTimer);
      this.clearHintTimer = null;
    }
  }

  getTimeBonus() {
    return Math.max(0, this.config.bonusTime - this.state.elapsedTime) * 8;
  }

  render() {
    this.renderHud();
    this.renderBoard();
    this.renderPath(this.state.path);
    this.renderWinOverlay();
  }

  renderHud() {
    this.elements.score.textContent = String(this.state.score).padStart(5, "0");
    this.elements.best.textContent = String(this.state.bestScore).padStart(5, "0");
    this.elements.time.textContent = formatTime(this.state.elapsedTime);
    this.elements.combo.textContent = `x${this.state.combo}`;
    this.elements.hints.textContent = String(this.state.hintsLeft);
    this.elements.shuffles.textContent = String(this.state.shufflesLeft);
    this.elements.status.textContent = this.t().status[this.state.status];
    this.elements.difficulty.value = this.settings.difficulty;
    this.elements.language.value = this.settings.language;
    this.renderControlState();
  }

  renderControlState() {
    const canUseRunningControls = this.state.status === "running";
    this.elements.controls.start.textContent =
      this.state.status === "paused" ? this.t().continue : this.t().start;
    this.elements.controls.pause.disabled = !canUseRunningControls;
    this.elements.controls.hint.disabled =
      !canUseRunningControls || this.state.hintsLeft <= 0;
    this.elements.controls.shuffle.disabled =
      !canUseRunningControls ||
      this.state.shufflesLeft <= 0 ||
      countVisibleTiles(this.state.board) <= 2;
  }

  showShuffleNotice() {
    if (this.noticeTimer) {
      clearTimeout(this.noticeTimer);
    }

    this.elements.shuffleNotice.textContent = this.t().autoShuffleNotice;
    this.elements.shuffleNotice.hidden = false;
    this.noticeTimer = setTimeout(() => this.hideShuffleNotice(), 1500);
  }

  hideShuffleNotice() {
    if (this.noticeTimer) {
      clearTimeout(this.noticeTimer);
      this.noticeTimer = null;
    }

    this.elements.shuffleNotice.hidden = true;
  }

  renderStaticText() {
    const labels = this.t();

    this.root.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      element.textContent = labels[key] ?? element.textContent;
    });

    Array.from(this.elements.difficulty.options).forEach((option) => {
      option.textContent = labels.difficulty[option.value] ?? option.textContent;
    });
  }

  renderWinOverlay() {
    const isWon = this.state.status === "won";
    this.elements.winOverlay.hidden = !isWon;

    if (!isWon) {
      return;
    }

    const isPerfect = this.state.maxCombo === this.state.pairCount;
    this.elements.finalScore.textContent = String(this.state.score).padStart(5, "0");
    this.elements.finalTime.textContent = formatTime(this.state.elapsedTime);
    this.elements.finalCombo.textContent = `x${this.state.maxCombo}`;
    this.elements.perfect.hidden = !isPerfect;
  }

  t() {
    return TEXT[this.settings.language] ?? TEXT.en;
  }

  renderBoard() {
    this.elements.board.style.setProperty("--rows", this.config.rows);
    this.elements.board.style.setProperty("--cols", this.config.cols);

    const fragment = document.createDocumentFragment();

    this.state.board.forEach((rowTiles, row) => {
      rowTiles.forEach((tile, col) => {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "tile";
        cell.dataset.row = String(row);
        cell.dataset.col = String(col);
        cell.style.setProperty("--tile-color", tile.color);
        cell.setAttribute("aria-label", tile.visible ? tile.label : "empty");
        cell.disabled = !tile.visible || this.state.status !== "running";

        if (!tile.visible) {
          cell.classList.add("empty");
        }

        if (samePoint(this.state.selected, { row, col })) {
          cell.classList.add("selected");
        }

        if (this.state.hinted?.some((point) => samePoint(point, { row, col }))) {
          cell.classList.add("hinted");
        }

        if (tile.visible && tile.image) {
          const image = document.createElement("img");
          image.className = "tile-image";
          image.src = tile.image;
          image.alt = "";
          image.draggable = false;
          cell.append(image);
        } else {
          cell.textContent = tile.visible ? tile.glyph : "";
        }

        fragment.append(cell);
      });
    });

    this.elements.board.replaceChildren(fragment);
  }

  renderPath(path) {
    this.elements.pathLayer.replaceChildren();

    if (!path?.length) {
      return;
    }

    const boardRect = this.elements.board.getBoundingClientRect();

    if (!boardRect.width || !boardRect.height) {
      return;
    }

    const styles = getComputedStyle(this.elements.board);
    const gap = Number.parseFloat(styles.columnGap) || 0;
    const tileWidth = (boardRect.width - (this.config.cols - 1) * gap) / this.config.cols;
    const tileHeight = (boardRect.height - (this.config.rows - 1) * gap) / this.config.rows;
    const points = path.map((point) => {
      const x = point.col * (tileWidth + gap) + tileWidth / 2;
      const y = point.row * (tileHeight + gap) + tileHeight / 2;
      return `${x},${y}`;
    });

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    svg.setAttribute("viewBox", `0 0 ${boardRect.width} ${boardRect.height}`);
    svg.setAttribute("aria-hidden", "true");
    polyline.setAttribute("points", points.join(" "));
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", "#ff4b2f");
    polyline.setAttribute("stroke-width", "5");
    polyline.setAttribute("stroke-linecap", "square");
    polyline.setAttribute("stroke-linejoin", "miter");
    svg.append(polyline);
    this.elements.pathLayer.append(svg);
  }
}
