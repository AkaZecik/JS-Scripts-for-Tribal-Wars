// 21/09/2017
// v1.0.0

if(game_data.device == "desktop") {
    if(game_data.screen == "reqdef") {
        showHideSensitiveInfoBox();
    } else {
        UI.ErrorMessage("Użyj skryptu w trybie \"Poproś o pomoc\" z zakładki \"Ataki\"");
    }
}

function showHideSensitiveInfoBox () {
    var dialogContent = $("<form/>").submit(function (event) {
        event.preventDefault();
    }).append("Wybierz informacje do ukrycia:<br>")
        .append($("<input/>", {type: "checkbox"}).prop("id", "hide_wall_level").prop("checked", true))
        .append($("<span/>").css({"cursor": "default"}).text("poziom muru"))
        .append($("<br/>"))
        .append($("<input/>", {type: "checkbox"}).prop("id", "hide_units").prop("checked", true))
        .append($("<span/>").css({"cursor": "default"}).text("jednostki"))
        .append($("<br/>"))
        .append($("<button/>", {type: "button"}).prop("id", "hide_sensitive_info_button").addClass("btn").css({"margin-top":"10px"}).text("Ukryj").click(function () {
            hideSensitiveInfo();
            Dialog.close();
            UI.SuccessMessage("Usunięto poufne informacje");
        }));

    dialogContent.find("span").hover(function () {
        $(this).css({"text-decoration": "underline"})
    }, function () {
        $(this).css({"text-decoration": "none"})
    }).click(function () {
        $(this).prev().prop("checked", !$(this).prev().prop("checked")).trigger("change");
    }).bind('selectstart dragstart', function(event) {
        event.preventDefault();
    });

    dialogContent.find("input[type=\"checkbox\"]").change(function () {
        var allUnchecked = dialogContent.find("input[type=\"checkbox\"]").toArray().every(function (checkbox) {
            return !$(checkbox).prop("checked");
        });
        $("#hide_sensitive_info_button").prop("disabled", allUnchecked);
    });

    Dialog.show("help_filter", dialogContent);
    $("#hide_sensitive_info_button").focus();
}

function hideSensitiveInfo () {
    var messageSimple = $("#simple_message").val().match(/(\[b\]Wioska:\[\/b\])[\s\S]*?(?=\1|$)/g).map(function (tekst) { return tekst.trim(); });
    var messageComplexHeader = $("#message").val().match(/^[\s\S]*?(?=\[b\]Zaatakowana wioska\[\/b\])/)[0];
    var messageComplexBody = $("#message").val().match(/(\[b\]Zaatakowana wioska\[\/b\])[\s\S]*?(?=\1|$)/g).map(function (tekst) { return tekst.trim(); });

    var hideWallLevel = $("#hide_wall_level").prop("checked");
    var hideUnits = $("#hide_units").prop("checked");

    if(hideWallLevel) {
        messageSimple = messageSimple.map(function (tekst) { return tekst.replace(/\[b\]Poziom muru:\[\/b\] \d+[\r\n]/, ""); });
        messageComplexBody = messageComplexBody.map(function (tekst) { return tekst.replace(/Poziom muru obronnego: \d+[\r\n]/, ""); });
    }

    if(hideUnits) {
        messageSimple = messageSimple.map(function (tekst) { return tekst.replace(/\[b\]Obrońca:\[\/b\].*[\r\n]/, ""); });
        messageComplexBody = messageComplexBody.map(function (tekst) { return tekst.replace(/\[b\]Obecne Wojska\[\/b\][\s\S]*?(?=\s{4}\[b\]1\. Atak\[\/b\])/, ""); });
    }

    $("#simple_message").val(messageSimple.join("\n\n\n"));
    $("#message").val(messageComplexHeader + messageComplexBody.join("\n\n\n"));
}

void(0);
