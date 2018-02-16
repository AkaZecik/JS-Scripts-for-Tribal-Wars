chrome.browserAction.onClicked.addListener(function () {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        var tab = tabs[0];
        chrome.tabs.executeScript(tab.id, {file: "jquery.min.js"}, function () {
            chrome.tabs.executeScript(tab.id, {file: "getVillages.js"});
        });
    });
});

chrome.runtime.onMessage.addListener(function (message, sender) {
    if(message.name == "GotVillages") {
        console.log(message);
        var urls = message.data.urls;
        console.log(urls);
        var promisesArray = [];
        for(var i = 0; i < urls.length; i++) {
            var url = urls[i];
            chrome.tabs.create({url: url}, function (tab) {
                var resolver;
                var promise = new Promise(function (resolve, reject) {
                    resolver = function (units) {
                        resolve(units);
                    };
                });
                promises[tab.id] = {
                    promise: promise,
                    resolver: resolver
                };
                promisesArray.push(promise);
                if(i + 1 == urls.length) {
                    console.log(promisesArray);
                    $.when.apply($, promisesArray).then(function () {
                        console.log(arguments);
                    });
                }
            });
        }
    }
    if(message.name == "GotUnits" && "object" == typeof promises[sender.tab.id]) {
        var units = message.data.units;
        chrome.tabs.remove(sender.tab.id, function () {
            promises[sender.tab.id].resolver(units);
        });
    }
});

chrome.tabs.onUpdated.addListener(function (tabID, changeInfo, tab) {
    if("object" == typeof promises[tabID] && changeInfo.status == "complete") {
        chrome.tabs.executeScript(tabID, {file: "getUnits.js"});
    }
});

var promises = {};
