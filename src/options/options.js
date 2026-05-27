import { getSettings, saveSettings } from "../shared/storage.js";

const form = document.querySelector("[data-settings-form]");
const status = document.querySelector("[data-status]");

const settings = await getSettings();
form.soundEnabled.checked = settings.soundEnabled;
form.scanlinesEnabled.checked = settings.scanlinesEnabled;
form.difficulty.value = settings.difficulty;

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  await saveSettings({
    soundEnabled: form.soundEnabled.checked,
    scanlinesEnabled: form.scanlinesEnabled.checked,
    difficulty: form.difficulty.value
  });

  status.textContent = "Saved";
});
