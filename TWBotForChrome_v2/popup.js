$(function () {
    chrome.runtime.getBackgroundPage(function (bg) {
        chrome.tabs.query({active:true, currentWindow: true}, function (tabs) {
            var tab = tabs[0];
            if(bg.farmers[tab.id] !== undefined) {
                $("#loading").hide();
                $("#already_farming").show();
            } else if(tab.url.match(/https:\/\/pl\d+\.plemiona\.pl\/game\.php/)) {
                chrome.tabs.executeScript(tab.id, {file:"getGameData.js"});
            } else {
                $("#loading").hide();
                $("#no_farm").show();
            }
        });
    });
});

chrome.runtime.onMessage.addListener(function GameDataListener (message, sender) {
    if(message.name == "GameData") {
        chrome.runtime.onMessage.removeListener(GameDataListener);

        var groups = message.data.groups.result;
        for(var i = 0; i < groups.length; i++) {
            var groupID = groups[i].group_id;
            var groupName = groups[i].name;
            $("#group").append($("<option/>", {value:groupID}).text(groupName));
        }

        restoreOptions();

        $("#submit").click(function () {
            chrome.runtime.getBackgroundPage(function (bg) {
                var tabID = sender.tab.id;
                var hostname = message.data.hostname;
                var sitter = parseInt(message.data.gameData.player.sitter);
                var groupID = parseInt($("#group").val());
                var farmOn = $("#farm_on").val();
                var farmTimeInterval = parseInt($("#farm_time_interval").val());
                var maxWall = parseInt($("#max_wall").val());
                var maxDistance = parseInt($("#max_distance").val());
                var minTime = parseInt($("#min_time").val());
                var maxTime = parseInt($("#max_time").val());
                bg.farmers[tabID] = bg.Farmer.create(tabID, hostname, sitter, groupID, farmOn, farmTimeInterval, maxWall, maxDistance, minTime, maxTime);
                bg.farmers[tabID].start();
                window.close();
            });
        });
        $("#loading").hide();
        $("#farmer").show();
    }
});

function restoreOptions() {
    chrome.storage.local.get({
        farmerFarmOn: "c",
        farmerFarmTimeInterval: "1800",
        farmerMaxWall: "2",
        farmerMaxDistance: "15",
        farmerMinTime: "200",
        farmerMaxTime: "400"
    }, function(options) {
        $("#farm_on").val(options.farmerFarmOn);
        $("#farm_time_interval").val(options.farmerFarmTimeInterval);
        $("#max_wall").val(options.farmerMaxWall);
        $("#max_distance").val(options.farmerMaxDistance);
        $("#min_time").val(options.farmerMinTime);
        $("#max_time").val(options.farmerMaxTime);
    });
}
