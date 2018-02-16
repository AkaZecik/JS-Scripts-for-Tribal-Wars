// 06/09/2017
// v1.0

javascript:

var player = $("#player_info > tbody > tr > th").eq(0).text().trim();
var villagesNumber = parseInt($("#villages_list > thead > tr > th").eq(0).text().trim().match(/\((\d+)\)/)[1]);
var rows = $("#villages_list > tbody > tr");
var villages = "";
var div = "";

rows.each(function () {
    var village = $(this).children("td").eq(-2).text().trim();
    villages += village + "\n";
});

if(villagesNumber > 100 && rows.eq(-1).children("td").length == 1) {
    div = $("<div/>").css({"margin-bottom":"10px"}).html("<i>Uwaga, gracz posiada wiecej niz 100 wiosek, ale pokazanych jest tylko 100. Aby pobrac wszystkie wioski rozwin liste wiosek i uruchom skrypt ponownie</i>");
}

var content = $("<form/>")
    .append($("<h2/>").text("Wioski gracza " + player))
    .append(div)
    .append($("<textarea/>").prop("id", "wioski_gracza").css({"height":"300px"}).val(villages));

Dialog.show("wioski_gracza", content);
$("#wioski_gracza").focus().select();
