// 03/08/2017
// v1.0.0

var playerID = 8709405;
var distanceMax = 15;

var villages = document.getElementsByTagName("pre")[0].innerText.split("\n");
var villagesLength = villages.length;

var playersVillages = [];
for(var i = 0; i < villages.length; i++) {
    var villageData = villages[i].split(",");
    var id_player = villageData[4];
    var id_village = villageData[0];
    var x = villageData[2];
    var y = villageData[3];
    if(parseInt(id_player) == playerID && parseInt(y) > 500 && parseInt(y) < 585 && parseInt(x) > 700)
        playersVillages.push([i, id_village, x, y]);
}

var playersVillagesLength = playersVillages.length;

var villagesAroundPlayer = [];
for(var i = 0; i < playersVillagesLength; i++) {
    var centerX = playersVillages[i][2];
    var centerY = playersVillages[i][3];

    for(var j = 0; j < villagesLength; j++) {
        var villageData = villages[j].split(",");
        var x = villageData[2];
        var y = villageData[3];
        var distanceSquared = (x-centerX)*(x-centerX) + (y-centerY)*(y-centerY);
        if(distanceSquared <= distanceMax*distanceMax) {
            villagesAroundPlayer.push(j);
        }
    }
}

villagesAroundPlayer = villagesAroundPlayer.sort();

var i = 0;
while(villagesAroundPlayer[i+1] != undefined) {
    if(villagesAroundPlayer[i] == villagesAroundPlayer[i+1])
        villagesAroundPlayer.splice(i, 1);
    else
        i++;
}

var string = "";

for(var i = 0; i < villagesAroundPlayer.length; i++) {
    var index = villagesAroundPlayer[i];
    var village = villages[index].split(",");
    var x = village[2];
    var y = village[3];
    string += "https://" + window.location.hostname + "/game.php?screen=place&x=" + x + "&y=" + y + "&from=simulator&att_spy=1\n";
}

console.log(string);
