var radius = 15;
var villages = {};
var rank = [];

$.ajax({
    url: "https://" + window.location.hostname + "/map/village.txt",
    type: "GET",
    dataType: "html",
    success: function (data) {
        data = data.split("\n");

        data.forEach(function (village) {
            village = village.split(",");
            var x = parseInt(village[2]);
            var y = parseInt(village[3]);
            var owner = village[4];
            if(owner == "0") {
                villages[x + "|" + y] = 1;
            }
        });

        for(var village in villages) {
            var coords = village.match(/(\d+)\|(\d+)/);
            var x = parseInt(coords[1]);
            var y = parseInt(coords[2]);
            if(x >= 600 && x < 700 && y >= 700 && y < 800 && ((x-675)*(x-675) + (y-696)*(y-696) >= 900) && ((x-629)*(x-629) + (y-757)*(y-757) >= 900)) {
                rank.push({
                    coords: village,
                    villagesAround: countVillages(x, y)
                });
            }
        }

        rank.sort(function (a, b) {
            if(a.villagesAround < b.villagesAround) {
                return 1;
            }
            if(a.villagesAround > b.villagesAround) {
                return -1;
            }
            return 0;
        });

        console.log(villages);
        var string = "";
        for(var i = 0; i < 20; i++) {
            string += rank[i].coords + " - " + rank[i].villagesAround + "\n";
        }
        console.log(string);
    }
});

function countVillages (x, y) {
    var villagesAround = 0;
    for(var i = 0; i < radius; i++) {
        for(var j = 0; i*i + j*j <= radius*radius && i + j != 0; j++) {
            var coord1 = villages[(x + i) + "|" + (y + i)] || 0;
            var coord2 = villages[(x + i) + "|" + (y - i)] || 0;
            var coord3 = villages[(x - i) + "|" + (y + i)] || 0;
            var coord4 = villages[(x - i) + "|" + (y - i)] || 0;
            villagesAround += coord1 + coord2 + coord3 + coord4;
        }
    }
    return villagesAround;
}
