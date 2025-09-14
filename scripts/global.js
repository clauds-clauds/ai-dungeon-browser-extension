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

function sanitizeUrl(url) {
    if (!url) return '';
    const validStarts = ['https://', 'http://', 'data:image/'];
    if (validStarts.some(start => url.startsWith(start))) {
        return url;
    }
    return '';
}

async function resizeImage(dataUrl, width, height, quality = 1.0) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = (err) => {
            reject(err);
        };
        img.src = dataUrl;
    });
}