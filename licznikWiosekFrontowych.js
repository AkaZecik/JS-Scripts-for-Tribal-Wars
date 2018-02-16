// 06/09/2017
// v1.0.0

var searchRadius = 5;
var enemyTribes = [1463, 1487, 1952, 748, 854/*, 3307*/];
var players = {
    god: {},
    bb: {},
    enemy: {}
};
var villages = {
    god: {},
    bb: {},
    enemy: {}
};
var front = {
    god: [],
    bb: []
};

$.when(
    $.ajax({
        url: "https://pl114.plemiona.pl/map/player.txt",
        type: "GET",
        dataType: "html"
    }), $.ajax({
        url: "https://pl114.plemiona.pl/map/village.txt",
        type: "GET",
        dataType: "html"
    })
).then(function (v1, v2) {
    var playersData = v1[0].split("\n");
    var villagesData = v2[0].split("\n");

    for(var i = 0; i < playersData.length; i++) {
        var player = playersData[i].split(",");
        var id = player[0];
        var tribe = parseInt(player[2]);
        if(tribe == 354) {
            players.god[id] = true;
        } else if(tribe == 2924) {
            players.bb[id] = true;
        } else if(enemyTribes.indexOf(tribe) != -1) {
            players.enemy[id] = true;
        }
    }
    console.log("players filter done");
    console.log(players);

    for(var i = 0; i < villagesData.length; i++) {
        var village = villagesData[i].split(",");
        var owner = parseInt(village[4]);
        var x = parseInt(village[2]);
        var y = parseInt(village[3]);
        var target = x + "|" + y;
        if(players.god[owner]) {
            villages.god[target] = true;
        } else if(players.bb[owner]) {
            villages.bb[target] = true;
        } else if(players.enemy[owner]) {
            villages.enemy[target] = true;
        }
    }
    console.log("villages filter done");
    console.log(villages);

    for(var village in villages.god) {
        if(searchForEnemyVillage(village)) {
            front.god.push(village);
        }
    }
    console.log("god front done");
    console.log(front.god);

    for(var village in villages.bb) {
        if(searchForEnemyVillage(village)) {
            front.bb.push(village);
        }
    }
    console.log("bb front done");
    console.log(front.bb);

    var string = "";
    string += "--------------" + "\n";
    string += "Promien szukania: " + searchRadius + " kratek" + "\n";
    string += "Liczba wiosek frontowych GOD: " + front.god.length + "\n";
    string += "Liczba wiosek frontowych BB: " + front.bb.length + "\n";
    string += "--------------" + "\n";
    console.log(string);
});

function searchForEnemyVillage (target) {
    var coords = target.match(/(\d+)\|(\d+)/);
    var x = parseInt(coords[1]);
    var y = parseInt(coords[2]);
    var radiusSquared = searchRadius*searchRadius;
    for(var i = 0; i <= searchRadius; i++) {
        for(var j = 0; i*i + j*j <= radiusSquared; j++) {
            if(villages.enemy[(x+i) + "|" + (y+j)] || villages.enemy[(x+i) + "|" + (y-j)] || villages.enemy[(x-i) + "|" + (y+j)] || villages.enemy[(x-i) + "|" + (y-j)]) {
                return true;
            }
        }
    }
    return false;
}
