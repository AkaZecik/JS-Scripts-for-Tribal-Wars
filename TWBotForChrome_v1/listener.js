// var farmBot, reloader, farmer;
var tabID;

chrome.browserAction.onClicked.addListener(function(tab) {
    var url = new URL(tab.url);

    if(url.searchParams.get("screen") == "overview_villages" && url.searchParams.get("mode") == "combined") {
        tabID = tab.id;
        chrome.tabs.create({url: "https://" + url.hostname + "/game.php", active: true});

        chrome.runtime.onMessage.addListener(
            function test(message) {
                if(message.name && message.name == "villagesTable") {
                    chrome.runtime.onMessage.removeListener(test);
                    var villagesTable = message.villagesTable;
                    var villagesTableLength = villagesTable.length;
                    var counter = 0;
                    
                    chrome.storage.local.get({
                        farmerFarmOn: "c",
                        farmerTimer: "30",
                        farmerWall: "2",
                        farmerDistance: "15",
                        farmerMinTime: "200",
                        farmerMaxTime: "400"
                    }, function(options) {
                        var farmBotTimer = parseInt(options.farmerTimer);
                        var settings = {
                            farm_on: options.farmerFarmOn,
                            max_wall: parseInt(options.farmerWall),
                            max_distance: parseInt(options.farmerDistance),
                            time_min: parseInt(options.farmerMinTime),
                            time_max: parseInt(options.farmerMaxTime)
                        };

                        var sleeper;

                        chrome.runtime.onMessage.addListener(
                            function pageUpdater(message) {
                                if(message.name && message.name == "startNewFarm") {
                                    var game_data = message.game_data;
                                    console.log("I've just finished farming. Time: " + (new Date()).toString() + ", ID: " + game_data.village.id + ", name: " + game_data.village.name);
                                    if(counter < villagesTableLength) {
                                        var farmURL = "https://" + url.hostname + "/game.php?village=" + villagesTable[counter] + "&screen=am_farm";
                                        counter++;
                                        chrome.tabs.update(tabID, {url: farmURL});
                                    } else {
                                        counter = 0;
                                        sleeper = setInterval(function() { console.log("I'm not sleeping") }, 30000);
                                    }
                                }
                            }
                        );

                        chrome.tabs.onUpdated.addListener(
                            function farmer(updatedTabID, changeInfo) {
                                if(tabID == updatedTabID && changeInfo.url) 
                                    chrome.tabs.executeScript(tabID, {code: "var settings = " + JSON.stringify(settings) + "; var tabID = " + tabID}, function() {
                                        chrome.tabs.executeScript(tabID, {file: "farmer.js"});
                                    });
                            }
                        );

                        console.log("TribalWars farmer script is starting with following settings:");
                        console.log(settings);
                        console.log("and will repeat every " + options.farmerTimer + " minutes");
                        console.log("");

                        console.log("Farming on " + (new Date).toString());
                        // chrome.runtime.sendMessage({name: "startNewFarm"});
                        counter = 1;
                        chrome.tabs.update(tabID, {url: "https://" + url.hostname + "/game.php?village=" + villagesTable[0] + "&screen=am_farm"});
                        var farmBot = setInterval(function() {
                            clearInterval(sleeper);
                            console.log("Farming on " + (new Date).toString());
                            // chrome.runtime.sendMessage({name: "startNewFarm"});
                            counter = 1;
                            chrome.tabs.update(tabID, {url: "https://" + url.hostname + "/game.php?village=" + villagesTable[0] + "&screen=am_farm"});
                        }, farmBotTimer*60000);
                    });
                }
            }
        );

        chrome.tabs.executeScript(tabID, {file: "jquery.js"}, function() {
            chrome.tabs.executeScript(tabID, {file: "get_villages_from_group.js"});
        });

    } else {
        chrome.tabs.update(tab.id, {url: "https://" + url.hostname + "/game.php?screen=overview_villages&mode=combined"});
    }
});
