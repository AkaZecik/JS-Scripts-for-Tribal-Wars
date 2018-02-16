document.addEventListener("SEND_SETTINGS", function(message) {
    var settings = message.detail;

    var rows = $("tr[id^=\"village_\"]");
    var rows_num = rows.length;
    var table = [];
    for(var i = 0; i < rows_num; i++) {
        var node = rows.eq(i);
        var villageData = {
            "village": node.children().eq(3).text(),
            "distance": parseFloat(node.children().eq(7).text()),
            "wall": parseInt(node.children().eq(6).text() == "?" ? -1 : node.children().eq(6).text()),
            "farm_icon_a": node.find("a.farm_icon_a"),
            "farm_icon_b": node.find("a.farm_icon_b"),
            "farm_icon_c": node.find("a.farm_icon_c")
        };

        if(villagesFilter(villageData["wall"], villageData["distance"])) {
            table.push({
                "village": node.children().eq(3).text(),
                "distance": parseFloat(node.children().eq(7).text()),
                "wall": parseInt(node.children().eq(6).text() == "?" ? -1 : node.children().eq(6).text()),
                "farm_icon_a": node.find("a.farm_icon_a"),
                "farm_icon_b": node.find("a.farm_icon_b"),
                "farm_icon_c": node.find("a.farm_icon_c")
            });
        }

    }

    (function (){
        $("a.farm_icon_c, a.farm_icon_b, a.farm_icon_a").click(function() {
            $(this).closest("tr").remove();
        });
    })();

    var counter = 0;
    var endpoint1 = 71694;
    (function farmer() {
        timer = 0;
        // if(villagesFilter(table[counter]["wall"], table[counter]["distance"])) {
        // }
        if(counter >= table.length || (settings["farm_on"] == "a" && Accountmanager.farm.current_units["spy"] == 0) || (settings["farm_on"] == "c" && Accountmanager.farm.current_units["light"] == 0 && Accountmanager.farm.current_units["marcher"] == 0 && Accountmanager.farm.current_units["heavy"] == 0)) {
                document.dispatchEvent(new CustomEvent("FINISHED_FARMING", {
                    detail: game_data
                }));
        } else {
            table[counter]["farm_icon_" + settings["farm_on"]].click();
            var timer = randomTimer(settings["time_min"], settings["time_max"]);
            console.log(counter + " " + timer);
            counter++;
            setTimeout(farmer, timer);
        }
    })();

    function randomTimer(time_min, time_max) {
        var timer = Math.round( Math.random()*(time_max - time_min + 1) + time_min );
        return timer;
    }

    function villagesFilter(wall, distance) {
        return wall <= settings["max_wall"] && distance <= settings["max_distance"] ? !0 : !1;
    }
});
