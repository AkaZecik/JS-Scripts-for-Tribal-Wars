// 01/08/2017
// v1.0

var when = "18:00:00";
var miliseconds = 500;

(function TroopSender() {
    if(document.getElementsByClassName("relative_time")[0].innerText.slice(-8) == when)
        setTimeout(function() { document.getElementById("troop_confirm_go").click() }, miliseconds);
    setTimeout(TroopSender, 1);
})();
