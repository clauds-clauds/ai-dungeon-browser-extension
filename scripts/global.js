'use strict';

function getAdventureId() {
    const match = window.location.pathname.match(/adventure\/([^\/]+)/);
    return match ? match[1] : null;
}

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
        img.onerror = reject;
        img.src = dataUrl;
    });
}

function makePageInert(excludePanelId) {
    document.getElementById('extension-backdrop')?.classList.add('visible');

    const selectors = 'body > div, body > main, body > header, body > footer';
    document.querySelectorAll(selectors).forEach(element => {
        if (element.id !== excludePanelId && !element.querySelector(`#${excludePanelId}`)) {
            element.setAttribute('inert', '');
        }
    });
}

function makePageInteractive() {
    document.getElementById('extension-backdrop')?.classList.remove('visible');

    document.querySelectorAll('[inert]').forEach(element => {
        element.removeAttribute('inert');
    });
}

function sanitizeUrl(url) {
    if (!url) return '';
    
    const validStarts = [
        'https://',
        'http://',
        'data:image/png;base64,',
        'data:image/jpeg;base64,',
        'data:image/gif;base64,',
        'data:image/webp;base64,'
    ];

    if (validStarts.some(start => url.startsWith(start))) {
        return url;
    }

    return '';
}

function sanitizeColor(color) {
    if (!color) return null;
    const s = new Option().style;
    s.color = color;
    return s.color ? color : null;
}

function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, 'text/html');
    return doc.body.textContent || "";
}

async function refreshAll() {
    await loadSettingsFromStorage();
    await loadCharacterData();
    applySettingsStyles();
    reapplyAllHighlights();
}

function closePanel(id, refreshHighlights = false) {
    const panel = document.getElementById(id);
    if (panel) panel.classList.remove('visible');
    makePageInteractive();
    if (refreshHighlights) reapplyAllHighlights();
}

async function injectPanel(filePath) {
    const url = chrome.runtime.getURL(filePath);
    const html = await (await fetch(url)).text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const panel = doc.querySelector('div');
    if (panel) document.body.appendChild(panel);
    return panel;
}

function injectSymbols() {
    const injectId = IDENTIFIERS.FONT_INJECT;
    if (!document.getElementById(injectId)) {
        const browserApi = typeof browser !== 'undefined' ? browser : chrome;
        const fontURL = browserApi.runtime.getURL("resources/fonts/material_symbols_rounded.ttf");
        const fontStyleSheet = document.createElement("style");
        fontStyleSheet.id = injectId;
        fontStyleSheet.textContent = `@font-face { font-family: 'Material Symbols Rounded'; font-style: normal; font-weight: 100 700; src: url('${fontURL}') format('truetype'); }`;
        document.head.appendChild(fontStyleSheet);
    }
}

function injectTooltip() {
    if (document.getElementById('portrait-hover-tooltip')) return;
    const tooltip = document.createElement('div');
    tooltip.id = 'portrait-hover-tooltip';

    const img = document.createElement('img');
    const prevBtn = document.createElement('button');
    prevBtn.id = 'tooltip-prev-btn';
    prevBtn.className = 'tooltip-nav-btn';
    prevBtn.innerHTML = '<span class="material-symbols-rounded">arrow_back_ios</span>';

    const nextBtn = document.createElement('button');
    nextBtn.id = 'tooltip-next-btn';
    nextBtn.className = 'tooltip-nav-btn';
    nextBtn.innerHTML = '<span class="material-symbols-rounded">arrow_forward_ios</span>';

    tooltip.appendChild(img);
    tooltip.appendChild(prevBtn);
    tooltip.appendChild(nextBtn);
    document.body.appendChild(tooltip);
}

function injectBackdrop() {
    if (document.getElementById('extension-backdrop')) return;
    const backdrop = document.createElement('div');
    backdrop.id = 'extension-backdrop';
    document.body.appendChild(backdrop);
}
