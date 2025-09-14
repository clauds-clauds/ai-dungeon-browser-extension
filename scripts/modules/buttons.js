'use strict';

function onCharactersClick() {
    setupCharacterEditor();
}

function onNotesClick() {
    setupNotesEditor();
}

function onSettingsClick() {
    setupSettingsEditor();
}

function onShareClick() {
    setupShareEditor();
    console.log("Share button clicked.");
}

function onScriptsClick() {
    window.open('https://help.aidungeon.com/what-are-scripts-and-how-do-you-install-them', '_blank');
}

function onHelpClick() {
    window.open('https://help.aidungeon.com/faq', '_blank');
}

function onLanguageClick() {
    window.open('https://github.com/LewdLeah/Localized-Languages', '_blank');
}

function onBugsClick() {
    window.open('https://github.com/clauds-clauds/ai-dungeon-browser-extension-public/issues', '_blank');
}

async function onRefreshClick() {
    refreshAll();
}