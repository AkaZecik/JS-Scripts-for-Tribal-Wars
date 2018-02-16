// 14/08/2017
// v1.0.0

javascript:

var settings = {
    "farm_on": "c",
    "max_wall": 0,
    "max_distance": 15,
    "time_min": 200,
    "time_max": 500
};

var rows = $("tr[id^=\"village_\"]");
var rows_num = rows.length;
var table = [];
for(var i = 0; i < rows_num; i++) {
    var node = rows.eq(i);
    table.push({
        "village": node.children().eq(3).text(),
        "distance": parseFloat(node.children().eq(7).text()),
        "wall": parseInt(node.children().eq(6).text() == "?" ? -1 : node.children().eq(6).text()),
        "farm_icon_a": node.find("a.farm_icon_a"),
        "farm_icon_b": node.find("a.farm_icon_b"),
        "farm_icon_c": node.find("a.farm_icon_c")
    });
}

var counter = 0;
(function farmer() {
    timer = 0;
    if(villagesFilter(table[counter]["wall"], table[counter]["distance"])) {
    table[counter]["farm_icon_" + settings["farm_on"]].click();
    var timer = randomTimer(settings["time_min"], settings["time_max"]);
    }
    console.log(counter + " " + timer);
    counter++;
    if(counter >= table.length) return;
    setTimeout(farmer, timer);
})();

function randomTimer(time_min, time_max) {
    var timer = Math.round( Math.random()*(time_max - time_min + 1) + time_min );
    return timer;
}

function villagesFilter(wall, distance) {
    return wall <= settings["max_wall"] && distance <= settings["max_distance"] ? !0 : !1;
}
