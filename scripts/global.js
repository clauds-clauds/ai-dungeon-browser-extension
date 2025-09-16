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

function sanitizeColor(color) {
    if (!color) return null;
    const s = new Option().style;
    s.color = color;
    if (s.color) {
        return color;
    }
    return null;
}

function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    const temp = document.createElement('div');
    temp.innerHTML = str;
    return temp.textContent || "";
}

async function resizeImage(dataUrl, width, height, quality = 1.0) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            const sourceSize = Math.min(img.width, img.height);

            const sx = (img.width - sourceSize) / 2;
            const sy = (img.height - sourceSize) / 2;

            ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, width, height);

            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = (err) => {
            reject(err);
        };
        img.src = dataUrl;
    });
}

function injectSymbols() {
    const injectId = IDENTIFIERS.FONT_INJECT;
    if (!document.getElementById(injectId)) {
        const browserApi = typeof browser !== 'undefined' ? browser : chrome;
        const fontURL = browserApi.runtime.getURL("resources/fonts/material_symbols_rounded.ttf");

        const fontStyleSheet = document.createElement("style");
        fontStyleSheet.id = injectId;
        fontStyleSheet.textContent = `
        @font-face {
            font-family: 'Material Symbols Rounded';
            font-style: normal;
            font-weight: 100 700;
            src: url('${fontURL}') format('truetype');
        }
        `;
        document.head.appendChild(fontStyleSheet);
    }
}
