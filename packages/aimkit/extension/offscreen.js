"use strict";
(() => {
  // src/offscreen/offscreen.ts
  var area = document.getElementById("clip");
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.target !== "offscreen") return false;
    if (msg.type === "clipboard") {
      area.value = msg.text;
      area.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      area.value = "";
      sendResponse({ ok });
    }
    return false;
  });
})();
