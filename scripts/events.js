"use strict";

class Events {
    static onCharactersClick() {
        Character.show();
    }

    static onNotesClick() {
        Notes.show();
    }

    static onSettingsClick() {
        Settings.show();
    }

    static onShareClick() {
        Share.show();
    }

    static onScriptsClick() {
        window.open('https://help.aidungeon.com/what-are-scripts-and-how-do-you-install-them', '_blank');
    }

    static onHelpClick() {
        window.open('https://help.aidungeon.com/faq', '_blank');
    }

    static onLanguageClick() {
        window.open('https://github.com/LewdLeah/Localized-Languages', '_blank');
    }

    static onBugsClick() {
        window.open('https://github.com/clauds-clauds/ai-dungeon-browser-extension-public/issues', '_blank');
    }

    static async onRefreshClick() {
        await Utils.hardRefresh();
    }
}