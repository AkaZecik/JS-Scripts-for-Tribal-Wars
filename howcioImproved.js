javascript:

if("undefined" == typeof NotesMaker) {
    var NotesMaker = {
        unitsNames: {
            spear:      "Pik",
            sword:      "Miecz", 
            axe:        "Topór",
            archer:     "Łuk",
            spy:        "Zwiad",
            light:      "LK",
            marcher:    "ŁK",
            heavy:      "CK",
            ram:        "Taran",
            catapult:   "Katas",
            knight:     "Rycerz",
            snob:       "Gruby",
            militia:    "Chłop"
        },
        init: function () {
            try {
                if(game_data.screen != "report" || !window.location.href.match(/view=\d+/)) {
                    throw "Wejdź w raport i dopiero uruchom skrypt!";
                }
                if($(".report_ReportAttack").length == 0) {
                    throw "To nie jest raport z ataku!";
                }

                var attackersName = $("table#attack_info_att tr").eq(0).find("th").eq(1).find("a").text().trim();
                var defendersName = $("table#attack_info_def tr").eq(0).find("th").eq(1).find("a").text().trim();

                switch(game_data.player.name) {
                    case attackersName: NotesMaker.makeNoteAs("att"); break;
                    case defendersName: NotesMaker.makeNoteAs("def"); break;
                    default: NotesMaker.decideWhoToMakeNoteAs(); break;
                }
            } catch (error) {
                console.log(error);
                UI.ErrorMessage(error);
            }
        },
        decideWhoToMakeNoteAs: function () {

        },
        makeNoteAs: function (type) {
            var counterType = (type == "att" ? "def" : "att");
            var reportDate = $("td.report_ReportAttack").parent().prev().children().eq(1).text().trim();
            var villageID = parseInt($("#attack_info_" + counterType + " > tbody").children("tr").eq(1).children("td").eq(1).find("a").eq(0).prop("href").match(/id=(\d+)/)[1]);
            var unitsTable = NotesMaker.getUnitsTableOf(counterType);
            var flag = NotesMaker.getFlagOf(counterType);
            var bonuses = NotesMaker.getBonusesOf(counterType);
            var buildings = type == "att" ? NotesMaker.getBuildingsOfDefender() : "";
            var note = "Atak " + (type == "att" ? "na tę wioskę" : "z tej wioski") + " dnia [b]" + reportDate + "[/b]\n"
                + unitsTable + flag + bonuses + buildings + "\n[size=7]Notatka wykonana za pomocą skryptu napisanego przez [b]Howcio[/b][/size]";

            NotesMaker.saveNote(note, villageID);
        },
        getUnitsTableOf: function (type) {
            var troopsSent = $("table#attack_info_" + type + "_units tr");
            if(type == "def" && troopsSent.length == 0)
                return "\n[i]Żaden żołnierz nie wrócił żywy. Brak informacji o wojskach przeciwnika[/i]\n";
            var unitsLength = $(troopsSent).eq(0).find("td").length - 1;
            var tableRows = ["Jednostka:", (type == "att" ? "Wysłane:": "W obronie:"), "Zabite:\t", "\t", "Pozostałe:"];

            for(var i = 0; i < unitsLength; i++) {
                var unit = troopsSent.eq(0).find("td").eq(i+1).find("img").prop("src").match(/unit_([a-zA-Z]+)\.png$/)[1];
                var before = troopsSent.eq(1).find("td").eq(i+1).text();
                if(unit == "militia" && before == "0")
                    continue;
                var lost = troopsSent.eq(2).find("td").eq(i+1).text();
                var after = before - lost;
                tableRows[0] += "\t" + (NotesMaker.unitsNames[unit] || unit);
                tableRows[1] += "\t" + before;
                tableRows[2] += "\t" + lost;
                tableRows[3] += "\t-----";
                tableRows[4] += "\t" + after;
            }

            var unitsTableText = "[code]\n";
            for(var i = 0; i < tableRows.length; i++) {
                unitsTableText += tableRows[i] + "\n";
            }
            unitsTableText += "[/code]"

            return unitsTableText;
        },
        getFlagOf: function (type) {
            var flag = $("#attack_info_" + type + " > body").children("tr").filter(function () {
                return $(this).children("td").eq(0).text().match(/Flaga:/);
            }).children("td").eq(1).text().trim();

            if(flag != "")
                flag = ("Flaga: " + flag);

            return flag;
        },
        getBonusesOf: function (type) {
            var bonuses = [];
            $("#attack_info_" + type + " > tbody").children("tr").filter(function () {
                return $(this).children("td").eq(0).text().match(/Bonusy:/);
            }).children("td").eq(1).text().trim().split("\n").forEach(function (line) {
                var bonus = line.trim();
                bonus != "" && bonuses.push(bonus);
            });

            var bonusesText = "";
            for(var i = 0; i < bonuses.length; i++) {
                bonusesText += bonuses[i] + "\n";
            }

            if(bonusesText != "")
                bonusesText = "[spoiler=Bonusy " + (type == "att" ? "atakującego" : "obrońcy") + "]" + bonusesText.trim() + "[/spoiler]";

            return bonusesText;
        },
        getBuildingsOfDefender: function () {
            var buildings = [];
            return "";
        },
        saveNote: function (note, villageID) {
            TribalWars.post("info_village", {
                ajaxaction: "edit_notes",
                id: villageID
            }, {
                note: note
            }, function () {
                UI.SuccessMessage("Raport dodany do notatek");
            });
        }
    }
}

NotesMaker.init();

void(0);
