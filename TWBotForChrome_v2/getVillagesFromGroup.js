var villagesColumnID = $("#combined_table tr").eq(0).find("th").index($("#combined_table tr").eq(0).find("th").filter(function () { return $(this).text().match(/\(\d+\)/); }));

var villages = [];
$("#combined_table tr").slice(1).each(function () {
    var villageID = parseInt($(this).children("td").eq(villagesColumnID).find("a").filter(function () {
    	return $(this).prop("href").match(/\game\.php\?village=\d+/);
    }).prop("href").match(/village=(\d+)/)[1]);
    villages.push(villageID);
});

chrome.runtime.sendMessage({name:"gotVillages", villages: villages});
