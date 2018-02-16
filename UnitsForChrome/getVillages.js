window.addEventListener("GotSitter", function (event) {
    console.log("I'm in GotSitter listener");
    window.removeEventListener("GotSitter", arguments.callee);
    var urls = [];
    var playerID = event.detail.playerID;
    console.log(playerID);
    $("#production_table > tbody > tr").slice(1).each(function () {
        var villageID = $(this).children("td").eq(0).find("a").eq(0).prop("href").match(/village=(\d+)/)[1];
        var url = "https://" + window.location.hostname + "/game.php?village=" + villageID + "&t=" + playerID + "&screen=place&mode=units";
            urls.push(url);
    });
    console.log(urls);
    chrome.runtime.sendMessage({
        name: "GotVillages",
        data: {
            urls: urls
        }
    });
});

var script = document.createElement("script");
script.src = chrome.runtime.getURL("getVillagesInjected.js");
script.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);
