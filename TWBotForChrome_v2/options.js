$(function () {
    restoreOptions();
    $("#save").click(function () {
        saveOptions();
    });
    $("#reset").click(function () {
        revertOptions();
    });
});

function saveOptions() {
    var farm_on = $("#farm_on").val();
    var max_wall = $("#max_wall").val();
    var farm_time_interval = $("#farm_time_interval").val();
    var max_distance = $("#max_distance").val();
    var min_time = $("#min_time").val();
    var max_time = $("#max_time").val();
    chrome.storage.local.set({
        farmerFarmOn: farm_on,
        farmerFarmTimeInterval: farm_time_interval,
        farmerMaxWall: max_wall,
        farmerMaxDistance: max_distance,
        farmerMinTime: min_time,
        farmerMaxTime: max_time
    }, function() {
        $("#status_save").text("Zapisano");
        setTimeout(function() {
            $("#status_save").text("");
        }, 1000);
    });
}

function restoreOptions() {
    chrome.storage.local.get({
        farmerFarmOn: "c",
        farmerFarmTimeInterval: "1800",
        farmerMaxWall: "2",
        farmerMaxDistance: "15",
        farmerMinTime: "200",
        farmerMaxTime: "400"
    }, function(options) {
        $("#farm_on").val(options.farmerFarmOn);
        $("#farm_time_interval").val(options.farmerFarmTimeInterval);
        $("#max_wall").val(options.farmerMaxWall);
        $("#max_distance").val(options.farmerMaxDistance);
        $("#min_time").val(options.farmerMinTime);
        $("#max_time").val(options.farmerMaxTime);
    });
}

function revertOptions() {
    chrome.storage.local.set({
        farmerFarmOn: "c",
        farmerFarmTimeInterval: "1800",
        farmerMaxWall: "2",
        farmerMaxDistance: "15",
        farmerMinTime: "200",
        farmerMaxTime: "400"
    }, function() {
        restoreOptions();
        $("#status_reset").text("Opcje przywrocono");
        setTimeout(function() {
            $("#status_reset").text("");
        }, 1000);
    });
}
