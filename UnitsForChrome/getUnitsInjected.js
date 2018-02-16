var unitsTableRows = $("#units_home > tbody > tr");
var units = [];
unitsTableRows.eq(0).find("th").each(function () {
    var unitImage = $(this).find("img");
    if(unitImage.length) {
        var unitName = unitImage.prop("src").match(/unit_([a-zA-Z]+)\.png/)[1];
        var columnID = unitsTableRows.eq(0).find("th").index($(this));
        var amountOwn = parseInt(unitsTableRows.eq(1).find("td").eq(columnID).text().trim());
        var unit = {
            unitName: unitName,
            amountOwn: amountOwn
        };
        if(unitsTableRows.length > 3) {
            var amountOther = parseInt(unitsTableRows.eq(-2).find("th").eq(columnID).text().trim());
            unit.amountOther = amountOther;
        }
        units.push(unit);
    }
});

console.log(units);

window.dispatchEvent(new CustomEvent("GotUnits", {
    detail: {
        units: units
    }
}));
