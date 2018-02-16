if(!Object.extend) {
    Object.extend = function () {
        var object = Object.create(this);
        var length = arguments.length;
        var index = length;

        while (index) {
            var extension = arguments[length - (index--)];

            for (var property in extension)
                if (Object.hasOwnProperty.call(extension, property) || "undefined" == typeof object[property]) {
                        object[property] = extension[property];
                }
        }

        return object;
    };
}

if(game_data.device == "desktop") {
    if("undefined" == typeof scriptHasRun) {
        scriptHasRun = false;
    }

    if(!scriptHasRun) {
        var Calculators = {
            GameData: {
                hostname: "https://" + window.location.hostname,
                config: {},
                unitInfo: {
                    order: []
                },
                buildingInfo: {
                    order: []
                },
                fetch: function () {
                    return $.when(
                        $.ajax({
                            url: Calculators.GameData.hostname + "/interface.php?func=get_config",
                            type: "GET",
                            dataType: "xml"
                        }),
                        $.ajax({
                            url: Calculators.GameData.hostname + "/interface.php?func=get_unit_info",
                            type: "GET",
                            dataType: "xml",
                        }),
                        $.ajax({
                            url: Calculators.GameData.hostname + "/interface.php?func=get_building_info",
                            type: "GET",
                            dataType: "xml"
                        })
                    ).then(function () {
                        var config = arguments[0][0];
                        var unitInfo = arguments[1][0];
                        var buildingInfo = arguments[2][0];

                        Calculators.GameData.config.speed = parseInt($(config).find("config > speed").text());

                        $(unitInfo).find("config").children().toArray().forEach(function (unitTag) {
                            var unitName = $(unitTag).prop("tagName");
                            var buildTime = parseInt($(unitTag).find("build_time").text());
                            var resources = {
                                wood: parseInt($(unitTag).find("wood").text()),
                                stone: parseInt($(unitTag).find("stone").text()),
                                iron: parseInt($(unitTag).find("iron").text())
                            };
                            var speed = parseFloat($(unitTag).find("speed").text());
                            var attack = parseInt($(unitTag).find("attack").text());
                            var defense = {
                                infantry: parseInt($(unitTag).find("defense").text()),
                                cavalry: parseInt($(unitTag).find("defense_cavalry").text()),
                                archer: parseInt($(unitTag).find("defense_archer").text())
                            };
                            var carry = parseInt($(unitTag).find("carry").text());

                            Calculators.GameData.unitInfo.order.push(unitName);
                            Calculators.GameData.unitInfo[unitName] = {
                                buildTime: buildTime,
                                resources: resources,
                                speed: speed,
                                attack: attack,
                                defense: defense,
                                carry: carry
                            };
                        });

                        $(buildingInfo).find("config").children().toArray().forEach(function (buildingTag) {
                            var buildingName = $(buildingTag).prop("tagName");
                            var minLevel = parseInt($(buildingTag).find("min_level").text());
                            var maxLevel = parseInt($(buildingTag).find("max_level").text());
                            var resources = {
                                wood: parseInt($(buildingTag).find("wood").text()),
                                stone: parseInt($(buildingTag).find("stone").text()),
                                iron: parseInt($(buildingTag).find("iron").text())
                            };
                            var population = parseInt($(buildingTag).find("pop").text());
                            var buildTime = parseInt($(buildingTag).find("build_time").text());
                            var factor = {
                                wood: parseFloat($(buildingTag).find("wood_factor").text()),
                                stone: parseFloat($(buildingTag).find("stone_factor").text()),
                                iron: parseFloat($(buildingTag).find("iron_factor").text()),
                                population: parseFloat($(buildingTag).find("pop_factor").text()),
                                buildTime: parseFloat($(buildingTag).find("build_time_factor").text())
                            };

                            Calculators.GameData.buildingInfo.order.push(buildingName);
                            Calculators.GameData.buildingInfo[buildingName] = {
                                minLevel: minLevel,
                                maxLevel: maxLevel,
                                resources: resources,
                                population: population,
                                buildTime: buildTime,
                                factor: factor
                            };
                        });
                    });
                }
            },
            init: function () {
                Calculators.GameData.fetch().then(function () {
                    console.log("Finished fetching");
                });
            },
            Recruitment: {
                create: function (unit, amount, buildingLevel) {
                    return Object.extend.call(this, {
                        unit: unit,
                        amount: amount,
                        buildingLevel: buildingLevel
                    });
                },
                time: {
                    inSeconds: function (unit, amount, buildingLevel) {
                        var time = amount*Calculators.GameData.unitInfo[unit].buildTime/1.5;
                        for(var i = 0; i < buildingLevel; i++)
                            time /= 1.06;
                        return Math.ceil(time);
                    },
                    asString: function (unit, amount, buildingLevel) {
                        var seconds = this.inSeconds(unit, amount, buildingLevel);
                        var days = Math.floor(seconds/86400);
                        var hours = Math.floor((seconds - days*86400)/3600);
                        var minutes = Math.floor((seconds - days*86400 - hours*3600)/60);
                        var seconds = seconds - days*86400 - hours*3600 - minutes*60;
                        return (days > 0 ? days + ":" : "") + (hours < 10 ? "0" : "") + hours + ":" + (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
                    }
                },
                attack: function () {
                    
                }
            }
        };

        Calculators.init();
    }
}
