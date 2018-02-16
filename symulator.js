if("undefined" == typeof simulatorHasRun) {
    var simulatorHasRun = false;
}

if(!simulatorHasRun) {
    $.ajax({
        url: "https://pl114.plemiona.pl/interface.php?func=get_unit_info",
        type: "GET",
        dataType: "xml",
        success: function (xml) {
            simulatorHasRun = true;
            var units = {};

            $(xml).children("config").children().each(function () {
                var unitName = $(this).prop("tagName");
                var attack = parseInt($(this).children("attack").text());
                var defense = {
                    infantry: parseInt($(this).children("defense").text()),
                    cavalry: parseInt($(this).children("defense_cavalry").text()),
                    archer: parseInt($(this).children("defense_archer").text())
                };
                units[unitName] = {
                    attack: attack,
                    defense: defense
                };
            });

            $("#simulator_units_table > tbody > tr").eq(14)
                .after($("<tr/>")
                    .append($("<td/>"))
                    .append($("<td/>")
                        .append($("<span/>").prop("id", "total_attack"))
                    )
                    .append($("<td/>")
                        .append($("<span/>").prop("id", "total_defense"))
                    )
                );

            var showAttack = function () {
                var unitName = $(this).prop("name").match(/(?:att|def)_([a-zA-Z]+)/)[1];
                var attack = parseInt($(this).val())*units[unitName].attack || 0;
                $("#power_" + $(this).prop("name")).text(attack);
            };
            var showDefense = function () {
                var unitName = $(this).prop("name").match(/(?:att|def)_([a-zA-Z]+)/)[1];
                var defense = {
                    infantry: (parseInt($(this).val()) || 0)*units[unitName].defense.infantry,
                    cavalry: (parseInt($(this).val()) || 0)*units[unitName].defense.cavalry,
                    archer: (parseInt($(this).val()) || 0)*units[unitName].defense.archer
                };
                $("#power_" + $(this).prop("name")).text(defense.infantry + "/" + defense.cavalry + "/" + defense.archer);
            };

            var showTotalAttack = function () {
                var totalAttack = {
                    infantry: 0,
                    cavalry: 0,
                    archer: 0
                };
                ["spear", "sword", "axe", "ram", "catapult", "knight", "snob"].forEach(function (unit) {
                    totalAttack.infantry += parseInt($("[id^=\"power_att_" + unit + "\"]").text());
                });
                ["spy", "light", "heavy"].forEach(function (unit) {
                    totalAttack.cavalry += parseInt($("[id^=\"power_att_" + unit + "\"]").text());
                });
                ["archer", "marcher"].forEach(function (unit) {
                    totalAttack.archer += parseInt($("[id^=\"power_att_" + unit + "\"]").text());
                });
                totalAttack.sum = totalAttack.infantry + totalAttack.cavalry + totalAttack.archer;
                $("#total_attack").text(totalAttack.infantry + "/" + totalAttack.cavalry + "/" + totalAttack.archer + " ------------ " + totalAttack.sum);
            };
            var showTotalDefense = function () {
                var totalDefense = {
                    infantry: 0,
                    cavalry: 0,
                    archer: 0
                };
                $("[id^=\"power_def\"").each(function () {
                    var defense = $(this).text().match(/\d+/g);
                    totalDefense.infantry += parseInt(defense[0]);
                    totalDefense.cavalry += parseInt(defense[1]);
                    totalDefense.archer += parseInt(defense[2]);
                });
                $("#total_defense").text(totalDefense.infantry + "/" + totalDefense.cavalry + "/" + totalDefense.archer);
            };

            game_data.units.forEach(function (unit) {
                if(unit != "militia") {
                    showAttack.call($("[name=\"att_" + unit + "\"]")
                        .after($("<span/>").prop("id", "power_att_" + unit))
                        .change(function () {
                            showAttack.call(this);
                            showTotalAttack();
                        })
                    );
                }

                showDefense.call($("[name=\"def_" + unit + "\"]")
                    .after($("<span/>").prop("id", "power_def_" + unit))
                    .change(function () {
                        showDefense.call(this);
                        showTotalDefense();
                    })
                );
            });

            showTotalAttack();
            showTotalDefense();

            $("[name=\"att_spear\"]").focus().select();
        }
    });
}
