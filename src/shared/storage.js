import { BEST_SCORES_KEY, DEFAULT_SETTINGS, GAME_SETTINGS_KEY } from "./constants.js";

function getChromeStorage() {
  return globalThis.chrome?.storage?.local ?? null;
}

function readLocalValue(key, fallback) {
  try {
    const value = globalThis.localStorage?.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalValue(key, value) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures so the game can still run in restricted browser contexts.
  }
}

export async function getSettings() {
  const chromeStorage = getChromeStorage();

  if (!chromeStorage) {
    return {
      ...DEFAULT_SETTINGS,
      ...readLocalValue(GAME_SETTINGS_KEY, {})
    };
  }

  const result = await chromeStorage.get(GAME_SETTINGS_KEY);
  return {
    ...DEFAULT_SETTINGS,
    ...(result[GAME_SETTINGS_KEY] ?? {})
  };
}

export async function saveSettings(settings) {
  const nextSettings = {
    ...DEFAULT_SETTINGS,
    ...settings
  };
  const chromeStorage = getChromeStorage();

  if (!chromeStorage) {
    writeLocalValue(GAME_SETTINGS_KEY, nextSettings);
    return;
  }

  await chromeStorage.set({
    [GAME_SETTINGS_KEY]: nextSettings
  });
}

export async function getBestScores() {
  const chromeStorage = getChromeStorage();

  if (!chromeStorage) {
    return readLocalValue(BEST_SCORES_KEY, {});
  }

  const result = await chromeStorage.get(BEST_SCORES_KEY);
  return result[BEST_SCORES_KEY] ?? {};
}

export async function saveBestScore(difficulty, score) {
  const bestScores = await getBestScores();
  const nextScore = Math.max(bestScores[difficulty] ?? 0, score);
  const nextBestScores = {
    ...bestScores,
    [difficulty]: nextScore
  };
  const chromeStorage = getChromeStorage();

  if (!chromeStorage) {
    writeLocalValue(BEST_SCORES_KEY, nextBestScores);
    return nextScore;
  }

  await chromeStorage.set({
    [BEST_SCORES_KEY]: nextBestScores
  });

  return nextScore;
}
