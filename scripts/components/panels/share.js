'use strict';

class Share extends Panel {
    static async onExportClick() {
        const adventureId = Utils.getAdventureId();
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

    static async onJSONImportAID(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const storyCards = JSON.parse(e.target.result);
                if (!Array.isArray(storyCards)) {
                    throw new Error("Invalid story card format. Expected an array of cards.");
                }

                const adventureId = Utils.getAdventureId();
                if (!adventureId) {
                    alert("No active adventure found to import data into.");
                    return;
                }

                const existingCharsData = await chrome.storage.local.get(adventureId);
                const existingChars = existingCharsData[adventureId] || [];
                const existingCharNames = existingChars.map(c => c.name.toLowerCase());

                const newChars = [];
                for (const card of storyCards) {
                    if (card.type === 'character' && card.title) {
                        const name = card.title.trim();
                        if (!name || existingCharNames.includes(name.toLowerCase())) {
                            continue; // Skip if name is empty or already exists
                        }

                        const nicknames = (card.keys || '')
                            .split(',')
                            .map(key => key.trim())
                            .filter(key => key && key.toLowerCase() !== name.toLowerCase());

                        newChars.push({
                            id: crypto.randomUUID(),
                            name: name,
                            nicknames: nicknames,
                            portraits: [],
                            activePortraitIndex: 0,
                            color: Store.data.settings.defaultColor,
                            colorMode: 'shared',
                            pickMode: 'trigger',
                        });
                        existingCharNames.push(name.toLowerCase());
                    }
                }

                if (newChars.length === 0) {
                    alert("No new characters found to import.");
                    return;
                }

                const mergedChars = [...existingChars, ...newChars];
                await chrome.storage.local.set({ [adventureId]: mergedChars });

                alert(`Successfully imported ${newChars.length} new character(s). The page will now reload.`);
                window.location.reload();

            } catch (error) {
                alert(`Story Card import failed: ${error.message}`);
            }
        };
        reader.readAsText(file);
    }

    static async onJSONImportMerge(importObject, adventureId) {
        const existingCharsData = await chrome.storage.local.get(adventureId);
        const existingNotesData = await chrome.storage.local.get(`notes_${adventureId}`);

        const existingChars = existingCharsData[adventureId] || [];
        const existingNotes = existingNotesData[`notes_${adventureId}`] || [];

        const newChars = importObject.data.characters.map((char, index) => ({
            ...char,
            id: crypto.randomUUID()
        }));

        const newNotes = importObject.data.notes.map((note, index) => ({
            ...note,
            id: crypto.randomUUID()
        }));

        const mergedChars = [...existingChars, ...newChars];
        const mergedNotes = [...existingNotes, ...newNotes];

        await chrome.storage.local.set({ [adventureId]: mergedChars });
        await chrome.storage.local.set({ [`notes_${adventureId}`]: mergedNotes });
    }

    static async onJSONImportReplace(importObject, adventureId) {
        if (confirm("This will overwrite all your stuff for this adventure. Are you sure?")) {
            await chrome.storage.local.set({ [adventureId]: importObject.data.characters });
            await chrome.storage.local.set({ [`notes_${adventureId}`]: importObject.data.notes });
            return true;
        }
        return false;
    }

    static onJSONImport(file, mode) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importObject = JSON.parse(e.target.result);

                if (mode === 'card') {
                    await Share.onJSONImportAID(file);
                    return;
                }

                const sanitizedObject = Utils.sanitizeImportedJSON(importObject);

                const adventureId = Utils.getAdventureId();
                if (!adventureId) {
                    alert("No active adventure found to import data into.");
                    return;
                }

                let successful = false;

                if (mode === 'merge') {
                    await Share.onJSONImportMerge(sanitizedObject, adventureId);
                    successful = true;
                } else if (mode === 'replace') {
                    successful = await Share.onJSONImportReplace(sanitizedObject, adventureId);
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

    static async show() {
        let panel = Panel.prepare('share-editor-panel');

        if (!panel) {
            Utils.printNeat('Injecting share panel.');
            panel = await Inject.panel('resources/panels/share_panel.html');

            document.getElementById('share-back-to-menu-btn').addEventListener('click', () => {
                Panel.close('share-editor-panel');
                setTimeout(Menu.show, Config.TIME_DELAY_SWITCH);
            });

            let importMode = 'replace';

            panel.addEventListener('click', e => { if (e.target === panel) Panel.close('share-editor-panel'); });
            document.getElementById('export-data-btn').addEventListener('click', Share.onExportClick);

            const importStoryCardBtn = document.getElementById('import-story-card-btn');
            const importMergeBtn = document.getElementById('import-merge-data-btn');
            const importReplaceBtn = document.getElementById('import-data-btn');
            const fileInput = document.getElementById('import-file-input');

            importStoryCardBtn.addEventListener('click', () => {
                Utils.printNeat('Importing from story cards.');
                importMode = 'card';
                fileInput.click();
            });

            importMergeBtn.addEventListener('click', () => {
                Utils.printNeat('Importing and merging.');
                importMode = 'merge';
                fileInput.click();
            });

            importReplaceBtn.addEventListener('click', () => {
                Utils.printNeat('Importing and replacing.');
                importMode = 'replace';
                fileInput.click();
            });

            fileInput.addEventListener('change', (event) => {
                Share.onJSONImport(event.target.files[0], importMode);
                event.target.value = '';
            });
        }
        setTimeout(() => panel.classList.add('visible'), 10);
    }
}