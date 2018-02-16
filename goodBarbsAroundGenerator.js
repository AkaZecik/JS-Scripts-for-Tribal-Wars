// 09/08/2017
// v1.0.0

javascript:

var shouldPrompt = true;

if(scriptHasRun === undefined)
    var scriptHasRun = false;

if(!scriptHasRun) {
    var WorldData = {
        hostname: "https://" + window.location.hostname,
        allies: {},
        players: {},
        villages: {},
        conquers: {},
        bonuses: {
            "0": "none",
            "1": "+100% wood production",
            "2": "+100% stone production",
            "3": "+100% iron production",
            "4": "+10% farm capacity",
            "5": "+33% recruitment speed in barracks",
            "6": "+33% recruitment speed in stables",
            "7": "+50% recruitment speed in garage",
            "8": "+30% resources production",
            "9": "+50% storage and merchants capacity"
        },
        init: function() {
            /*WorldData.fetchPlayers();*/
            WorldData.fetchVillages();
            /*WorldData.fetchConquers();*/
        },
        fetchPlayers: function() {
            var playersURL = WorldData.hostname + "/map/player.txt";
            var ajaxResponse = Utilities.ajaxSimpleSynchronous(playersURL, "html").trim();
            ajaxResponse.split("\n").forEach(function(playerRawData) {
                var playerData = playerRawData.split(",");
                var playerID = playerData[0];
                WorldData.players[playerID] = {
                    name: playerData[1],
                    tribe: playerData[2],
                    numOfVillages: playerData[3],
                    points: playerData[4],
                    rank: playerData[5]
                };
            });
        },
        fetchVillages: function() {
            var villagesURL = WorldData.hostname + "/map/village.txt";
            var ajaxResponse = Utilities.ajaxSimpleSynchronous(villagesURL, "html").trim();
            ajaxResponse.split("\n").forEach(function(villageRawData) {
                var villageData = villageRawData.split(",");
                var villageID = villageData[0];
                WorldData.villages[villageID] = {
                    name: villageData[1],
                    x: villageData[2],
                    y: villageData[3],
                    owner: villageData[4],
                    points: villageData[5],
                    bonus: villageData[6]
                };
            });
        },
        fetchConquers: function() {
            var conquersURL = WorldData.hostname + "/map/conquer.txt";
            var ajaxResponse = Utilities.ajaxSimpleSynchronous(conquersURL, "html").trim();
            ajaxResponse.split("\n").forEach(function(conquerRawData) {
                var conquerData = conquerRawData.split(",");
                var villageID = conquerData[0];
                var timeStamp = conquerData[1];
                WorldData.conquers[villageID] = WorldData.conquers[villageID] || {};
                WorldData.conquers[villageID][timeStamp] = {
                    ownerAfter: conquerData[2],
                    ownerBefore: conquerData[3]
                };
            });
        }
    };

    var Utilities = {
        ajaxSimpleSynchronous: function(ajaxURL, dataType) {
            var dt;
            $.ajax({
                url: ajaxURL,
                async: false,
                dataType: dataType,
                success: function(data) {
                    dt = data;
                }
            });
            return dt;
        }
    };

    var FarmGenerator = {
        correctSettings: 0,
        villagesOwned: [],
        barbarians: [],
        barbariansInLootAssistantList: {},
        init: function() {
            FarmGenerator.barbariansInLootAssistant();
            if(FarmGenerator.correctSettings) {
                /*FarmGenerator.ownVillages();*/
                FarmGenerator.barbarianVillages();
            } else
                alert("Ustawienia asystenta farmera sa bledne!\nFiltry, ktore maja byc zaznaczone to:\n- \"Uwzględnij raporty z wiosek, które obecnie są atakowane\"\n- \"Uwzględnij raporty wykazujące pełne straty\"\n- \"Uwzględnij raporty wykazujące częściowe straty\"");
        },
        displayUnvisitedBabarians: function(maxDistance) {
            /*var villageID = prompt("Podaj ID wioski: ", 71375) || 71375;*/
            /*var maxDistance = prompt("Podaj maksymalna odleglosc: ", 15) || 15;*/
            var villageID = game_data.village.id;
            /*var maxDistance = 15;*/
            maxDistance = shouldPrompt
                ? (prompt("Podaj maksymalna odleglosc: ", 15) || 15)
                : 15;
            var result = "";
            FarmGenerator.villagesAround(villageID, maxDistance).forEach(function(barbarian) {
                if(!barbarian.visited) {
                    var village = WorldData.villages[barbarian.villageID];
                    var url = WorldData.hostname + game_data.link_base_pure + "place&x=" + village.x + "&y=" + village.y + "&from=simulator&att_spy=1";
                    result += url + "\n";
                }
            });
            console.log(result);
        },
        ownVillages: function() {
            var profileURL = WorldData.hostname + game_data.link_base_pure + "info_player";
            var ajaxResponse = Utilities.ajaxSimpleSynchronous(profileURL, "html");
            var villagesList = $($.parseHTML(ajaxResponse)).find("table#villages_list > tbody > tr");
            var villagesListLength = villagesList.length;

            for(var i = 0; i < villagesListLength; i++) {
                var villageCoords = villagesList.eq(i).children().eq(1).text();
                FarmGenerator.villagesOwned.push(villageCoords);
            };
        },
        barbarianVillages: function() {
            Object.keys(WorldData.villages).forEach(function(villageID) {
                var village = WorldData.villages[villageID];
                if(village.owner == 0)
                    FarmGenerator.barbarians.push(villageID);
            });
        },
        barbariansInLootAssistant: function() {
            var lootAssistantURL = WorldData.hostname + game_data.link_base_pure + "am_farm";
            var ajaxResponse = Utilities.ajaxSimpleSynchronous(lootAssistantURL, "html");
            var ajaxResponseParsed = $($.parseHTML(ajaxResponse));

            var checkboxes = {
                allVillage: $(ajaxResponseParsed).find("input#all_village_checkbox").prop("checked"),
                attacked: $(ajaxResponseParsed).find("input#attacked_checkbox").prop("checked"),
                fullLosses: $(ajaxResponseParsed).find("input#full_losses_checkbox").prop("checked"),
                partialLosses: $(ajaxResponseParsed).find("input#partial_losses_checkbox").prop("checked"),
                fullHauls: $(ajaxResponseParsed).find("input#full_hauls_checkbox").prop("checked")
            };
            if(checkboxes.allVillage === false && checkboxes.attacked === true && checkboxes.fullLosses === true && checkboxes.partialLosses === true && checkboxes.fullHauls === false)
                FarmGenerator.correctSettings = 1;
            else
                return;

            var tabsTD = ajaxResponseParsed.find("div#plunder_list_nav > table td").filter(function() {
                return $(this).text().trim().match(/(?: (?:\[\d+\]|>\d+<|\.\.\.) )+/);
            });
            var numOfTabs = tabsTD.length ? parseInt(tabsTD.find("a:eq(-1)").text().match(/\d+/)[0]) : 1;
            var lootAssistantTabURLBase = lootAssistantURL + "&order=distance&dir=asc&Farm_page=";

            for(var i = 0; i < numOfTabs; i++) {
                console.log("Reading tab " + (i+1) + " out of " + numOfTabs);
                ajaxResponse = Utilities.ajaxSimpleSynchronous(lootAssistantTabURLBase + i, "html");
                var plunderListElements = $($.parseHTML(ajaxResponse)).find("table#plunder_list > tbody > tr:has(img[src$=\"place.png\"])").slice(1);
                plunderListElements.each(function() {
                    var villageID = this.id.match(/village_(\d+)/)[1];
                    FarmGenerator.barbariansInLootAssistantList[villageID] = 1;
                });
            }
        },
        villagesAround: function(villageID, maxDistance) {
            var centerVillage = WorldData.villages[villageID];
            var x = centerVillage.x;
            var y = centerVillage.y;
            var maxDistanceSqr = maxDistance*maxDistance;
            var villagesAround = {};
            var villagesAroundArr = [];

            FarmGenerator.barbarians.forEach(function(villageID) {
                var village = WorldData.villages[villageID];
                var distanceSqr = (x-village.x)*(x-village.x) + (y-village.y)*(y-village.y);
                if(distanceSqr <= maxDistanceSqr) {
                    villagesAroundArr.push({
                        villageID: villageID,
                        distance: distanceSqr,
                        visited: FarmGenerator.barbariansInLootAssistantList[villageID] ? 1 : 0
                    });
                }
            });

            villagesAroundArr.sort(function(a, b) {
                if(a.distance < b.distance)
                    return -1;
                if(a.distance > b.distance)
                    return 1;
                return 0;
            });

            return villagesAroundArr;
        }
    };

    WorldData.init();
    FarmGenerator.init();
}

if(FarmGenerator.correctSettings)
    FarmGenerator.displayUnvisitedBabarians();

sriptHasRun = true;

void(0);
