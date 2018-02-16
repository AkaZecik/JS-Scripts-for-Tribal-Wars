var plunderList = [];

$(function () {
    $("a.farm_icon_c, a.farm_icon_b, a.farm_icon_a").click(function () {
        $(this).closest("tr").remove();
    });

    var plunderListHeader = $("table#plunder_list tr").eq(0);
    var wallColumnID = plunderListHeader.find("th").index(plunderListHeader.find("th:has(img[src$=\"wall.png\"])"));
    var distanceColumnID = plunderListHeader.find("th").index(plunderListHeader.find("th:has(img[src$=\"rechts.png\"])"));
    var plunderListBody = $("table#plunder_list tr[id^=\"village_\"]");
    for(var i = 0; i < plunderListBody.length; i++) {
        var plunderElement = plunderListBody.eq(i);
        var wall = parseInt(plunderElement.find("td").eq(wallColumnID).text().trim());
        var distance = parseInt(plunderElement.find("td").eq(distanceColumnID).text().trim());
        if(filter(wall, distance)) {
            var iconA = plunderElement.find(".farm_icon_a");
            var iconB = plunderElement.find(".farm_icon_b");
            var iconC = plunderElement.find(".farm_icon_c");
            plunderList.push({
                iconA: iconA,
                iconB: iconB,
                iconC: iconC
            });
        }
    }

    farmer(0, plunderList.length);
});

function interval(minTime, maxTime) {
    return Math.floor(Math.random()*(maxTime - minTime) + minTime);
}

function filter(wall, distance) {
    return wall <= settings.maxWall && distance <= settings.maxDistance;
}

function farmer(i, iterations) {
    if(i < iterations && remainingTroops(["light", "marcher", "heavy"])) {
        switch(settings.farmOn) {
            case "a": plunderList[i].iconA[0].click(); break;
            case "b": plunderList[i].iconB[0].click(); break;
            case "c": plunderList[i].iconC[0].click(); break;
        }
        var timeInterval = interval(settings.minTime, settings.maxTime);
        setTimeout(function() { farmer(i+1, iterations); }, timeInterval);
    } else {
        chrome.runtime.sendMessage({name:"farmFinished"});
    }
}

function remainingTroops(troops) {
    for(var i = 0; i < troops.length; i++) {
        var amount = parseInt($("#" + troops[i]).text());
        if(amount != 0)
            return true;
    }

    return false;
}
