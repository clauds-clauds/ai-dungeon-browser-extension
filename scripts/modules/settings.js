'use strict';

let extensionSettings = {
    defaultColor: '#c8aa64',
    deadColor: '#c8aa64',
    portraitSize: 22,
    borderRadius: 10,
    notesPerPage: 30,
    defaultNoteColor: '#3a4045',
    autoSaveEnabled: true,
    autoResizeEnabled: true
};

function applySettingsStyles() {
    const styleId = 'character-highlight-styles';
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
    }
    styleElement.textContent = `
        .character-portrait {
            width: ${extensionSettings.portraitSize}px;
            height: ${extensionSettings.portraitSize}px;
            border-radius: ${extensionSettings.borderRadius}%;
        }
    `;
}

async function loadSettingsFromStorage() {
    const data = await chrome.storage.local.get('extensionSettings');
    Object.assign(extensionSettings, data.extensionSettings);
}

function populateSettingsForm() {
    const form = document.getElementById('settings-form');
    if (!form) return;

    document.getElementById('setting-default-color').value = extensionSettings.defaultColor;
    document.getElementById('setting-dead-color').value = extensionSettings.deadColor;
    document.getElementById('setting-portrait-size').value = extensionSettings.portraitSize;
    document.getElementById('setting-border-radius').value = extensionSettings.borderRadius;

    document.getElementById('setting-autosave').checked = extensionSettings.autoSaveEnabled;
    document.getElementById('setting-autosize').checked = extensionSettings.autoResizeEnabled;

    document.getElementById('info-adventure-id').textContent = getAdventureId() || 'N/A';
    document.getElementById('info-plugin-version').textContent = "Alpha " + chrome.runtime.getManifest().version;
}

async function saveSettings(event) {
    if (event) {
        event.preventDefault();
    }

    extensionSettings.defaultColor = document.getElementById('setting-default-color').value;
    extensionSettings.deadColor = document.getElementById('setting-dead-color').value;
    extensionSettings.portraitSize = document.getElementById('setting-portrait-size').value;
    extensionSettings.borderRadius = document.getElementById('setting-border-radius').value;
    extensionSettings.autoSaveEnabled = document.getElementById('setting-autosave').checked;
    extensionSettings.autoResizeEnabled = document.getElementById('setting-autosize').checked;

    await chrome.storage.local.set({ extensionSettings });
    applySettingsStyles();

    /*
    const saveBtn = document.getElementById('save-settings-btn');
    saveBtn.style.backgroundColor = 'var(--c-healthBarGreen, #22c55e)';
    setTimeout(() => { saveBtn.style.backgroundColor = 'transparent'; }, 1000); */
}

async function setupSettingsEditor() {
    let panel = document.getElementById('settings-editor-panel');
    makePageInert();
    if (!panel) {
        const editorUrl = chrome.runtime.getURL('resources/editor_settings.html');
        const editorHtml = await (await fetch(editorUrl)).text();
        document.body.insertAdjacentHTML('beforeend', editorHtml);
        panel = document.getElementById('settings-editor-panel');
        const form = document.getElementById('settings-form');

        panel.addEventListener('click', e => { if (e.target === panel) closePanel('settings-editor-panel', true); });
        form.addEventListener('submit', saveSettings);

        form.addEventListener('input', (event) => {
            if (event.target.id === 'setting-autosave') {
                saveSettings();
            } else if (extensionSettings.autoSaveEnabled) {
                saveSettings();
            }
        });
    }

    await loadSettingsFromStorage();
    populateSettingsForm();
    applySettingsStyles();

    setTimeout(() => panel.classList.add('visible'), 10);
}