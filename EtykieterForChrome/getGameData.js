window.addEventListener("GotGameData", function (event) {
    window.removeEventListener("GotGameData", arguments.callee);
    chrome.runtime.sendMessage({
        name: "GotGameData",
        data: event.detail
    });
});

script = document.createElement("script");
script.src = chrome.runtime.getURL("getGameDataInjected.js");
script.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);
