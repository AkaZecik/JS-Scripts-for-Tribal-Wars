chrome.runtime.onMessage.addListener(function (message, sender) {
    if(message.name == "time") {
        var time = message.data.time;
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            var tab = tabs[0];
            etykieterzy[tab.id] = {
                time: time
            };
            chrome.tabs.executeScript({file: "getGameData.js"});
        });
    }

    if(message.name == "GotGameData") {
        var currentGroup = message.data.currentGroup;
        var hostname = message.data.hostname;
        var url = hostname + "/game.php?screen=overview_villages&mode=incomings&type=unignored&subtype=attacks&group=" + currentGroup;
        etykieterzy[sender.tab.id].url = url;
        etykieterzy[sender.tab.id].currentUpdate = "pageReload";
        chrome.tabs.update(sender.tab.id, {url: url});
    }
});

var etykieterzy = {};

chrome.tabs.onUpdated.addListener(function (tabID, changeInfo, tab) {
    if(etykieterzy[tabID] && changeInfo.status == "complete") {
        switch(etykieterzy[tabID].currentUpdate) {
            case "pageReload":
                etykieterzy[tabID].currentUpdate = "etykietowanie";
                chrome.tabs.executeScript(tabID, {file: "jquery.min.js"}, function () {
                    chrome.tabs.executeScript(tabID, {file: "etykietuj.js"});
                });
                break;
            case "etykietowanie":
                etykieterzy[tabID].currentUpdate = "pageReload";
                var timeInMS = etykieterzy[tabID].time*60*1000;
                timeInMSRandomized = Math.round((Math.random()*2 + 9)*timeInMS/10);
                console.log(timeInMSRandomized);
                setTimeout(function () {
                    chrome.tabs.update(tabID, {url: etykieterzy[tabID].url});
                }, timeInMSRandomized);
                break;
        }
    }
});

chrome.tabs.onRemoved.addListener(function (tabID) {
    if(etykieterzy[tabID]) {
        delete etykieterzy[tabID];
    }
});
