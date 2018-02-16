javascript:

$.when(
    $.ajax({
        url: "https://" + window.location.hostname + "/map/player.txt",
        type: "GET",
        dataType: "html",
        success: function () {
            console.log("Players downloaded");
        }
    }),
    $.ajax({
        url: "https://" + window.location.hostname + "/map/village.txt",
        type: "GET",
        dataType: "html",
        success: function () {
            console.log("Villages downloaded");
        }
    })
).then(function (playersRequest, villagesRequest) {
    var content = $("<form/>").submit(function (event) {
        event.preventDefault();
    }).append($("<h2/>").text("Wioski do fejkowania"))
        .append($("<textarea/>").prop("id", "villages_to_fake").css({"height":"300px"}))
        .append($("<br/>"))
        .append($("<button/>", {type: "button"}).text("GENERUJ FEJKI").click(function () {
            prepareData(playersRequest, villagesRequest);
        }));

    Dialog.show("villages_to_fake", content);
});

function prepareData (playersRequest, villagesRequest) {
    var playersData = playersRequest[0].trim().split("\n");
    var villagesData = villagesRequest[0].trim().split("\n");
    var fakesData = $("#villages_to_fake").val().trim().split("\n");

    var players = {
        byID: {},
        byName: {}
    };

    playersData.forEach(function (playerData) {
        playerData = playerData.split(",");
        var id = playerData[0];
        var ally = playerData[2];
        var name = decodeURIComponent(playerData[1]).replace(/\+/g, " ");
        if(ally == "354") {
            players.byID[id] = {
                faking: false,
                name: name,
                villages: {
                    own: [],
                    toFake: []
                },
                fakes: {}
            };
            players.byName[name] = id;
        }
    });

    villagesData.forEach(function (villageData) {
        villageData = villageData.split(",");
        var id = villageData[0];
        var x = parseInt(villageData[2]);
        var y = parseInt(villageData[3]);
        var owner = villageData[4];
        if(players.byID[owner]) {
            players.byID[owner].villages.own.push({
                id: id,
                x: x,
                y: y
            });
        }
    });

    var fakesDataSorted = [];
    fakesData.forEach(function (textNode) {
        textNode = textNode.trim();
        if(textNode.match(/\d+\|\d+/)) {
            var coords = textNode.match(/(\d+)\|(\d+)/);
            fakesDataSorted[fakesDataSorted.length - 1].villagesToFake.push({
                x: parseInt(coords[1]),
                y: parseInt(coords[2])
            })
        } else if(textNode != "") {
            fakesDataSorted.push({
                playerName: textNode,
                villagesToFake: []
            });
        }
    });
    fakesDataSorted.forEach(function (fakes) {
        var id = players.byName[fakes.playerName];
        players.byID[id].faking = true;
        players.byID[id].villages.toFake = fakes.villagesToFake;
    });

    for(var playerID in players.byID) {
        var villagesOwn = players.byID[playerID].villages.own;
        var villagesToFake = players.byID[playerID].villages.toFake;
        if(villagesToFake.length) {
            for(var i = 0; i < villagesOwn.length; i++) {
                var villageID = villagesOwn[i].id;
                players.byID[playerID].fakes[villageID] = {};
                for(var j = 0; j < villagesToFake.length; j++) {
                    var x1 = villagesOwn[i].x;
                    var y1 = villagesOwn[i].y;
                    var x2 = villagesToFake[j].x;
                    var y2 = villagesToFake[j].y;
                    var distance = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
                    var timeInSeconds = Math.round(distance*1800);
                    var timeToTravel = secondsToString(timeInSeconds);
                    players.byID[playerID].fakes[villageID][x2 + "|" + y2] = timeToTravel;
                }
            }
        }
    }

    console.log(players);

    var fakesString = "";
    for(var playerID in players.byID) {
        if(players.byID[playerID].faking) {
            var table = "[player]" + players.byID[playerID].name + "[/player]\n[table]\n[*]";
            players.byID[playerID].villages.toFake.forEach(function (villageToFake) {
                table += "[|][coords]" + villageToFake.x + "|" + villageToFake.y + "[/coords]"
            });
            table += "[/*]\n";
            players.byID[playerID].villages.own.forEach(function (ownVillage) {
                table += "[*][coords]" + ownVillage.x + "|" + ownVillage.y + "[/coords]";
                players.byID[playerID].villages.toFake.forEach(function (villageToFake) {
                    table += "[|][url=https://" + window.location.hostname + "/game.php?village=" + ownVillage.id + "&screen=place&x=" + villageToFake.x + "&y=" + villageToFake.y + "]" + players.byID[playerID].fakes[ownVillage.id][villageToFake.x + "|" + villageToFake.y] + "[/url]";
                });
                table += "[/*]\n";
            });
            table += "[/table]\n\n";
            fakesString += table;
        }
    }

    Dialog.close();
    var showFakesTablesContent = $("<textarea/>").prop("id", "fejki_tabelki").css({"width":"300px", "height":"400px"}).val(fakesString);
    Dialog.show("fakes_tables", showFakesTablesContent);
    $("#fejki_tabelki").focus().select();
}

function secondsToString (seconds) {
    var days = Math.floor(seconds/86400);
    var hours = Math.floor((seconds - days*86400)/3600);
    var minutes = Math.floor((seconds - days*86400 - hours*3600)/60);
    seconds = seconds - days*86400 - hours*3600 - minutes*60;

    days = days > 0 ? (days.toString() + ":") : "";
    hours = (hours < 10 ? "0" + hours : hours.toString()) + ":";
    minutes = (minutes < 10 ? "0" + minutes : minutes.toString()) + ":";
    seconds = (seconds < 10 ? "0" + seconds : seconds.toString());

    return (days + hours + minutes + seconds);
}
