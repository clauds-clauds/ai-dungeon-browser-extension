'use strict';

let characterData = [];

// This gets the little adventure stuff thingy from the URL.
// Used to save information specific to one adventure. Should probably add exporting, huh?
function getAdventureId() {
    const match = window.location.pathname.match(/adventure\/([^\/]+)/);
    return match ? match[1] : null;
}

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function closePanel(id, refreshHighlights = false) {
    const panel = document.getElementById(id);
    if (panel) panel.classList.remove('visible');
    makePageInteractive();

    // This is used for the settings panel, I could do it every save but performance and all that.
    if (refreshHighlights) reapplyAllHighlights();
}

function makePageInert() {
    const selectors = 'body > div, body > main, body > header, body > footer';
    const panelSelectors = '#notes-editor-panel, #settings-editor-panel, #character-editor-panel, #share-editor-panel';

    document.querySelectorAll(selectors).forEach(element => {
        if (!element.closest(panelSelectors) && !element.querySelector(panelSelectors)) {
            element.setAttribute('inert', '');
        }
    });
}

function makePageInteractive() {
    document.querySelectorAll('[inert]').forEach(element => {
        element.removeAttribute('inert');
    });
}

async function refreshAll() {
    await loadSettingsFromStorage();
    await loadCharacterData();
    applySettingsStyles();
    reapplyAllHighlights();
}
