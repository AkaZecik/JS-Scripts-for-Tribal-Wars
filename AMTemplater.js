javascript:

/*
    Author: AKZ123
    Version: 3.1.1
    Last update: 07/14/2018 (mm/dd/yyyy)
*/

if("undefined" == typeof AMTemplater) {
    var AMTemplater = {
        init: function () {
            if(game_data.features.AccountManager.active) {
                if(game_data.screen == "am_village" && game_data.mode != undefined) {
                    if(game_data.mode == "queue")
                        AMTemplater.queueUI();
                    if(game_data.mode == "template")
                        AMTemplater.templateUI();
                } else {
                    UI.ErrorMessage("Użyj skryptu w trybie zarządzania szablonami budowy w Menedżerze Konta");
                }
            } else {
                UI.ErrorMessage("Aby użyć skryptu, musisz aktywować Menedżera Konta.");
            }
        },
        queueUI: function () {
            if($("#am_templater").length == 0) {
                $("#template_queue").parent().before($("<div/>").prop("id", "am_templater").addClass("vis")
                    .append($("<table/>").css({"width":"100%"})
                        .append($("<tbody/>")
                            .append($("<tr/>")
                                .append($("<td/>").css({"text-align":"right", "padding-right":"20px"})
                                    .append($("<button/>", {type:"button"}).addClass("btn").css({"width":"200px"}).text("Eksportuj szablon").click(function (event) {
                                        event.preventDefault();
                                        AMTemplater.export($("#content_value"));
                                    }))
                                )
                                .append($("<td/>").css({"padding-left":"20px"})
                                    .append($("<button/>", {type:"button"}).addClass("btn").css({"width":"200px"}).text("Importuj szablon").click(function (event) {
                                        event.preventDefault();
                                        AMTemplater.import();
                                    }))
                                )
                            )
                            .append($("<tr/>")
                                .append($("<td/>").css({"text-align":"right", "padding-right":"20px"})
                                    .append($("<button/>", {type:"button"}).addClass("btn").css({"width":"200px"}).text("Maksymalizuj szablon").click(function (event) {
                                        event.preventDefault();
                                        UI.ErrorMessage("Uwaga, proces może zająć dłuższą chwilę.<br>W tym czasie strona będzie zamrożona.");
                                        setTimeout(function () {
                                            AMTemplater.transform("expand");
                                        }, 1);
                                    }))
                                )
                                .append($("<td/>").css({"padding-left":"20px"})
                                    .append($("<button/>", {type:"button"}).addClass("btn").css({"width":"200px"}).text("Minimalizuj szablon").click(function (event) {
                                        event.preventDefault();
                                        UI.ErrorMessage("Uwaga, proces może zająć dłuższą chwilę.<br>W tym czasie strona będzie zamrożona.");
                                        setTimeout(function () {
                                            AMTemplater.transform("collapse");
                                        }, 1);
                                    }))
                                )
                            )
                            .append($("<tr/>")
                                .append($("<td/>").prop("colspan", "2").css({"text-align":"center"})
                                    .append($("<button/>", {type:"button"}).addClass("btn").css({"width":"200px"}).text("Zapisz zmiany").click(function (event) {
                                        event.preventDefault();
                                        $("#auto_demolish").closest("form").submit();
                                    }))
                                )
                            )
                        )
                    )
                );
            } else {
                $("#am_templater").toggle();
            }
        },
        templateUI: function () {
            if($("#am_templater").length == 0) {
                var rows = $("#content_value").children("div").last().find("table tr");
                rows.eq(0).append($("<th/>").addClass("am_templater").html("&nbsp;"));
                for(var i = 1; i < rows.length; i++) {
                    rows.eq(i).append($("<td/>").html($("<a/>").prop("href", "#").text("Eksportuj").click(function (event) {
                        event.preventDefault();
                        var url = $(this).closest("tr").children("td").eq(0).find("a").filter(function () {
                            return $(this).prop("href").match(/mode=queue/);
                        }).eq(0).prop("href");
                        $.ajax({
                            url: url,
                            type: "GET",
                            dataType: "html",
                            success: function (data) {
                                var contentValue = $($.parseHTML(data)).find("#content_value");
                                AMTemplater.export(contentValue);
                            }
                        });
                    })))
                }
            }
        },
        export: function (contentValue) {
            var template = [];
            template.push("autodemolish: " + $(contentValue).find("#auto_demolish").prop("checked"));
            $(contentValue).find("#template_queue li").each(function () {
                var building = $(this).find("a").prop("class").match(/building-([a-zA-Z]+)/)[1];
                var levelRelative = parseInt($(this).find("span.level_relative").text().match(/\d+/)[0]);
                template.push(building + " +" + levelRelative);
            });

            var templateBeautiful = "";
            template.forEach(function (element) {
                templateBeautiful += element + "\n";
            });
            templateBeautiful = templateBeautiful.trim();

            var container = $("<h2/>").text("Eksport")
                .add($("<form/>").css({"width":"400px", "text-align":"center"})
                    .append($("<textarea/>").prop("id", "am_templater_textarea").css({"height":"300px", "width":"370px", "resize":"vertical"}).text(templateBeautiful))
                )
                .add("<span class=\"grey small\" style=\"float: right\"><b>Utworzony przez: AKZ123</b></span>");

            Dialog.show("am_templater", container);
            $("#popup_box_am_templater").css({"width":"400px"});
            $("#am_templater_textarea").focus().select();

        },
        import: function () {
            var importer = function () {
                $("#am_templater_errors").hide();
                try {
                    var templateUnparsed = $("#am_templater_textarea").val().trim();
                    var template = templateUnparsed.split("\n");

                    var autodemolish = template[0].match(/^autodemolish: (true|false)$/);
                    if(!autodemolish) {
                        throw "Wiersz 1: Nieprawidłowy format szablonu. Powinno być 'autodemolish: true' lub 'autodemolish: false'.";
                    }
                    var options = [];
                    $("#add_building option").each(function () {
                        options.push($(this).val());
                    });
                    var build_description = [];
                    for(var i = 1; i < template.length; i++) {
                        if(template[i].match(/^\s*$/)) {
                            continue;
                        }

                        var data = template[i].match(/^\s*([a-zA-Z]+)(\s+([1-9]\d*))?\s*$/);

                        if(!data) {
                            console.error("<Wiersz " + (i+1) + "> Nieprawidłowy format (" + template[i] + ")");
                            continue;
                        }
                        if(options.indexOf(data[1]) == -1) {
                            console.log("<Wiersz " + (i+1) + "> Nieprawidłowa nazwa budynku (" + data[1] + ")");
                            continue;
                        }

                        var description = {
                            building: data[1],
                            relativeLevel: data[3] ? parseInt(data[3]) : 1
                        };
                        build_description << description;
                    }

                    switch(autodemolish[1]) {
                        case "true": $("#auto_demolish").prop("checked", true); break;
                        case "false": $("#auto_demolish").prop("checked", false); break;
                    }
                    $(".bqremove").click();
                    for(var i = 0; i < build_description.length; i++) {
                        $("#add_building").val(build_description.building);
                        $("#add_levels").val(build_description.relativeLevel);
                        $("#add_building").closest("form").submit();
                    }
                } catch(error) {
                    $("#am_templater_errors").text(error).show();
                }
            };

            $("#am_templater_errors").hide();
            var container = $("<h2/>").text("Import")
                .add($("<div/>").prop("id", "am_templater_errors").addClass("vis").css({"display":"none", "color":"#ff0000", "border-color":"#ff0000", "padding":"5px"}))
                .add($("<form/>").css({"width":"400px", "text-align":"center"})
                    .append($("<textarea/>").prop("id", "am_templater_textarea").css({"height":"300px", "width":"370px", "resize":"vertical"}))
                    .append($("<button/>", {type:"button"}).text("Importuj").click(importer))
                )
                .add("<span class=\"grey small\" style=\"float: right\"><b>Utworzony przez: AKZ123</b></span>");

            Dialog.show("am_templater", container);
            $("#popup_box_am_templater").css({"width":"400px"});
            $("#am_templater_textarea").focus();
        },
        transform: function (transformation) {
            if("string" != typeof transformation || transformation != "collapse" && transformation != "expand") {
                transformation = "collapse";
            }

            var template = [];
            $("#content_value").find("#template_queue li").each(function () {
                var building = $(this).find("a").prop("class").match(/building-([a-zA-Z]+)/)[1];
                var levelRelative = parseInt($(this).find("span.level_relative").text().match(/\d+/)[0]);
                template.push(building + " +" + levelRelative);
            });

            for(var i = 1; i < template.length;) {
                var previous = template[i-1].match(/([a-zA-Z]+)\s\+(\d+)/);
                var previousBuilding = previous[1];
                var previousRelativeLevel = parseInt(previous[2]);

                var current = template[i].match(/([a-zA-Z]+)\s\+(\d+)/);
                var currentBuilding = current[1];
                var currentRelativeLevel = parseInt(current[2]);

                if(previousBuilding == currentBuilding) {
                    template[i-1] = previousBuilding + " +" + (previousRelativeLevel + currentRelativeLevel) + "\n";
                    template.splice(i, 1);
                } else {
                    i++;
                }
            }

            $(".bqremove").click();
            for(var i = 0; i < template.length; i++) {
                var data = template[i].match(/([a-zA-Z]+)\s\+(\d+)/);
                var building = data[1];
                var relativeLevel = parseInt(data[2]);

                $("#add_building").val(building);
                switch(transformation) {
                    case "expand":
                        $("#add_levels").val(1);
                        for(var j = 0; j < relativeLevel; j++) {
                            $("#add_building").closest("form").submit();
                        }
                        break;
                    case "collapse":
                        $("#add_levels").val(relativeLevel);
                        $("#add_building").closest("form").submit();
                        break;
                }
            }
        }
    };
}

AMTemplater.init();

void(0);
