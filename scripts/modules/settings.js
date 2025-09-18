'use strict';

function applySettingsStyles() {
    const styleId = 'character-highlight-styles';
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
    }

    const size = parseInt(dataStore.settings.portraitSize, 10) || 28;
    const radius = parseInt(dataStore.settings.borderRadius, 10) || 0;
    const width = parseInt(dataStore.settings.borderWidth, 10) || 0;

    styleElement.textContent = `
        .character-portrait {
            width: ${size}px !important;
            height: ${size}px !important;
            border-radius: ${radius}% !important;
            border: ${width}px solid rgba(255, 255, 255, .3) !important;
        }
    `;
}

async function loadSettingsFromStorage() {
    const data = await chrome.storage.local.get('extensionSettings');
    // Merge stored settings into our dataStore, overwriting defaults
    Object.assign(dataStore.settings, data.extensionSettings);
}

function populateSettingsForm() {
    const form = document.getElementById('settings-form');
    if (!form) return;

    document.getElementById('setting-default-color').value = dataStore.settings.defaultColor;
    document.getElementById('setting-shared-color').value = dataStore.settings.sharedColor;
    document.getElementById('setting-portrait-size').value = dataStore.settings.portraitSize;

    document.getElementById('setting-border-radius').value = dataStore.settings.borderRadius;
    document.getElementById('setting-border-width').value = dataStore.settings.borderWidth;

    document.getElementById('setting-autosave').checked = dataStore.settings.autoSaveEnabled;
    document.getElementById('setting-autosize').checked = dataStore.settings.autoResizeEnabled;

    document.getElementById('setting-default-note-color').value = dataStore.settings.defaultNoteColor;

    document.getElementById('info-adventure-id').textContent = getAdventureId() || 'N/A';
    document.getElementById('info-plugin-version').textContent = "Alpha " + chrome.runtime.getManifest().version;
}

async function saveSettings(event) {
    if (event) {
        event.preventDefault();
    }

    dataStore.settings.defaultColor = document.getElementById('setting-default-color').value;
    dataStore.settings.sharedColor = document.getElementById('setting-shared-color').value;
    dataStore.settings.portraitSize = document.getElementById('setting-portrait-size').value;

    dataStore.settings.borderRadius = document.getElementById('setting-border-radius').value;
    dataStore.settings.borderWidth = document.getElementById('setting-border-width').value;

    dataStore.settings.autoSaveEnabled = document.getElementById('setting-autosave').checked;
    dataStore.settings.autoResizeEnabled = document.getElementById('setting-autosize').checked;
    dataStore.settings.defaultNoteColor = document.getElementById('setting-default-note-color').value;

    await chrome.storage.local.set({ extensionSettings: dataStore.settings });
    applySettingsStyles();
}

async function setupSettingsEditor() {
    let panel = document.getElementById('settings-editor-panel');
    makePageInert();
    if (!panel) {
        panel = await injectPanel('resources/editor_settings.html');
        const form = document.getElementById('settings-form');

        panel.addEventListener('click', e => { if (e.target === panel) closePanel('settings-editor-panel', true); });
        form.addEventListener('submit', saveSettings);

        form.addEventListener('input', (event) => {
            if (event.target.id === 'setting-autosave') {
                saveSettings();
            } else if (dataStore.settings.autoSaveEnabled) {
                saveSettings();
            }
        });
    }

    await loadSettingsFromStorage();
    populateSettingsForm();
    applySettingsStyles();

    setTimeout(() => panel.classList.add('visible'), 10);
}
