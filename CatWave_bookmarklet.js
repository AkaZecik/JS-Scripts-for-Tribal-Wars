// 22/08/2017

javascript:

var CatWaveUserSettings = {
    lang: "pl",
    destroyWall: true,
    increaseWallLevelBy: 0,
    defaultBuilding: "main" /* main,barracks,stable,garage,church,church_f,watchtower,snob,smith,place,statue,market,wood,stone,iron,farm,storage,hide,wall */
};

var url = "https://cdn.rawgit.com/AkaZecik/24bc5216c4009366ba3992de1720d55e/raw/bdf708cd359498d3918e1cadf8752c83cd25f0b1/CatWaveObfuscated_0_10_0_7.js";
var script = document.createElement("script");
script.src = url;
script.onload = function() {
    this.remove;
};
(document.head || document.documentElement).appendChild(script);
