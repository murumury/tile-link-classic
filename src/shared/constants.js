export const GAME_SETTINGS_KEY = "retroGameSettings";
export const BEST_SCORES_KEY = "retroLinkBestScores";

export const DIFFICULTIES = {
  easy: {
    label: "Easy",
    rows: 6,
    cols: 8,
    assetCount: 12,
    bonusTime: 180,
    hints: 5,
    shuffles: 3
  },
  normal: {
    label: "Normal",
    rows: 8,
    cols: 10,
    assetCount: 20,
    bonusTime: 240,
    hints: 3,
    shuffles: 2
  },
  hard: {
    label: "Hard",
    rows: 10,
    cols: 12,
    assetCount: 20,
    bonusTime: 300,
    hints: 2,
    shuffles: 1
  }
};

export const DEFAULT_SETTINGS = {
  soundEnabled: true,
  scanlinesEnabled: true,
  difficulty: "normal",
  language: "en"
};

export const GAME_EVENTS = {
  START: "game:start",
  PAUSE: "game:pause",
  RESET: "game:reset"
};
