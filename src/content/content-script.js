chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "RETRO_GAME_PING") {
    return;
  }

  console.debug("[Retro Chrome Game] content script active");
});
