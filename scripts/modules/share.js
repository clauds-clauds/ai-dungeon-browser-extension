'use strict';

function sanitizeAndValidateImportObject(importObject) {
    if (!importObject || typeof importObject.data !== 'object' ||
        !Array.isArray(importObject.data.characters) ||
        !Array.isArray(importObject.data.notes)) {
        throw new Error("Invalid file format or missing required data arrays.");
    }

    const sanitizedChars = importObject.data.characters.map((char, index) => {
        if (!char.id || !char.name) throw new Error(`Character at index ${index} is missing required 'id' or 'name'.`);
        return {
            ...char,
            name: sanitizeString(char.name),
            nicknames: (char.nicknames || []).map(sanitizeString),
            portraitUrl: sanitizeUrl(char.portraitUrl),
            color: sanitizeColor(char.color),
        };
    });

    const sanitizedNotes = importObject.data.notes.map((note, index) => {
        if (!note.id || typeof note.text === 'undefined') throw new Error(`Note at index ${index} is missing required 'id' or 'text'.`);
        return {
            ...note,
            text: sanitizeString(note.text),
            tags: (note.tags || []).map(sanitizeString),
            color: sanitizeColor(note.color),
        };
    });

    return {
        ...importObject,
        data: {
            characters: sanitizedChars,
            notes: sanitizedNotes,
        }
    };
}

async function handleExport() {
    const adventureId = getAdventureId();
    if (!adventureId) {
        alert("No active adventure found.");
        return;
    }

    const characterData = await chrome.storage.local.get(adventureId);
    const notesData = await chrome.storage.local.get(`notes_${adventureId}`);

    const exportObject = {
        extensionVersion: chrome.runtime.getManifest().version,
        adventureId: adventureId,
        exportedAt: new Date().toISOString(),
        data: {
            characters: characterData[adventureId] || [],
            notes: notesData[`notes_${adventureId}`] || []
        }
    };

    const jsonString = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `aid-adventure-${adventureId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function handleMergeImport(importObject, adventureId) {
    const existingCharsData = await chrome.storage.local.get(adventureId);
    const existingNotesData = await chrome.storage.local.get(`notes_${adventureId}`);

    const existingChars = existingCharsData[adventureId] || [];
    const existingNotes = existingNotesData[`notes_${adventureId}`] || [];

    const newChars = importObject.data.characters.map((char, index) => ({
        ...char,
        id: Date.now() + index
    }));
    const newNotes = importObject.data.notes.map((note, index) => ({
        ...note,
        id: Date.now() + index
    }));

    const mergedChars = [...existingChars, ...newChars];
    const mergedNotes = [...existingNotes, ...newNotes];

    await chrome.storage.local.set({ [adventureId]: mergedChars });
    await chrome.storage.local.set({ [`notes_${adventureId}`]: mergedNotes });
}

async function handleReplaceImport(importObject, adventureId) {
    if (confirm("This will overwrite all characters and notes for this adventure. Are you sure?")) {
        await chrome.storage.local.set({ [adventureId]: importObject.data.characters });
        await chrome.storage.local.set({ [`notes_${adventureId}`]: importObject.data.notes });
        return true;
    }
    return false;
}

function handleImport(file, mode) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importObject = JSON.parse(e.target.result);
            const sanitizedObject = sanitizeAndValidateImportObject(importObject); // New, might need additional testing if this interveres with user data somehow.

            const adventureId = getAdventureId();
            if (!adventureId) {
                alert("No active adventure found to import data into.");
                return;
            }

            let successful = false;

            if (mode === 'merge') {
                await handleMergeImport(sanitizedObject, adventureId);
                successful = true;
            } else if (mode === 'replace') {
                successful = await handleReplaceImport(sanitizedObject, adventureId);
            }

            if (successful) {
                alert("Import successful! The page will now reload to apply changes.");
                window.location.reload();
            }
        } catch (error) {
            alert(`Import failed: ${error.message}`);
        }
    };
    reader.readAsText(file);
}

async function setupShareEditor() {
    let panel = document.getElementById('share-editor-panel');
    makePageInert();
    if (!panel) {
        const editorUrl = chrome.runtime.getURL('resources/editor_share.html');
        const editorHtml = await (await fetch(editorUrl)).text();
        document.body.insertAdjacentHTML('beforeend', editorHtml);
        panel = document.getElementById('share-editor-panel');

        let importMode = 'replace';

        panel.addEventListener('click', e => { if (e.target === panel) closePanel('share-editor-panel'); });
        document.getElementById('export-data-btn').addEventListener('click', handleExport);

        const importMergeBtn = document.getElementById('import-merge-data-btn');
        const importReplaceBtn = document.getElementById('import-data-btn');
        const fileInput = document.getElementById('import-file-input');

        importMergeBtn.addEventListener('click', () => {
            importMode = 'merge';
            fileInput.click();
        });

        importReplaceBtn.addEventListener('click', () => {
            importMode = 'replace';
            fileInput.click();
        });

        fileInput.addEventListener('change', (event) => {
            handleImport(event.target.files[0], importMode);
            event.target.value = '';
        });
    }
    setTimeout(() => panel.classList.add('visible'), 10);
}