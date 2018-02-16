$(function () {
    $("#submit").click(function (event) {
        event.preventDefault();
        console.log("I'm here");
        var time = parseInt($("#time").val());
        if(time > 0 && time <= 60) {
            chrome.runtime.sendMessage({
                name: "time",
                data: {
                    time: time
                }
            });
            window.close();
        } else {
            alert("Czas musi byc miedzy 1 a 60 (min)");
        }
    });
});
