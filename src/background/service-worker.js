chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    chrome.storage.local.set({
      retroGameStats: {
        highScore: 0,
        runs: 0
      }
    });
  }
});
