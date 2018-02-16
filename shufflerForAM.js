// 08/08/2017
// v1.0.0
// draft

var villages = document.getElementsByTagName("pre")[0].innerText.split("\n");
var barbs = [];
for(var i = 0; i < villages.length; i++) {
    var village = villages[i].split(",");
    var owner = village[4];
    var x = parseInt(village[2]);
    var y = parseInt(village[3]);
    var id = parseInt(village[0]);
    if(owner == "0" && (x >= 700 && x < 740 && y >= 500 && y < 585))
        barbs.push([x, y, id]);
}

var myVillages = [
    [707, 611],
    [711, 598],
    [707, 609],
    [706, 610],
    [707, 612],
    [709, 613],
    [710, 613],
    [709, 614],
    [694, 596]
];

/* find ids of own villages */
for(var i = 0; i < myVillages.length; i++) {
    for(var j = 0; j < villages.length; j++) {
        var village = villages[j].split(",");
        var ownX = myVillages[i][0];
        var ownY = myVillages[i][1];
        var x = village[2];
        var y = village[3];
        if(ownX == x && ownY == y) {
            myVillages[i].push(village[0]);
        }
    }
}

var sortedDistances = [];
var list = [];

for(var i = 0; i < myVillages.length; i++) {
    var centerX = myVillages[i][0];
    var centerY = myVillages[i][1];
    sortedDistances[i] = [];
    list[i] = [];
    for(var j = 0; j < barbs.length; j++) {
        var id = barbs[j][2];
        var x = barbs[j][0];
        var y = barbs[j][1];
        var distance = (x-centerX)*(x-centerX) + (y-centerY)*(y-centerY);
        sortedDistances[i].push([distance, x, y, id, myVillages[i][2]]);
    }
}

function sorter(a, b) {
    if(a[0] < b[0])
        return -1;
    if(a[0] > b[0])
        return 1;
    return 0;
}

for(var i = 0; i < sortedDistances.length; i++) {
    sortedDistances[i].sort(sorter);
}

var remaining = barbs.length;
console.log(sortedDistances);

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

var order = [];
var k = 0;
while(order.length < barbs.length) {
    var shuffled = k%2 == 0
        ? shuffle([0,0,1,1,2,3,4,5,6,7,8])
        : shuffle([0,1,2,3,4,5,6,7,8]);
    k++;
    for(var i = 0; i < shuffled.length; i++)
        order.push(shuffled[i]);
}

order.splice(barbs.length);
console.log(order);

function cleaner(villageID) {
    for(var i = 0; i < sortedDistances.length; i++) {
        var index = sortedDistances[i].findIndex(function(element) {
            //console.log(element[3]);
            return villageID == element[3];
        });
        //console.log(index);
        sortedDistances[i].splice(index, 1);
    }
}

for(var i = 0; i < order.length; i++) {
    var orderedVillage = order[i];
    var villageID = sortedDistances[orderedVillage][0][3];
    list[order[i]].push(sortedDistances[order[i]][0]);
    cleaner(villageID);
}

var string = "";
for(var i = 0; i < list.length; i++) {
    string += myVillages[i][0] + "|" + myVillages[i][1] + " (0/" + list[i].length + ")\n[spoiler]\n";
    for(var j = 0; j < list[i].length; j++) {
        var x = list[i][j][1];
        var y = list[i][j][2];
        var centerVillageID = list[i][j][4];
        string += "https://pl114.plemiona.pl/game.php?village=" + centerVillageID + "&screen=place&x=" + x + "&y=" + y + "&from=simulator&att_spy=1\n\n";
    }
    string = string.trim();
    string += "\n[/spoiler]\n\n";
}

console.log(string);
