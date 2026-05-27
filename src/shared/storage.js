import { BEST_SCORES_KEY, DEFAULT_SETTINGS, GAME_SETTINGS_KEY } from "./constants.js";

export async function getSettings() {
  const result = await chrome.storage.local.get(GAME_SETTINGS_KEY);
  return {
    ...DEFAULT_SETTINGS,
    ...(result[GAME_SETTINGS_KEY] ?? {})
  };
}

export async function saveSettings(settings) {
  await chrome.storage.local.set({
    [GAME_SETTINGS_KEY]: {
      ...DEFAULT_SETTINGS,
      ...settings
    }
  });
}

export async function getBestScores() {
  const result = await chrome.storage.local.get(BEST_SCORES_KEY);
  return result[BEST_SCORES_KEY] ?? {};
}

export async function saveBestScore(difficulty, score) {
  const bestScores = await getBestScores();
  const nextScore = Math.max(bestScores[difficulty] ?? 0, score);

  await chrome.storage.local.set({
    [BEST_SCORES_KEY]: {
      ...bestScores,
      [difficulty]: nextScore
    }
  });

  return nextScore;
}
