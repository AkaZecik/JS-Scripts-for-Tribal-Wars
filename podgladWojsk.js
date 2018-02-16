if(!premium) {
    if(game_data.screen == "overview_villages") {
        if("undefined" == typeof wojskaPoliczone) {
            var wojskaPoliczone = false;
        }

        if(!wojskaPoliczone) {
            var villages = {};
            var villagesTable = $("#production_table > tbody > tr");

            asyncLoop(villagesTable.length - 1, function (loop) {
                var i = loop.i();
                var iterations = loop.iterations();
                var villageID = villagesTable.slice(1).eq(i).children("td").eq(0).find("a").eq(0).prop("href").match(/village=(\d+)/)[1];
                var villageName = villagesTable.slice(1).eq(i).children("td").eq(0).find("a").eq(0).text().trim();
                var url = "https://" + window.location.hostname + "/game.php?village=" + villageID + "&t=" + game_data.player.id + "&screen=place&mode=units";
                $.ajax({
                    url: url,
                    type: "GET",
                    dataType: "html",
                    success: function (data) {
                        console.log((i+1) + "/" + iterations);
                        villagesTable.slice(1).eq(i).children("td").eq(0).prepend($("<span/>").addClass("wioskaOdhaczona").text("X"));

                        var units = retrieveUnits(data);
                        villages[villageID] = {
                            name: villageName,
                            units: units
                        };

                        loop.go();
                    },
                    error: function () {
                        loop.break("error");
                    }
                });
            }, function () {
                if(arguments[0] !== "error") {
                    wojskaPoliczone = true;
                    displayUnits();
                } else {
                    alert("Nie udalo sie pobrac wszystkich danych. Zatrzymano sie na wiosce o numerze " + i);
                }
            });
        } else {
            UI.ErrorMessage("Nie uzywaj tego dwa razy, gluptasie :P<br>Najpierw odswiez strone :D", 3000);
        }
    } else {
        UI.ErrorMessage("Wejdz do przegladu wiosek, geniuszu... :D", 3000);
    }
} else {
    UI.ErrorMessage("Po co Ci ten skrypt skoro masz funkcje premium? :D<br>A teraz zeby zrobic Ci na zlosc nie wylacze sie nigdy xDDD<br>Muahahaha!", 1000000);
}

/* functions */

function asyncLoop(iterations, func, callback) {
    var i = -1;

    var loop = {
        go: function () {
            if(i+1 < iterations) {
                i++;
                func(loop);
            } else {
                loop.break();
            }
        },
        i: function () {
            return i;
        },
        iterations: function () {
            return iterations;
        },
        break: function () {
            callback(arguments);
        }
    };

    loop.go();

    return loop;
}

function retrieveUnits (ajaxResponse) {
    var units = {};
    var unitsHomeRows = $($.parseHTML(ajaxResponse)).find("#units_home > tbody > tr");
    unitsHomeRows.eq(0).find("th").each(function () {
        var unitImage = $(this).find("img");
        if(unitImage.length) {
            var unitName = unitImage.prop("src").match(/unit_([a-zA-Z]+)\.png/)[1];
            var columnID = unitsHomeRows.eq(0).find("th").index($(this));
            var amountTotal = parseInt(unitsHomeRows.eq(-1).find("th").eq(columnID).text().trim());
            var unitData = {
                amountTotal: amountTotal
            };
            units[unitName] = unitData;
        }
    });

    return units;
}

function displayUnits () {
    $(".wioskaOdhaczona").remove();
    villagesTable.eq(0).find("th").eq(1).after(function () {
        var ths = [];
        for(var i = 0; i < game_data.units.length; i++) {
            var unit = game_data.units[i];
            ths.push($("<th/>")
                .append($("<img/>").prop("src", image_base + "unit/unit_" + unit + ".png"))
            );
        }
        return ths;
    });
    villagesTable.slice(1).each(function () {
        var villageID = $(this).children("td").eq(0).find("a").eq(0).prop("href").match(/village=(\d+)/)[1];
        $(this).find("td").eq(1).after(function () {
            var tds = [];
            for(var i = 0; i < game_data.units.length; i++) {
                var unit = game_data.units[i];
                var amountTotal = villages[villageID].units[unit].amountTotal;
                tds.push($("<td/>").text(amountTotal));
            }
            return tds;
        });
    });
}
