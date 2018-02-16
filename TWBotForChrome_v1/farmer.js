document.addEventListener("FINISHED_FARMING", function(data) {
    chrome.runtime.sendMessage({name: "startNewFarm", game_data: data.detail});
});

var s = document.createElement('script');
s.src = chrome.runtime.getURL('farm_sender.js');
s.onload = function() {
    document.dispatchEvent(new CustomEvent("SEND_SETTINGS", {
        detail: settings
    }))
    this.remove();
};
(document.head || document.documentElement).appendChild(s);
