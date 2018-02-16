// 06/09/2017
// v1.0

var players = {};

$.ajax({
    url: "https://" + window.location.hostname + "/map/player.txt",
    type: "GET",
    dataType: "html",
    success: function (data) {
        data.split("\n").forEach(function (player) {
            player = player.split(",");
            var name = decodeURIComponent(player[1]).replace(/\+/g, " ");
            var points = parseInt(player[4]);
            players[name] = points;
        });

        var calculateMorale = function () {
            var att = players[$("#morale_calc_att").val().trim()];
            var def = players[$("#morale_calc_def").val().trim()];

            if(att && def) {
                var morale = 300*(0.1 + def/att);
                morale = Math.round(morale > 100 ? 100 : morale);
                var loss = Math.sqrt((100/morale)**3).toFixed(4);
                $("#morale_calc_morale").text(morale + "%");
                $("#morale_calc_loss").text(loss);
            } else {
                $("#morale_calc_morale").text("");
                $("#morale_calc_loss").text("");
            }
        };
        var content = $("<form/>").append($("<table/>")
            .append($("<tbody/>")
                .append($("<tr/>")
                    .append($("<td/>").text("Atakujacy:"))
                    .append($("<td/>")
                        .append($("<input/>", {type: "text"}).prop("id", "morale_calc_att").prop("autocomplete", "off").change(function () {
                            calculateMorale();
                        }))
                    )
                )
                .append($("<tr/>")
                    .append($("<td/>").text("Obronca:"))
                    .append($("<td/>")
                        .append($("<input/>", {type: "text"}).prop("id", "morale_calc_def").prop("autocomplete", "off").change(function () {
                            calculateMorale();
                        }))
                    )
                )
                .append($("<tr/>")
                    .append($("<td/>").text("Morale:"))
                    .append($("<td/>").prop("id", "morale_calc_morale"))
                )
                .append($("<tr/>")
                    .append($("<td/>").text("Straty przy ataku wieksze X razy: "))
                    .append($("<td/>").prop("id", "morale_calc_loss"))
                )
            )
        );

        Dialog.show("test", content);
    }
});
