javascript:

// 20/12/2017
// v1.0

var table = $("#content_value table.vis").filter(function() {
    return $(this).find("tbody > tr").eq(0).find("th:contains(\"Nazwa\")").size();
});

var nameColID = $(table).find("tbody > tr").eq(0).find("th").index(
    $(table).eq(0).find("tbody > tr").eq(0).find("th").filter(function() {
        return $(this).text().match("Nazwa");
    });
);

var text = "";

$(table).eq(0).find("tbody > tr[class^=\"row_\"]").each(function(index) {
    playerName = $(this).find("td").eq(nameColID).text().trim();
    text += (index+1) + ". [player]" + playerName + "[\/player]\n";
});

console.log(text);
