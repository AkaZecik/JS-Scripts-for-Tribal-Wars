window.addEventListener("GotUnits", function (event) {
    window.removeEventListener("GotUnits", arguments.callee);
    chrome.runtime.sendMessage({
        name: "GotUnits",
        data: event.detail.units
    });
});

var script = document.createElement("script");
script.src = chrome.runtime.getURL("getUnitsInjected.js");
script.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);
