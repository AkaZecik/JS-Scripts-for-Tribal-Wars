window.dispatchEvent(new CustomEvent("GotSitter", {
    detail: {
        playerID: game_data.player.id
    }
}));
