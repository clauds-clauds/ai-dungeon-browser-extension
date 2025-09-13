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

function closePanel(id) {
    const panel = document.getElementById(id);
    if (panel) panel.classList.remove('visible');
}