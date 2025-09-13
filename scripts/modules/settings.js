'use strict';

let extensionSettings = {
    defaultColor: '#f8ae2c',
    portraitSize: 22,
    borderRadius: 10,
    notesPerPage: 30,
    defaultNoteColor: '#3a4045'
};

function applySettingsStyles() {
    const styleId = 'character-highlight-styles';
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
    }

    // Use the loaded settings to generate the CSS stuff.
    styleElement.textContent = `
        .character-portrait {
            width: ${extensionSettings.portraitSize}px;
            height: ${extensionSettings.portraitSize}px;
            border-radius: ${extensionSettings.borderRadius}%;
        }
    `;
}

async function loadSettings() {
    const data = await chrome.storage.local.get('extensionSettings');
    Object.assign(extensionSettings, data.extensionSettings);

    document.getElementById('setting-default-color').value = extensionSettings.defaultColor;
    document.getElementById('setting-portrait-size').value = extensionSettings.portraitSize;
    document.getElementById('setting-border-radius').value = extensionSettings.borderRadius;

    document.getElementById('info-adventure-id').textContent = getAdventureId() || 'N/A';
    document.getElementById('info-plugin-version').textContent = chrome.runtime.getManifest().version;

    applySettingsStyles();
}


async function saveSettings(event) {
    event.preventDefault();
    extensionSettings.defaultColor = document.getElementById('setting-default-color').value;
    extensionSettings.portraitSize = document.getElementById('setting-portrait-size').value;
    extensionSettings.borderRadius = document.getElementById('setting-border-radius').value;

    await chrome.storage.local.set({ extensionSettings });

    applySettingsStyles();

    const saveBtn = document.getElementById('save-settings-btn');
    saveBtn.style.backgroundColor = 'var(--c-healthBarGreen, #22c55e)';
    setTimeout(() => { saveBtn.style.backgroundColor = 'transparent'; }, 1000);
}

function closeSettingsEditor() {
    const panel = document.getElementById('settings-editor-panel');
    if (panel) panel.classList.remove('visible');
}

async function setupSettingsEditor() {
    let panel = document.getElementById('settings-editor-panel');
    if (!panel) {
        const editorUrl = chrome.runtime.getURL('resources/editor_settings.html');
        const editorHtml = await (await fetch(editorUrl)).text();
        document.body.insertAdjacentHTML('beforeend', editorHtml);
        panel = document.getElementById('settings-editor-panel');

        // Add event listeners, I love event listeners listening.
        panel.addEventListener('click', e => { if (e.target === panel) closeSettingsEditor(); });
        document.getElementById('close-settings-btn').addEventListener('click', closeSettingsEditor);
        document.getElementById('settings-form').addEventListener('submit', saveSettings);
    }

    await loadSettings();
    setTimeout(() => panel.classList.add('visible'), 10);
}