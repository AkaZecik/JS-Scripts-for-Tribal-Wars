var table = [];

$("#combined_table tr:gt(0)").find("td:eq(1)").each(function(el) {
    table.push($(this).children().eq(0).attr("data-id"));
});

chrome.runtime.sendMessage({name: "villagesTable", villagesTable: table});
