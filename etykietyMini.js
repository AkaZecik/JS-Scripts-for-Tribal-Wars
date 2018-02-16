// 04/09/2017
// v1.0

javascript:

$("#incomings_table > tbody > tr").slice(1, -1).filter(function () {
    return $(this).children("td").eq(0).text().trim().match(/Atak/);
}).children("td").eq(0).find("input[name^=\"id_\"]").prop("checked", true);
