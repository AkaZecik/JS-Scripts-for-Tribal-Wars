javascript:

var CatWaveUserSettings = {
        lang: "pl",
        destroyWall: true,
        increaseWallLevelBy: 0,
        defaultBuilding: "storage"
    };

/***** CatWave SCRIPT *****/
/*
    AUTHOR: AKZ123
    VERSION: 0.12.0.0
    LAST UPDATE: 09/20/2017
    TO DO:
        - display an info about the village you will attack
        - validate lang, defaultBuilding of CatwaveUserSettings 
        - calculate the height of the window
        - watch for new rows in a loot assistant or if a user changes filter settings
        - allow for only wall destruction when number of attacks is equal to 0
        - let a user generate his own settings
        - what if there is no place? NaN!
*/

/***** CatWave *****/

if(game_data.device == "desktop") {
    if("undefined" == typeof CatWave) {
        var CatWave = {
            GameData: {
                hostname: "https://" + window.location.hostname,
                barbarianMaxPoints: 0,
                buildings: [],
                buildingsInfo: {},
                buildingsImmune: "church_f,hide".split(","),
                buildingsNotImmune: [],
                units: game_data.units,
                villages: {},
                loaded: false,
                fetch: function() {
                    var configURL = CatWave.GameData.hostname + "/interface.php?func=get_config";
                    var buildingsConfigURL = CatWave.GameData.hostname + "/interface.php?func=get_building_info";
                    var villagesURL = CatWave.GameData.hostname + "/map/village.txt";
                    return $.when(
                        CatWave.ajaxSimple(configURL, "xml").then(function (data) {
                            CatWave.GameData.readConfig(data);
                        }),
                        CatWave.ajaxSimple(buildingsConfigURL, "xml").then(function(data) {
                            CatWave.GameData.readBuildingsConfig(data);
                        }),
                        CatWave.ajaxSimple(villagesURL, "html").then(function (data) {
                            CatWave.GameData.readVillages(data);
                        }));
                },
                readBuildingsConfig: function(ajaxResponse) {
                    var buildings = [];

                    var buildingsInfo = $(ajaxResponse).find("config").children().toArray();
                    buildingsInfo.forEach(function(tagElement) {
                        var tagName = $(tagElement).prop("tagName");
                        var maxLevel = parseInt($(tagElement).find("max_level").text());
                        var minLevel = parseInt($(tagElement).find("min_level").text());

                        buildings.push(tagName);
                        CatWave.GameData.buildingsInfo[tagName] = {
                            "maxLevel": maxLevel,
                            "minLevel": minLevel
                        };

                        if(CatWave.GameData.buildingsImmune.indexOf(tagName) == -1) {
                            CatWave.GameData.buildingsNotImmune.push(tagName);
                        }
                    });

                    CatWave.GameData.buildings = buildings;
                },
                readConfig: function (ajaxResponse) {
                    CatWave.GameData.barbarianMaxPoints = parseInt($(ajaxResponse).find("game barbarian_max_points").text());
                },
                readVillages: function (ajaxResponse) {
                    var villages = ajaxResponse.split("\n");
                    for(var i = 0; i < villages.length; i++) {
                        var village = villages[i].split(",");
                        var target = village[2] + "|" + village[3];
                        var owner = parseInt(village[4]);
                        var points = parseInt(village[5]);
                        CatWave.GameData.villages[target] = {
                            owner: owner,
                            points: points
                        };
                    }
                }
            },
            config: {
                lang: "en",
                destroyWall: true,
                increaseWallLevelBy: 0,
                defaultBuilding: "main",
                readUserSettings: function() {
                    if(typeof CatWaveUserSettings == "object") {
                        if(typeof CatWaveUserSettings.lang == "string") {
                            CatWave.config.lang = CatWaveUserSettings.lang;
                        }
                        if(typeof CatWaveUserSettings.destroyWall == "boolean") {
                            CatWave.config.destroyWall = CatWaveUserSettings.destroyWall;
                        }
                        if(typeof CatWaveUserSettings.increaseWallLevelBy == "number") {
                            CatWave.config.increaseWallLevelBy = CatWaveUserSettings.increaseWallLevelBy;
                        }
                        if(typeof CatWaveUserSettings.defaultBuilding == "string") {
                            CatWave.config.defaultBuilding = CatWaveUserSettings.defaultBuilding;
                        }
                    }
                }
            },
            cache: {},
            init: function() {
                CatWave.config.readUserSettings();
                if(game_data.screen == "am_farm" || game_data.screen == "info_village" || game_data.screen == "report" && window.location.href.match(/view=\d+/)) {
                    $.when(CatWave.GameData.fetch())
                        .then(function() {
                            scriptHasRun = true;
                            CatWave.GameData.loaded = true;
                            CatWave.run();
                        });
                } else {
                    UI.ErrorMessage(CatWave.UI.getText("message", 0));
                }
            },
            run: function() {
                if(CatWave.GameData.loaded) {
                    if(game_data.screen == "am_farm") {
                        CatWave.UI.screenAMFarm();
                    } else if(game_data.screen == "info_village") {
                        CatWave.UI.screenInfoVillage();
                    } else if(game_data.screen == "report" && window.location.href.match(/view=\d+/)) {
                        CatWave.UI.screenReportView();
                    }
                }
            },
            catsNeeded: function(buildingLevel, levelsToDestroy) {
                var catsNeeded = 1.5*(2*levelsToDestroy - 1);
                for(var i = 0; i < buildingLevel; i++)
                    catsNeeded *= 1.09;

                return Math.ceil(catsNeeded);
            },
            catsUsed: function(buildingLevel, numberOfAttacks, levelsToDestroy) {
                var catsUsed = 0;
                for(var i = numberOfAttacks; i > 1; i--)
                    catsUsed += CatWave.catsNeeded(buildingLevel - numberOfAttacks + i, 1);
                if(numberOfAttacks) {
                    catsUsed += CatWave.catsNeeded(buildingLevel - numberOfAttacks + 1, levelsToDestroy - numberOfAttacks + 1);
                }

                return catsUsed;
            },
            levelsDestroyed: function(buildingLevel, numberOfCatapults) {
                var levelsDestroyed = 0;
                for(var i = 1; i <= buildingLevel; i++) {
                    var catsNeeded = CatWave.catsNeeded(buildingLevel, i);
                    if(catsNeeded <= numberOfCatapults) {
                        levelsDestroyed++;
                    }
                    else
                        break;
                }

                return levelsDestroyed;
            },
            maxNumOfLevelsDestroyed: function(buildingLevel, buildingMinLevel, numberOfCatapults) {
                var numOfLevelsDestroyed = 0;
                while(buildingLevel > buildingMinLevel) {
                    var catsNeeded = CatWave.catsNeeded(buildingLevel, 1);
                    if(numberOfCatapults >= catsNeeded) {
                        numberOfCatapults -= catsNeeded;
                        buildingLevel--;
                        numOfLevelsDestroyed++;
                    } else
                        break;
                }

                return numOfLevelsDestroyed;
            },
            minNumOfAttacks: function(buildingLevel, levelsToDestroy, numberOfCatapults) {
                if(levelsToDestroy == 0) {
                    return 0;
                }

                for(var i = 1; i <= levelsToDestroy; i++) {
                    var catsUsed = CatWave.catsUsed(buildingLevel, i, levelsToDestroy);
                    if(catsUsed <= numberOfCatapults) {
                        return i;
                    }
                }
            },
            unitsAvailable: function() {
                var catsURL = CatWave.GameData.hostname + game_data.link_base_pure + "place&mode=units&display=units";
                return CatWave.ajaxSimple(catsURL, "html").then(function(ajaxResponse) {
                    var unitsHome = $($.parseHTML(ajaxResponse)).find("table#units_home tr");
                    var amountOfUnit = function (unit) {
                        var columnIndex = unitsHome.eq(0).find("th").index(unitsHome.eq(0).find("th:has(img[src$=\"" + unit + ".png\"])"));
                        var amount = parseInt(unitsHome.eq(1).find("td").eq(columnIndex).text());
                        return amount;
                    };
                    var unitsAvailable = {
                        axes: amountOfUnit("axe"),
                        rams: amountOfUnit("ram"),
                        catapults: amountOfUnit("catapult")
                    };
                    return unitsAvailable;
                });
            },
            getDataFromReport: function(contentValue) {
                var unfriendlyTroops = CatWave.unfriendlyTroops(contentValue);
                var buildingsInVillage = CatWave.buildingsInVillage(contentValue);

                /* save date only if any of unfriendlyTroops and buildingsInVillages is not false (thus determined) */
                var date = unfriendlyTroops || buildingsInVillage
                    ? $(contentValue).find("td.report_ReportAttack").parent().prev().children().eq(1).text().trim()
                    : undefined;

                return [date, unfriendlyTroops, buildingsInVillage];
            },
            cacheDataFromReport: function(targetCoords, dataFromReport) {
                var date = dataFromReport && dataFromReport[0];
                var unfriendlyTroops = dataFromReport && dataFromReport[1];
                var buildingsInVillage = dataFromReport && dataFromReport[2];

                CatWave.cache[targetCoords] = CatWave.cache[targetCoords] || {
                    reportDate: date,
                    unfriendlyTroops: unfriendlyTroops,
                    buildingsInVillage: buildingsInVillage
                };
            },
            unfriendlyTroops: function(contentValue) {
                var troopsInfo = $(contentValue).find("table[id^=\"attack_info_def_units\"] tr").slice(1);

                for(var i = 0; i < CatWave.GameData.units.length; i++) {
                    var unit = CatWave.GameData.units[i];
                    var before = parseInt(troopsInfo.eq(0).find("td.unit-item-" + unit).text());
                    var lost = parseInt(troopsInfo.eq(1).find("td.unit-item-" + unit).text());
                    var after = before - lost;
                    if(after) {
                        return true;
                    }
                }

                return false;
            },
            buildingsInVillage: function(contentValue) {
                var buildingsInfo = $(contentValue).find("table[id^=\"attack_spy_buildings_\"] tr:has(\"img\")");
                if(!buildingsInfo.length) {
                    return false;
                }

                var buildingsLevels = {};
                for(var i = 0; i < CatWave.GameData.buildings.length; i++) {
                    var building = CatWave.GameData.buildings[i];
                    buildingsLevels[building] = 0;
                }

                for(var i = 0; i < buildingsInfo.length; i++) {
                    var buildingName = buildingsInfo.eq(i).find("img").eq(0).prop("src").match(/(\w+)\.png$/)[1];
                    var buildingLevel = parseInt(buildingsInfo.eq(i).find("td").eq(1).text());
                    buildingsLevels[buildingName] = buildingLevel;
                }

                return buildingsLevels;
            },
            villagePoints: function(buildings) {
                var totalPoints = 0;

                if(buildings) {
                    var pointsTable = {
                        main:        10,
                        barracks:    16,
                        stable:      20,
                        garage:      24,
                        church:      10,
                        church_f:    10,
                        watchtower:  42,
                        snob:       512,
                        smith:       19,
                        place:        0,
                        statue:      24,
                        market:      10,
                        wood:         6,
                        stone:        6,
                        iron:         6,
                        farm:         5,
                        storage:      6,
                        hide:         5,
                        wall:         8
                    };

                    for(var i = 0; i < CatWave.GameData.buildings.length; i++) {
                        var building = CatWave.GameData.buildings[i];
                        var buildingLevel = buildings[building];
                        if(pointsTable[building] && buildingLevel) {
                            var points = pointsTable[building];
                            for(var j = 1; j < buildingLevel; j++)
                                points *= 1.2;
                            totalPoints += Math.round(points);
                        }
                    }
                }

                return totalPoints;
            },
            UI: {
                screenAMFarm: function() {
                    if(!($("#plunder_list").prop("class") && $("#plunder_list").prop("class").match(/catwave/))) {
                        UI.SuccessMessage("CatWave uruchomiony!");
                        $("#plunder_list").addClass("catwave");
                        var catapultImage = CatWave.graphicURL("unit", "catapult");
                        var ressourcesColumnID = $("table#plunder_list tr").eq(0).find("th").index($("table#plunder_list tr").eq(0).find("th").filter(function() {
                            var spanClass = $(this).find("span").eq(0).prop("class");
                            if(spanClass && spanClass.match(/ressources/)) {
                                return true;
                            }
                            return false;
                        }).eq(0));

                        var colspan = $("table#plunder_list tr").eq(0).find("th").eq(0).prop("rowspan");
                        $("<th/>").prop("rowspan", colspan).addClass("catwave_am_farm").html($("<img/>", {"src":catapultImage}))
                            .appendTo($("table#plunder_list tr:has(img[src$=\"place.png\"])").eq(0));

                        $("<td/>").addClass("catwave_am_farm")
                            .append($("<a/>").prop("href", "#").html($("<img/>", {"src":catapultImage})))
                            .appendTo($("table#plunder_list tr:has(img[src$=\"place.png\"])").slice(1)).find("a").click(function(event) {
                                event.preventDefault();
                                $(this).find("img").css({"border-style":"solid", "border-width":"1px", "border-color":"#007700"});
                                var tr = $(this).closest("tr");
                                var reportTD = tr.find("td:eq(3) > a");
                                var targetCoords = reportTD.text().match(/\d+\|\d+/)[0];
                                if(!CatWave.cache[targetCoords]) {
                                    var ressources = tr.find("td").eq(ressourcesColumnID);
                                    if(ressources.text().match(/\?/)) {
                                        CatWave.cacheDataFromReport(targetCoords);
                                        CatWave.UI.showABox(targetCoords);
                                    } else {
                                        var reportURL = reportTD.prop("href");
                                        CatWave.ajaxSimple(reportURL, "html")
                                            .then(function(ajaxResponse) {
                                                var contentValue = $($.parseHTML(ajaxResponse)).find("#content_value");
                                                var dataFromReport = CatWave.getDataFromReport(contentValue);
                                                CatWave.cacheDataFromReport(targetCoords, dataFromReport);
                                                CatWave.UI.showABox(targetCoords);
                                            });
                                    }
                                } else {
                                    CatWave.UI.showABox(targetCoords);
                                }
                            });
                    } else {
                        $(".catwave_am_farm").toggle();
                    }
                },
                screenInfoVillage: function() {
                    var targetCoords = $("td#content_value > table > tbody > tr > td > table > tbody > tr:eq(2) > td:eq(1)").text();

                    if(!CatWave.cache[targetCoords]) {
                        var rows = $("form#report_table tr:has(\"img[src$=\"spy.png\"]\")");
                        CatWave.asyncLoop(rows.length, function(loop, i) {
                            var reportURL = rows.find("a:first").eq(i).prop("href");
                            CatWave.ajaxSimple(reportURL, "html")
                                .then(function(ajaxResponse) {
                                    var contentValue = $($.parseHTML(ajaxResponse)).find("#content_value");
                                    var dataFromReport = CatWave.getDataFromReport(contentValue);
                                    if(dataFromReport[2]) {
                                        CatWave.cacheDataFromReport(targetCoords, dataFromReport);
                                        loop.break();
                                    } else {
                                        loop.go();
                                    }
                                });
                        }, function() {
                            if(CatWave.cache[targetCoords]) {
                                CatWave.UI.showABox(targetCoords);
                            } else {
                                CatWave.cacheDataFromReport(targetCoords);
                                CatWave.UI.showABox(targetCoords);
                            }
                        });
                    } else {
                        CatWave.UI.showABox(targetCoords);
                    }

                },
                screenReportView: function() {
                    var targetCoords = $("table#attack_info_def tr:eq(1) > td:eq(1) a:eq(0)").text().trim().match(/\((\d+\|\d+)\) K\d+$/)[1];
                    var contentValue = $("#content_value");
                    var dataFromReport = CatWave.getDataFromReport(contentValue);
                    CatWave.cacheDataFromReport(targetCoords, dataFromReport);
                    CatWave.UI.showABox(targetCoords);
                },
                showABox: function(targetCoords) {
                    $.when(CatWave.unitsAvailable())
                        .then(function(unitsAvailable) {
                            CatWave.UI.initializeABox(targetCoords, unitsAvailable);
                        });
                },
                initializeABox: function(targetCoords, unitsAvailable) {
                    var cellStyle = {
                        "text-align": "center",
                        "vertical-align": "middle"
                    };
                    var header = $("<h2/>").html("Cat<span style=\"color: #aaaaaa\">(apult)</span> Wave Script");
                    var buildingsDiv = $("<div/>", {"id":"catwave_buildings_box", "class":"vis",})
                        .css({"margin-bottom":"10px", "overflow":"auto"})
                        .append($("<table/>", {"id":"catwave_buildings", "class":"vis"})
                            .css({"width": "100%", "border-collapse":"separate", "border-spacing":"2px"})
                            .append($("<thead/>")
                                .append($("<tr/>")
                                    .append(function() {
                                        var cells = [];
                                        cells.push($("<th/>").text(CatWave.UI.getText("ui", 0)));
                                        CatWave.GameData.buildings.forEach(function(building) {
                                            var buildingName = CatWave.UI.getText("building", building);
                                            cells.push($("<th/>").css(cellStyle).addClass("catwave_building_button_" + building)
                                                .append($("<img/>", {"src":CatWave.graphicURL("building", building), "title":buildingName})));
                                        });
                                        return cells;
                                    })
                                )
                            )
                            .append($("<tbody/>")
                                .append($("<tr/>").addClass("row_a")
                                    .append(function() {
                                        var cells = [];
                                        cells.push($("<td/>").text(CatWave.UI.getText("ui", 1)));
                                        CatWave.GameData.buildings.forEach(function(building) {
                                            var cell = $("<td/>").css(cellStyle).addClass("catwave_building_button_" + building).addClass("catwave_building_level_" + building);
                                            cells.push(cell);
                                        });
                                        return cells;
                                    })
                                )
                                .append($("<tr/>").addClass("row_b")
                                    .append(function() {
                                        var cells = [];
                                        cells.push($("<td/>").text(CatWave.UI.getText("ui", 2)));
                                        CatWave.GameData.buildings.forEach(function(building) {
                                            var cell = $("<td/>").css(cellStyle).addClass("catwave_building_button_" + building).addClass("catwave_max_number_of_attacks_" + building);
                                            cells.push(cell);
                                        });
                                        return cells;
                                    })
                                )
                            )
                        )
                        .append($("<table/>").prop("id", "catwave_village_overview").css({"width":"100%"})
                            .append($("<tbody/>")
                                .append($("<tr/>")
                                    .append($("<td/>").text(CatWave.UI.getText("ui", 17) + ": ")
                                        .append($("<span/>").prop("id", "catwave_village_points").css({"font-weight":"bold"}))
                                    )
                                    .append($("<td/>").prop("id", "catwave_report_date").css({"float":"right"}))
                                )
                                .append($("<tr/>")
                                    .append($("<td/>").text(CatWave.UI.getText("ui", 20) + ": ")
                                        .append($("<span/>").prop("id", "catwave_village_points_current").css({"font-weight":"bold"}))
                                    )
                                    .append($("<td/>").prop("id", "catwave_unfriendly_troops").css({"float":"right", "color":"#ff0000"}).html("&nbsp;"))
                                )
                            )
                        );
                    var settingsDiv = $("<div/>").prop("id", "script-settings-box").addClass("vis")
                        .append($("<h4/>").text(CatWave.UI.getText("ui", 3)))
                        .append($("<div/>").css({"display":"inline-block", "background-color":"#f4e4bc","padding":"2px 2px 0px 2px", "width": "100%", "box-sizing": "border-box"})
                            .append($("<form/>").prop("id", "catwave_form")
                                /* CHOSEN BUILDING */
                                .append($("<p/>").css({"margin":"2px 3px 2px 3px", "text-align":"center"})
                                    .append($("<span/>").prop("id", "catwave_chosen_building").css({"font-weight":"bold"}))
                                )
                                /* INPUT */
                                .append($("<table/>")
                                    .append($("<tbody/>")
                                        .append($("<tr/>")
                                            /* minimum level */
                                            .append($("<td/>").prop("colspan", "4").text(CatWave.UI.getText("ui", 4) + ": ")
                                                .append($("<span/>").prop("id", "catwave_min_level").css({"font-weight":"bold"}))
                                            )
                                            /* maximum level */
                                            .append($("<td/>").text(CatWave.UI.getText("ui", 5) + ": ")
                                                .append($("<span/>").prop("id", "catwave_max_level").css({"font-weight":"bold"}))
                                            )
                                        )
                                    )
                                    .append($("<tbody/>")
                                        /* building level */
                                        .append($("<tr/>")
                                            .append($("<td/>").text(CatWave.UI.getText("ui", 1) + ":"))
                                            .append($("<td/>")
                                                .append($("<button/>", {"type":"button"}).prop("id", "catwave_building_level_minus").addClass("btn")
                                                    .css({"width":"23px", "height":"21px", "text-align":"center", "vertical-align":"middle"}).text("-"))
                                            )
                                            .append($("<td/>")
                                                .append($("<input/>", {"type":"number"}).prop("id", "catwave_building_level"))
                                            )
                                            .append($("<td/>")
                                                .append($("<button/>", {"type":"button"}).prop("id", "catwave_building_level_plus").addClass("btn")
                                                    .css({"width":"23px", "height":"21px", "text-align":"center", "vertical-align":"middle"}).text("+"))
                                            )
                                            .append($("<td/>").html("&nbsp;"))
                                        )
                                        /* number of levels to destroy */
                                        .append($("<tr/>")
                                            .append($("<td/>").text(CatWave.UI.getText("ui", 6) + ":"))
                                            .append($("<td/>")
                                                .append($("<button/>", {"type":"button"}).prop("id", "catwave_levels_to_destroy_minus").addClass("btn")
                                                    .css({"width":"23px", "height":"21px", "text-align":"center", "vertical-align":"middle"}).text("-"))
                                            )
                                            .append($("<td/>")
                                                .append($("<input/>", {"type":"number"}).prop("id", "catwave_levels_to_destroy"))
                                            )
                                            .append($("<td/>")
                                                .append($("<button/>", {"type":"button"}).prop("id", "catwave_levels_to_destroy_plus").addClass("btn")
                                                    .css({"width":"23px", "height":"21px", "text-align":"center", "vertical-align":"middle"}).text("+"))
                                            )
                                            .append($("<td/>").text(CatWave.UI.getText("ui", 7) + ": ")
                                                .append($("<span/>").css({"font-weight":"bold"}).prop("id", "catwave_max_levels_to_destroy"))
                                            )
                                        )
                                        /* number of attacks */
                                        .append($("<tr/>")
                                            .append($("<td/>").text(CatWave.UI.getText("ui", 8) + ":"))
                                            .append($("<td/>")
                                                .append($("<button/>", {"type":"button"}).prop("id", "catwave_num_of_attacks_minus").addClass("btn")
                                                    .css({"width":"23px", "height":"21px", "text-align":"center", "vertical-align":"middle"}).text("-"))
                                            )
                                            .append($("<td/>")
                                                .append($("<input/>", {"type":"number"}).prop("id", "catwave_num_of_attacks"))
                                            )
                                            .append($("<td/>")
                                                .append($("<button/>", {"type":"button"}).prop("id", "catwave_num_of_attacks_plus").addClass("btn")
                                                    .css({"width":"23px", "height":"21px", "text-align":"center", "vertical-align":"middle"}).text("+"))
                                            )
                                            .append($("<td/>").text(CatWave.UI.getText("ui", 9) + ": ")
                                                .append($("<span/>").css({"font-weight":"bold"}).prop("id", "catwave_min_num_of_attacks"))
                                            )
                                        )
                                    )
                                    .append($("<tbody/>")
                                        /* wall demolition */
                                        .append($("<tr/>")
                                            .append($("<td/>")
                                                .append(CatWave.UI.getText("ui", 10) + ":")
                                                .append($("<input/>", {"type": "checkbox"}).css({"float":"right"}).prop("id", "catwave_wall_level_checkbox"))
                                            )
                                            .append($("<td/>")
                                                .append($("<button/>", {"type":"button"}).prop("id", "catwave_wall_level_minus").addClass("btn")
                                                    .css({"width":"23px", "height":"21px", "text-align":"center", "vertical-align":"middle"}).text("-"))
                                            )
                                            .append($("<td/>")
                                                .append($("<input/>", {
                                                    "type": "number",
                                                    "min": CatWave.GameData.buildingsInfo["wall"]["minLevel"],
                                                    "max": CatWave.GameData.buildingsInfo["wall"]["maxLevel"]
                                                }).prop("id", "catwave_wall_level"))
                                            )
                                            .append($("<td/>")
                                                .append($("<button/>", {"type":"button"}).prop("id", "catwave_wall_level_plus").addClass("btn")
                                                    .css({"width":"23px", "height":"21px", "text-align":"center", "vertical-align":"middle"}).text("+"))
                                            )
                                            .append($("<td/>").html("&nbsp;"))
                                        )
                                    )
                                )
                                .append($("<hr/>"))
                                .append($("<table/>")
                                    .append($("<tbody/>")
                                        .append(function () {
                                            var rows = [];
                                            [{type: "available", messageID: 11}, {type: "used", messageID: 12}, {type: "remaining", messageID: 13}].forEach(function (element) {
                                                var row = $("<tr/>").append($("<td/>").text(CatWave.UI.getText("ui", element.messageID) + ":"));
                                                ["axe", "ram", "catapult"].forEach(function (unit) {
                                                    row.append($("<td/>").css({"text-align":"right"})
                                                        .append($("<span/>").prop("id", "catwave_" + element.type + "_" + unit + "s").css({"font-weight":"bold"}))
                                                        .append($("<img/>").prop("src", CatWave.graphicURL("unit", unit)).css({"margin-left":"5px", "width":"14px", "height":"14px"}))
                                                    );
                                                });
                                                row.append($("<td/>").html("&nbsp;"));
                                                rows.push(row);
                                            });
                                            rows[0].find("td").last().html($("<button/>", {"type":"button"}).prop("id", "catwave_refresh_units_available").addClass("btn").css({"margin":"0px 0px 0px 10px"}).text(CatWave.UI.getText("ui", 14)));
                                            return rows;
                                        })
                                    )
                                )
                                .append($("<hr/>"))
                                .append($("<div/>").css({"text-align":"center"})
                                    .append($("<button/>", {"type":"button"}).prop("id", "catwave_open_tabs").addClass("btn").css({"margin":"0px 5px 6px 5px"})
                                        .append(CatWave.UI.getText("ui", 15) + " (")
                                        .append($("<span/>").prop("id", "catwave_opened_tabs"))
                                        .append(")")
                                    )
                                    .append($("<button/>", {"type":"button"}).prop("id", "catwave_reset_opened_tabs").addClass("btn").css({"margin":"0px 5px 6px 5px"}).text(CatWave.UI.getText("ui", 16)))
                                )
                            )
                        );
                    var footer = "<span class=\"grey small\" style=\"float: right\"><b>by AKZ123 (aka. AkaZecik)</b></span>";

                    var scriptBox = header.add(buildingsDiv).add(settingsDiv).add(footer);

                    Dialog.show("catwave", scriptBox);
                    $("div#popup_box_catwave").css({"width":"700px"});
                    $("div#popup_box_catwave .popup_box_content").css({"min-width":"700px"});
                    $("#catwave_form input[type=number]").css({"width":"100%"});

                    CatWave.UI.buildABox(targetCoords, unitsAvailable);
                },
                buildABox: function(targetCoords, unitsAvailable) {
                    $("#catwave_buildings").css({"cursor":"default"});

                    var owner = CatWave.GameData.villages[targetCoords] && CatWave.GameData.villages[targetCoords].owner;
                    var buildingsInVillage = CatWave.cache[targetCoords] && CatWave.cache[targetCoords].buildingsInVillage;
                    var villagePoints = CatWave.villagePoints(buildingsInVillage);
                    var villagePointsCurrent = CatWave.GameData.villages[targetCoords].points;
                    var reportDate = CatWave.cache[targetCoords] && CatWave.cache[targetCoords].reportDate;
                    var unfriendlyTroops = CatWave.cache[targetCoords] && CatWave.cache[targetCoords].unfriendlyTroops;

                    CatWave.UI.fillInBuildingsLevels(buildingsInVillage);
                    CatWave.UI.fillInMaxNumOfLevelsDestroyed(buildingsInVillage, unitsAvailable.catapults);
                    $("#catwave_village_points").text(villagePoints);
                    $("#catwave_village_points_current").text(villagePointsCurrent);
                    if(owner == 0) {
                        if(villagePoints > CatWave.GameData.barbarianMaxPoints) {
                            $("#catwave_village_points").css({"color":"#007700"});
                        }
                        if(villagePointsCurrent > CatWave.GameData.barbarianMaxPoints) {
                            $("#catwave_village_points_current").css({"color":"#007700"});
                        }
                    }
                    $("#catwave_report_date").append($("<span/>").css({"float":"right"})
                        .text(CatWave.UI.getText("ui", 19) + ": ")
                        .append($("<span/>").css({"font-style":"italic"}).text(reportDate)));
                    if(unfriendlyTroops) {
                        $("#catwave_unfriendly_troops").text(CatWave.UI.getText("ui", 18));
                    }

                    for(var i = 0; i < CatWave.GameData.buildingsNotImmune.length; i++) {
                        var building = CatWave.GameData.buildingsNotImmune[i];

                        $(".catwave_building_button_" + building).hover(
                            function() {
                                var buttonClass = "." + $(this).prop("class").match(/(catwave_building_button_[a-zA-Z]+)/)[1];
                                $(buttonClass).css({"background-color":"#ffffff"});
                            },
                            function() {
                                var buttonClass = "." + $(this).prop("class").match(/(catwave_building_button_[a-zA-Z]+)/)[1];
                                $(buttonClass).removeAttr("style");
                                $(buttonClass).css({
                                    "text-align": "center",
                                    "vertical-align": "middle",
                                    "cursor": "default"
                                });
                            });

                        $(".catwave_building_button_" + building).click(function() {
                            var building = $(this).prop("class").match(/catwave_building_button_([a-zA-Z]+)/)[1];
                            var wallChecked = $("#catwave_wall_level_checkbox").prop("checked");
                            var wallLevel = parseInt($("#catwave_wall_level").val());
                            CatWave.UI.pasteInput(targetCoords, building, undefined, wallChecked, wallLevel, unitsAvailable);
                        });
                    }

                    if(CatWave.config.destroyWall) {
                        $("#catwave_wall_level_checkbox").prop("checked", true);
                        $("#catwave_wall_level_minus").removeProp("disabled");
                        $("#catwave_wall_level_plus").removeProp("disabled");
                        $("#catwave_wall_level").removeProp("disabled");
                    } else {
                        $("#catwave_wall_level_checkbox").prop("checked", false);
                        $("#catwave_wall_level_minus").prop("disabled", "disabled");
                        $("#catwave_wall_level_plus").prop("disabled", "disabled");
                        $("#catwave_wall_level").prop("disabled", "disabled");
                    }

                    /* EVENTS BINDING */
                    /* form */
                    $("#catwave_form").submit(function(event) {
                        event.preventDefault();
                    });
                    /* building level input and buttons */
                    $("#catwave_building_level").change(function() {
                        var building = $("#catwave_chosen_building").prop("class").match(/catwave_chosen_building_([a-zA-Z]+)/)[1];
                        var buildingLevel = parseInt($(this).val());
                        var buildingMinLevel = CatWave.GameData.buildingsInfo[building]["minLevel"];
                        var buildingMaxLevel = CatWave.GameData.buildingsInfo[building]["maxLevel"];
                        if(buildingLevel < buildingMinLevel) {
                            buildingLevel = buildingMinLevel;
                            $(this).val(buildingMinLevel);
                        }
                        if(buildingLevel > buildingMaxLevel) {
                            buildingLevel = buildingMaxLevel;
                            $(this).val(buildingMaxLevel)
                        }

                        var wallChecked = $("#catwave_wall_level_checkbox").prop("checked");
                        var wallLevel = parseInt($("#catwave_wall_level").val());
                        CatWave.UI.pasteInput(targetCoords, building, buildingLevel, wallChecked, wallLevel, unitsAvailable);
                    });
                    $("#catwave_building_level_minus").click(function() {
                        var input = $("#catwave_building_level");
                        input.val(parseInt(input.val()) - 1);
                        input.trigger("change");
                    });
                    $("#catwave_building_level_plus").click(function() {
                        var input = $("#catwave_building_level");
                        input.val(parseInt(input.val()) + 1);
                        input.trigger("change");
                    });
                    /* levels to destroy input and buttons */
                    $("#catwave_levels_to_destroy").change(function() {
                        var building = $("#catwave_chosen_building").prop("class").match(/catwave_chosen_building_([a-zA-Z]+)/)[1];
                        var buildingLevel = parseInt($("#catwave_building_level").val());
                        var buildingMinLevel = CatWave.GameData.buildingsInfo[building]["minLevel"];
                        var maxNumOfLevelsDestroyed = CatWave.maxNumOfLevelsDestroyed(buildingLevel, buildingMinLevel, unitsAvailable.catapults);
                        var levelsToDestroy = parseInt($(this).val());
                        if(levelsToDestroy < 1) {
                            levelsToDestroy = 1;
                            $(this).val(1);
                        }
                        if(levelsToDestroy > maxNumOfLevelsDestroyed) {
                            levelsToDestroy = maxNumOfLevelsDestroyed;
                            $(this).val(maxNumOfLevelsDestroyed);
                        }

                        var numberOfAttacks = parseInt($("#catwave_num_of_attacks").val());
                        var minNumOfAttacks = CatWave.minNumOfAttacks(buildingLevel, levelsToDestroy, unitsAvailable.catapults);
                        if(numberOfAttacks > levelsToDestroy) {
                            numberOfAttacks = levelsToDestroy;
                            $("#catwave_num_of_attacks").val(levelsToDestroy)
                        }
                        if(numberOfAttacks < minNumOfAttacks) {
                            numberOfAttacks = minNumOfAttacks;
                            $("#catwave_num_of_attacks").val(minNumOfAttacks);
                        }
                        $("#catwave_num_of_attacks")
                            .prop("min", minNumOfAttacks)
                            .prop("max", levelsToDestroy);
                        $("#catwave_min_num_of_attacks").text(minNumOfAttacks);

                        var catsUsed = CatWave.catsUsed(buildingLevel, numberOfAttacks, levelsToDestroy);
                        $("#catwave_used_catapults").text(catsUsed);
                        var catsRemaining = unitsAvailable.catapults - catsUsed;
                        $("#catwave_remaining_catapults").text(catsRemaining);
                        
                        CatWave.UI.bindClickToOpenTabsButton(targetCoords);
                    });
                    $("#catwave_levels_to_destroy_minus").click(function() {
                        var input = $("#catwave_levels_to_destroy");
                        input.val(parseInt(input.val()) - 1);
                        input.trigger("change");
                    });
                    $("#catwave_levels_to_destroy_plus").click(function() {
                        var input = $("#catwave_levels_to_destroy");
                        input.val(parseInt(input.val()) + 1);
                        input.trigger("change");
                    });
                    /* number of attacks input and buttons */
                    $("#catwave_num_of_attacks").change(function() {
                        var buildingLevel = parseInt($("#catwave_building_level").val());
                        var levelsToDestroy = parseInt($("#catwave_levels_to_destroy").val());
                        var numberOfAttacks = parseInt($(this).val());
                        var minNumOfAttacks = CatWave.minNumOfAttacks(buildingLevel, levelsToDestroy, unitsAvailable.catapults);
                        if(numberOfAttacks > levelsToDestroy) {
                            numberOfAttacks = levelsToDestroy;
                            $(this).val(levelsToDestroy);
                        }
                        if(numberOfAttacks < minNumOfAttacks) {
                            numberOfAttacks = minNumOfAttacks;
                            $(this).val(minNumOfAttacks);
                        }

                        var catsUsed = CatWave.catsUsed(buildingLevel, numberOfAttacks, levelsToDestroy);
                        $("#catwave_used_catapults").text(catsUsed);
                        var catsRemaining = unitsAvailable.catapults - catsUsed;
                        $("#catwave_remaining_catapults").text(catsRemaining);

                        CatWave.UI.bindClickToOpenTabsButton(targetCoords);
                    });
                    $("#catwave_num_of_attacks_minus").click(function() {
                        var input = $("#catwave_num_of_attacks");
                        input.val(parseInt(input.val()) - 1);
                        input.trigger("change");
                    });
                    $("#catwave_num_of_attacks_plus").click(function() {
                        var input = $("#catwave_num_of_attacks");
                        input.val(parseInt(input.val()) + 1);
                        input.trigger("change");
                    });
                    /* wall level checkbox, input and buttons */
                    $("#catwave_wall_level_checkbox").change(function() {
                        var checked = $(this).prop("checked");
                        if(checked) {
                            $("#catwave_wall_level_minus").removeProp("disabled");
                            $("#catwave_wall_level_plus").removeProp("disabled");
                            $("#catwave_wall_level").removeProp("disabled");

                            var wallLevel = parseInt($("#catwave_wall_level").val());
                            var axesUsed = wallLevel > 0 ? CatWave.ramTemplates[wallLevel].axes : 0;
                            var ramsUsed = wallLevel > 0 ? CatWave.ramTemplates[wallLevel].rams : 0;
                            var axesRemaining = unitsAvailable.axes - axesUsed;
                            var ramsRemaining = unitsAvailable.rams - ramsUsed;
                            $("#catwave_used_axes").text(axesUsed);
                            $("#catwave_used_rams").text(ramsUsed);
                            $("#catwave_remaining_axes").text(axesRemaining);
                            $("#catwave_remaining_rams").text(ramsRemaining);
                        } else {
                            $("#catwave_wall_level_minus").prop("disabled", "disabled");
                            $("#catwave_wall_level_plus").prop("disabled", "disabled");
                            $("#catwave_wall_level").prop("disabled", "disabled");

                            $("#catwave_used_axes").text(0);
                            $("#catwave_used_rams").text(0);
                            $("#catwave_remaining_axes").text(unitsAvailable.axes);
                            $("#catwave_remaining_rams").text(unitsAvailable.rams);
                        }
                        CatWave.UI.bindClickToOpenTabsButton(targetCoords);
                    });
                    $("#catwave_wall_level").change(function() {
                        var wallChecked = $("#catwave_wall_level_checkbox").prop("checked");
                        var wallLevel = parseInt($(this).val());
                        var wallMinLevel = CatWave.GameData.buildingsInfo["wall"]["minLevel"];
                        var wallMaxLevel = CatWave.GameData.buildingsInfo["wall"]["maxLevel"];
                        if(wallLevel > wallMaxLevel) {
                            wallLevel = wallMaxLevel;
                            $(this).val(wallMaxLevel);
                        }
                        if(wallLevel < wallMinLevel) {
                            wallLevel = wallMinLevel;
                            $(this).val(wallMinLevel);
                        }

                        var axesUsed = (wallChecked && wallLevel > 0) ? CatWave.ramTemplates[wallLevel].axes : 0;
                        var ramsUsed = (wallChecked && wallLevel > 0) ? CatWave.ramTemplates[wallLevel].rams : 0;
                        var axesRemaining = unitsAvailable.axes - axesUsed;
                        var ramsRemaining = unitsAvailable.rams - ramsUsed;
                        $("#catwave_used_axes").text(axesUsed);
                        $("#catwave_used_rams").text(ramsUsed);
                        $("#catwave_remaining_axes").text(axesRemaining);
                        $("#catwave_remaining_rams").text(ramsRemaining);

                        CatWave.UI.bindClickToOpenTabsButton(targetCoords);
                    });
                    $("#catwave_wall_level_minus").click(function() {
                        var input = $("#catwave_wall_level");
                        input.val(parseInt(input.val()) - 1);
                        input.trigger("change");
                    });
                    $("#catwave_wall_level_plus").click(function() {
                        var input = $("#catwave_wall_level");
                        input.val(parseInt(input.val()) + 1);
                        input.trigger("change");
                    });
                    /* catapults refresh button */
                    $("#catwave_refresh_units_available").click(function() {
                        CatWave.unitsAvailable().then(function(value) {
                            unitsAvailable = value;
                            var wallChecked = $("#catwave_wall_level_checkbox").prop("checked");
                            var wallLevel = parseInt($("#catwave_wall_level").val());
                            var axesUsed = (wallChecked && wallLevel > 0) ? CatWave.ramTemplates[wallLevel].axes : 0;
                            var ramsUsed = (wallChecked && wallLevel > 0) ? CatWave.ramTemplates[wallLevel].rams : 0;
                            var axesRemaining = unitsAvailable.axes - axesUsed;
                            var ramsRemaining = unitsAvailable.rams - ramsUsed;

                            ["axes", "rams", "catapults"].forEach(function (units) {
                                $("#catwave_available_" + units).text(unitsAvailable[units]);
                            });
                            $("#catwave_used_axes").text(axesUsed);
                            $("#catwave_used_rams").text(ramsUsed);
                            $("#catwave_remaining_axes").text(axesRemaining);
                            $("#catwave_remaining_rams").text(ramsRemaining);

                            CatWave.UI.fillInMaxNumOfLevelsDestroyed(buildingsInVillage, unitsAvailable.catapults);
                            $("#catwave_levels_to_destroy").trigger("change");
                        });
                    });
                    /* opened tabs reset button */
                    $("#catwave_reset_opened_tabs").click(function() {
                        CatWave.UI.bindClickToOpenTabsButton(targetCoords);
                    });

                    CatWave.UI.pasteInput(targetCoords, CatWave.config.defaultBuilding, undefined, CatWave.config.destroyWall, undefined, unitsAvailable);
                },
                fillInBuildingsLevels: function(buildingsInVillage) {
                    for(var i = 0; i < CatWave.GameData.buildings.length; i++) {
                        var building = CatWave.GameData.buildings[i];
                        if(buildingsInVillage) {
                            var buildingLevel = buildingsInVillage[building];

                            if(buildingLevel == 0) {
                                $(".catwave_building_level_" + building).addClass("hidden").text(buildingLevel);
                            } else {
                                $(".catwave_building_level_" + building).html($("<b/>").text(buildingLevel));
                            }
                        } else {
                            $(".catwave_building_level_" + building).text("?");
                            $(".catwave_max_number_of_attacks_" + building).text("?");
                        }
                    }
                },
                fillInMaxNumOfLevelsDestroyed: function(buildingsInVillage, catsAvailable) {
                    for(var i = 0; i < CatWave.GameData.buildings.length; i++) {
                        var building = CatWave.GameData.buildings[i];
                        if(buildingsInVillage) {
                            var buildingLevel = buildingsInVillage[building];
                            var buildingMinLevel = CatWave.GameData.buildingsInfo[building]["minLevel"];
                            var maxNumOfLevelsDestroyed = CatWave.GameData.buildingsImmune.indexOf(building) == -1
                                ? CatWave.maxNumOfLevelsDestroyed(buildingLevel, buildingMinLevel, catsAvailable)
                                : 0;
                            
                            $(".catwave_max_number_of_attacks_" + building).text(maxNumOfLevelsDestroyed);
                            if(maxNumOfLevelsDestroyed == 0) {
                                $(".catwave_max_number_of_attacks_" + building).addClass("hidden");
                            }
                        } else {
                            $(".catwave_building_level_" + building).text("?");
                            $(".catwave_max_number_of_attacks_" + building).text("?");
                        }
                    }
                },
                pasteInput: function(targetCoords, building, buildingLevel, wallChecked, wallLevel, unitsAvailable) {
                    var buildingName = CatWave.UI.getText("building", building);
                    var buildingMinLevel = CatWave.GameData.buildingsInfo[building]["minLevel"];
                    var buildingMaxLevel = CatWave.GameData.buildingsInfo[building]["maxLevel"];
                    if(buildingLevel) {
                        if(buildingLevel < buildingMinLevel) {
                            buildingLevel = buildingMinLevel;
                        }
                        if(buildingLevel > buildingMaxLevel) {
                            buildingLevel = buildingMaxLevel;
                        }
                    }
                    buildingLevel = buildingLevel
                        || CatWave.cache[targetCoords] && CatWave.cache[targetCoords].buildingsInVillage && CatWave.cache[targetCoords].buildingsInVillage[building]
                        || buildingMinLevel;
                    var maxNumOfLevelsDestroyed = CatWave.maxNumOfLevelsDestroyed(buildingLevel, buildingMinLevel, unitsAvailable.catapults);
                    var minNumOfAttacks = CatWave.minNumOfAttacks(buildingLevel, maxNumOfLevelsDestroyed, unitsAvailable.catapults);
                    var maxWallLevel = CatWave.GameData.buildingsInfo["wall"]["maxLevel"];
                    var wallLevel = wallLevel || (CatWave.cache[targetCoords] && CatWave.cache[targetCoords].buildingsInVillage
                        ? CatWave.cache[targetCoords].buildingsInVillage["wall"]
                        : 0);
                    wallLevel += CatWave.config.increaseWallLevelBy;
                    if(wallLevel > maxWallLevel) {
                        wallLevel = maxWallLevel;
                    }
                    var unitsUsed = {
                        axes: (wallChecked && wallLevel > 0) ? CatWave.ramTemplates[wallLevel].axes : 0,
                        rams: (wallChecked && wallLevel > 0) ? CatWave.ramTemplates[wallLevel].rams : 0,
                        catapults: CatWave.catsUsed(buildingLevel, maxNumOfLevelsDestroyed, maxNumOfLevelsDestroyed)
                    };
                    var unitsRemaining = {
                        axes: unitsAvailable.axes - unitsUsed.axes,
                        rams: unitsAvailable.rams - unitsUsed.rams,
                        catapults: unitsAvailable.catapults - unitsUsed.catapults
                    };

                    $("#catwave_chosen_building").prop("class", "catwave_chosen_building_" + building).text(buildingName.toUpperCase());
                    $("#catwave_min_level").text(buildingMinLevel);
                    $("#catwave_max_level").text(buildingMaxLevel);
                    $("#catwave_building_level")
                        .prop("min", buildingMinLevel)
                        .prop("max", buildingMaxLevel)
                        .val(buildingLevel);
                    $("#catwave_levels_to_destroy")
                        .prop("min", maxNumOfLevelsDestroyed ? 1 : 0)
                        .prop("max", maxNumOfLevelsDestroyed)
                        .val(maxNumOfLevelsDestroyed);
                    $("#catwave_max_levels_to_destroy").text(maxNumOfLevelsDestroyed);
                    $("#catwave_num_of_attacks")
                        .prop("min", minNumOfAttacks)
                        .prop("max", maxNumOfLevelsDestroyed)
                        .val(maxNumOfLevelsDestroyed);
                    $("#catwave_min_num_of_attacks").text(minNumOfAttacks);
                    $("#catwave_wall_level")
                        .val(wallLevel);
                    ["axes", "rams", "catapults"].forEach(function (units) {
                        $("#catwave_available_" + units).text(unitsAvailable[units]);
                        $("#catwave_used_" + units).text(unitsUsed[units]);
                        $("#catwave_remaining_" + units).text(unitsRemaining[units]);
                    });

                    CatWave.UI.bindClickToOpenTabsButton(targetCoords);
                },
                bindClickToOpenTabsButton: function(targetCoords) {
                    /* unbind old click events */
                    $("#catwave_open_tabs").off("click");

                    /* read input */
                    var building = $("#catwave_chosen_building").prop("class").match(/catwave_chosen_building_([a-zA-Z]+)/)[1];
                    var buildingLevel = parseInt($("#catwave_building_level").val());
                    var buildingMinLevel = CatWave.GameData.buildingsInfo[building]["minLevel"];
                    var levelsToDestroy = parseInt($("#catwave_levels_to_destroy").val());
                    var numberOfAttacks = parseInt($("#catwave_num_of_attacks").val());
                    var wallChecked = $("#catwave_wall_level_checkbox")[0].checked;
                    var wallLevel = wallChecked
                        ? parseInt($("#catwave_wall_level").val())
                        : undefined;

                    /* validate input */
                    if(1 <= numberOfAttacks && numberOfAttacks <= levelsToDestroy && levelsToDestroy <= buildingLevel - buildingMinLevel) {
                        var catLinks = CatWave.UI.catLinks(targetCoords, buildingLevel, numberOfAttacks, levelsToDestroy, wallLevel);
                        var counterText = "0/" + numberOfAttacks + (wallLevel ? "+1" : "");
                        $("#catwave_opened_tabs").text(counterText);
                        
                        var i = 0;
                        $("#catwave_open_tabs").click(function(event) {
                            if(i < catLinks.length) {
                                window.open(catLinks[i], "_blank");
                                i++;
                                counterText = i + "/" + numberOfAttacks + (wallLevel ? "+1" : "");
                                $("#catwave_opened_tabs").text(counterText);
                            }
                        });
                    } else {
                        $("#catwave_opened_tabs").text("0/0");
                    }
                },
                catLinks: function(targetCoords, buildingLevel, numberOfAttacks, levelsToDestroy, wallLevel) {
                    var x = targetCoords.match(/(\d+)\|\d+/)[1];
                    var y = targetCoords.match(/\d+\|(\d+)/)[1];
                    var catLinksList = [];
                    var catLinkBase = CatWave.GameData.hostname + game_data.link_base_pure + "place&from=simulator&x=" + x + "&y=" + y;
                    if(wallLevel) {
                        var axes = CatWave.ramTemplates[wallLevel].axes;
                        var rams = CatWave.ramTemplates[wallLevel].rams;
                        catLinksList.push(catLinkBase + "&att_axe=" + axes + "&att_ram=" + rams);
                    }

                    var catsNeeded;
                    var catLink;
                    catLinkBase += "&att_catapult=";
                    for(var i = numberOfAttacks; i > 1; i--) {
                        catsNeeded = CatWave.catsNeeded(buildingLevel - numberOfAttacks + i, 1);
                        catLink = catLinkBase + catsNeeded;
                        catLinksList.push(catLink);
                    }

                    catsNeeded = CatWave.catsNeeded(buildingLevel - numberOfAttacks + 1, levelsToDestroy - numberOfAttacks + 1, 1);
                    catLink = catLinkBase + catsNeeded + "&att_spy=1";
                    catLinksList.push(catLink);

                    return catLinksList;
                },
                getText: function(type, id) {
                    var lang = CatWave.config.lang;

                    return typeof CatWave.locales[lang] == "object"
                        && typeof CatWave.locales[lang][type] == "object"
                        && typeof CatWave.locales[lang][type][id] == "string"
                        ? CatWave.locales[lang][type][id]
                        : "ERR_NO_MESSAGE";
                }
            },
            ajaxSimple: function(url, dtType, callback) {
                return $.ajax({
                    url: url,
                    type: "GET",
                    dataType: dtType,
                    success: function(data) {
                        if(typeof callback == "function") {
                            callback(data);
                        }
                    }
                });
            },
            asyncLoop: function(iterations, func, callback) {
                var i = -1;

                var loop = {
                    go: function() {
                        if(i+1 < iterations) {
                            i++;
                            func(loop, i);
                        } else {
                            loop.break();
                        } 
                    },
                    break: function() {
                        callback();
                    }
                };

                loop.go();
            },
            graphicURL: function(type, name) {
                var urlBase = "https://dspl.innogamescdn.com/" + game_data.version.split(" ")[1] + "/" + game_data.version.split(" ")[0] + "/graphic";
                switch(type) {
                    case "building": return urlBase + "/buildings/" + name + ".png";
                    case "unit": return urlBase + "/unit/unit_" + name + ".png";
                }
            }
        };

        CatWave.ramTemplates = {
             1: {axes: 15, rams:  2},
             2: {axes: 15, rams:  4},
             3: {axes: 43, rams:  7},
             4: {axes: 75, rams: 10},
             5: {axes:118, rams: 14},
             6: {axes:117, rams: 19},
             7: {axes:149, rams: 24},
             8: {axes:176, rams: 31},
             9: {axes:114, rams: 38},
            10: {axes:129, rams: 46},
            11: {axes:169, rams: 56},
            12: {axes:188, rams: 66},
            13: {axes:166, rams: 78},
            14: {axes:185, rams: 92},
            15: {axes:224, rams:107},
            16: {axes:249, rams:125},
            17: {axes:237, rams:145},
            18: {axes:219, rams:168},
            19: {axes:259, rams:193},
            20: {axes:284, rams:222}
        };

        CatWave.locales = {
            en: {
                building: {
                    main:       "Headquarters",
                    barracks:   "Barracks",
                    stable:     "Stable",
                    garage:     "Workshop",
                    church:     "Church",
                    church_f:   "First church",
                    watchtower: "Watchtower",
                    snob:       "Academy",
                    smith:      "Smith",
                    place:      "Place",
                    statue:     "Statue",
                    market:     "Market",
                    wood:       "Timber camp",
                    stone:      "Clay pit",
                    iron:       "Iron mine",
                    farm:       "Farm",
                    storage:    "Warehouse",
                    hide:       "Hiding place",
                    wall:       "Wall"
                },
                ui: {
                    0: "Building",
                    1: "Building level",
                    2: "Can destroy",
                    3: "Attack settings",
                    4: "Minimum level of a building",
                    5: "Maximum level of a building",
                    6: "Number of levels to destroy",
                    7: "Can destroy at most",
                    8: "Number of attacks",
                    9: "Minimum number of attacks",
                    10: "Destroy a wall",
                    11: "Available units",
                    12: "Units that will be used",
                    13: "Units that won't be used",
                    14: "Refresh",
                    15: "Open tabs",
                    16: "Reset the counter",
                    17: "Village points (from a table)",
                    18: "WARNING! UNFRIENDLY TROOPS WERE DETECTED!",
                    19: "Date",
                    20: "Village points (from a database)"
                },
                message: {
                    0: "Run a script from a correct screen!<br/>(loot assistant, village overview, report)",
                    1: "CatWave started!"
                }
            },
            pl: {
                building: {
                    main:       "Ratusz",
                    barracks:   "Koszary",
                    stable:     "Stajnia",
                    garage:     "Warsztat",
                    church:     "Kościół",
                    church_f:   "Pierwszy kościół",
                    watchtower: "Wieża strażnicza",
                    snob:       "Pałac",
                    smith:      "Kuźnia",
                    place:      "Plac",
                    statue:     "Pediestał",
                    market:     "Rynek",
                    wood:       "Tartak",
                    stone:      "Cegielnia",
                    iron:       "Huta żelaza",
                    farm:       "Zagroda",
                    storage:    "Spichlerz",
                    hide:       "Schowek",
                    wall:       "Mur"
                },
                ui: {
                    0: "Budynek",
                    1: "Poziom budynku",
                    2: "Można zburzyc",
                    3: "Ustawienia ataku",
                    4: "Minimalny poziom budynku",
                    5: "Maksymalny poziom budynku",
                    6: "Liczba poziomów do zburzenia",
                    7: "Maksymalnie można zburzyć",
                    8: "Liczba ataków",
                    9: "Minimalna liczba ataków",
                    10: "Zburz mur",
                    11: "Dostępne jednostki",
                    12: "Jednostki, którze zostaną użyte",
                    13: "Jednostki, które nie zostaną użyte",
                    14: "Odśwież",
                    15: "Otwórz zakładki",
                    16: "Resetuj licznik",
                    17: "Punkty wioski (z tabelki)",
                    18: "UWAGA! WYKRYTO WROGIE JEDNOSTKI!",
                    19: "Data",
                    20: "Punkty wioski (z bazy danych)"
                },
                message: {
                    0: "Uruchom skrypt z odpowiedniego ekranu!<br/>(asystent farmera, opis wioski, raport)",
                    1: "CatWave uruchomiony!"
                }
            }
        };

        CatWave.init();
    }

    CatWave.run();
}

void(0);
