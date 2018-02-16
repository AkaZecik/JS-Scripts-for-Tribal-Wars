TribalWars.get("groups", {ajax: "load_groups"}, function (groups) {
    window.dispatchEvent(new CustomEvent("GotGameData", {
        detail: {
            currentGroup: groups.group_id,
            hostname: "https://" + window.location.hostname
        }
    }));
});
