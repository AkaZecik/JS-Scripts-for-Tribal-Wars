TribalWars.get("groups", {ajax: "load_groups"}, function (groups) {
	window.dispatchEvent(new CustomEvent("GameData", {detail: {gameData: game_data, groups: groups, hostname: "https://" + window.location.hostname}}));
});
