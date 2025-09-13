'use strict';

async function handleExport() {
    const adventureId = getAdventureId();
    if (!adventureId) {
        alert("No active adventure found.");
        return;
    }

    const characterData = await chrome.storage.local.get(adventureId);
    const notesData = await chrome.storage.local.get(`notes_${adventureId}`);

    const exportObject = {
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

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importObject = JSON.parse(e.target.result);

            if (!importObject.data || !importObject.data.characters || !importObject.data.notes) {
                throw new Error("Invalid file format.");
            }

            const adventureId = getAdventureId();
            if (!adventureId) {
                alert("No active adventure found to import data into.");
                return;
            }

            if (confirm("This will overwrite all characters and notes for this adventure. Are you sure?")) {
                await chrome.storage.local.set({ [adventureId]: importObject.data.characters });
                await chrome.storage.local.set({ [`notes_${adventureId}`]: importObject.data.notes });

                alert("Import successful! The page will now reload to apply changes.");
                window.location.reload();
            }
        } catch (error) {
            alert(`Import failed: ${error.message}`);
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

async function setupShareEditor() {
    let panel = document.getElementById('share-editor-panel');
    if (!panel) {
        const editorUrl = chrome.runtime.getURL('resources/editor_share.html');
        const editorHtml = await (await fetch(editorUrl)).text();
        document.body.insertAdjacentHTML('beforeend', editorHtml);
        panel = document.getElementById('share-editor-panel');

        panel.addEventListener('click', e => { if (e.target === panel) closePanel('share-editor-panel'); });
        document.getElementById('export-data-btn').addEventListener('click', handleExport);

        const importBtn = document.getElementById('import-data-btn');
        const fileInput = document.getElementById('import-file-input');
        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleImport);
    }

    setTimeout(() => panel.classList.add('visible'), 10);
}