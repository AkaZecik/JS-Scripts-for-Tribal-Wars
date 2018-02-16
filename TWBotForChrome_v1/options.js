function save_options() {
    var farm_on = document.getElementById('farm_on').value;
    var wall = document.getElementById('wall').value;
    var timer = document.getElementById("timer").value;
    var distance = document.getElementById("distance").value;
    var min_time = document.getElementById("min_time").value;
    var max_time = document.getElementById("max_time").value;
    chrome.storage.local.set({
        farmerFarmOn: farm_on,
        farmerTimer: timer,
        farmerWall: wall,
        farmerDistance: distance,
        farmerMinTime: min_time,
        farmerMaxTime: max_time
    }, function() {
        var status = document.getElementById('status_save');
        status.innerText = 'Options saved.';
        setTimeout(function() {
            status.innerText = '';
        }, 1000);
    });
}

function restore_options() {
    chrome.storage.local.get({
        farmerFarmOn: "c",
        farmerTimer: "30",
        farmerWall: "2",
        farmerDistance: "15",
        farmerMinTime: "200",
        farmerMaxTime: "400"
    }, function(options) {
        console.log(options);
        console.log(options.farmerFarmOn);
        document.getElementById('farm_on').value = options.farmerFarmOn;
        document.getElementById("timer").value = options.farmerTimer;
        document.getElementById('wall').value = options.farmerWall;
        document.getElementById("distance").value = options.farmerDistance;
        document.getElementById("min_time").value = options.farmerMinTime;
        document.getElementById("max_time").value = options.farmerMaxTime;
    });
}

function reset_options() {
    chrome.storage.local.set({
        farmerFarmOn: "c",
        farmerTimer: "30",
        farmerWall: "2",
        farmerDistance: "15",
        farmerMinTime: "200",
        farmerMaxTime: "400"
    }, function(options) {
        restore_options();

        var status = document.getElementById('status_reset');
        status.innerText = 'Options reverted.';
        setTimeout(function() {
          status.innerText = "";
        }, 1000);
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
document.getElementById("reset").addEventListener("click",
    reset_options);
