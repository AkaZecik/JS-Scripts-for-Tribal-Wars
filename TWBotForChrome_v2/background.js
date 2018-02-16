Object.prototype.extend = function () {
    var object = Object.create(this);
    var length = arguments.length;
    var index = length;

    while (index) {
        var extension = arguments[length - (index--)];

        for (var property in extension)
            if (Object.hasOwnProperty.call(extension, property) || typeof object[property] === "undefined")
                object[property] = extension[property];
    }

    return object;
};

function asynchronousLoop (iterations, func, callback) {
    var i = -1;

    var loop = {
        go: function () {
            if(i + 1 < iterations) {
                i++;
                func();
            } else
                loop.break();
        },
        iteration: function () {
            return i;
        },
        break: function () {
            callback();
        }
    };

    return loop;
}

var tabCallbacks = {};

var farmers = {};
var Farmer = {
    create: function (tabID, hostname, sitter, groupID, farmOn, farmTimeInterval, maxWall, maxDistance, minTime, maxTime) {
        return this.extend({
            tabID: tabID,
            gameURL: hostname + "/game.php",
            villagesFromGroupURL: hostname + "/game.php?screen=overview_villages&mode=combined&group=" + groupID + "&page=-1" + (sitter != 0 ? ("&t=" + sitter) : ""),
            farmOn: farmOn,
            farmTimeIntervalInMS: 1000*farmTimeInterval,
            maxWall: maxWall,
            maxDistance: maxDistance,
            minTime: minTime,
            maxTime: maxTime
        });
    },
    start: function () {
        var self = this;

        if(self.nextFarm)
            clearTimeout(self.nextFarm);

        self.nextFarm = setTimeout(function () {
            if(self.farmLoop !== undefined) {
                self.farmLoopFinishEventListener = function (event) {
                    var tabID = event.detail.tabID;
                    if(self.tabID == tabID) {
                        window.removeEventListener(self.farmLoopFinishEventListener);
                        self.farmLoopFinishEventListener = undefined;
                        self.start();
                    }
                }
                window.addEventListener("FarmLoopFinished", self.farmLoopFinishEventListener);
            } else {
                self.start();
            }
        }, self.farmTimeIntervalInMS);

        self.villagesFromGroup();
    },
    farm: function (villages) {
        var self = this;

        self.farmLoop = asynchronousLoop(villages.length, function () {
            self.callback = function () {
                var settings = {
                    farmOn: self.farmOn,
                    maxWall: self.maxWall,
                    maxDistance: self.maxDistance,
                    minTime: self.minTime,
                    maxTime: self.maxTime
                };
                chrome.tabs.executeScript(self.tabID, {file:"jquery.min.js"}, function () {
                    chrome.tabs.executeScript(self.tabID, {code:"var settings = " + JSON.stringify(settings) + ";"}, function () {
                        chrome.tabs.executeScript(self.tabID, {file:"farmer.js"});
                    });
                });
            };
            
            var i = self.farmLoop.iteration();
            var villageID = villages[i];
            var url = self.gameURL + "?village=" + villageID + "&screen=am_farm";

            chrome.tabs.update(self.tabID, {url:url});
        }, function () {
            self.farmLoop = undefined;
            window.dispatchEvent(new CustomEvent("FarmLoopFinished", {detail:{tabID: self.tabID}}));
        });

        self.farmLoop.go();
    },
    pause: function () {
    },
    unpause: function () {
    },
    kill: function () {
        clearTimeout(this.nextFarm);
        farmers[this.id] = undefined;
    },
    villagesFromGroup: function () {
        var self = this;
        self.callback = function () {
            chrome.tabs.executeScript(self.tabID, {file:"jquery.min.js"}, function () {
                chrome.tabs.executeScript(self.tabID, {file:"getVillagesFromGroup.js"});
            });
        };
        chrome.tabs.update(self.tabID, {url:self.villagesFromGroupURL});
    }
};

chrome.tabs.onUpdated.addListener(function (tabID, changeInfo) {
    if(changeInfo.status == "complete" && farmers[tabID] && "function" == typeof farmers[tabID].callback) {
        farmers[tabID].callback();
        farmers[tabID].callback = undefined;
    }
});

chrome.runtime.onMessage.addListener(function (message, sender) {
    if(message.name == "gotVillages") {
        var tabID = sender.tab.id;
        farmers[tabID] && farmers[tabID].farm(message.villages);
    }
    if(message.name == "farmFinished") {
        var tabID = sender.tab.id;
        farmers[tabID] && "object" == typeof farmers[tabID].farmLoop && farmers[tabID].farmLoop.go();
    }
});

