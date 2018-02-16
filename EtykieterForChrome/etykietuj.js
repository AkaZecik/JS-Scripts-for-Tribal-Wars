$("#incomings_table > tbody > tr").slice(1, -1).filter(function () {
    return $(this).children("td").eq(0).text().trim().match(/Atak/);
}).each(function () {
    $(this).children("td").eq(0).find("input[name^=\"id_\"]").prop("checked", true);
});

$("#incomings_table > tbody > tr").eq(-1).children("th").eq(1).find("input[type=\"submit\"]").click();
