window.addEventListener("GameData", function eventListener (event) {
	window.removeEventListener("GameData", eventListener);
	chrome.runtime.sendMessage({name:"GameData", data:event.detail});
});

var script = document.createElement("script");
script.src = chrome.runtime.getURL("getGameDataInjected.js");
script.onload = function () {
	this.remove();
};
(document.head || document.documentElement).appendChild(script);
