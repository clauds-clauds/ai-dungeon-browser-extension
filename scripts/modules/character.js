'use strict';

let characterState = { characters: [], editingId: null };

async function loadCharacterData() {
    const adventureId = getAdventureId();
    if (!adventureId) {
        characterData = [];
        return;
    }
    const storageData = await chrome.storage.local.get(adventureId);
    characterData = storageData[adventureId] || [];
}

async function saveCharacters() {
    const adventureId = getAdventureId();
    if (!adventureId) return;
    await chrome.storage.local.set({ [adventureId]: characterState.characters });
}

function renderCharacterList(charactersToRender = characterState.characters) {
    const listEl = document.getElementById('character-list');
    listEl.innerHTML = '';

    charactersToRender.forEach(char => {
        const item = document.createElement('li');
        item.dataset.id = char.id;

        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle material-symbols-rounded';
        dragHandle.textContent = 'drag_indicator';

        const portrait = document.createElement('img');
        portrait.src = sanitizeUrl(char.portraitUrl);
        portrait.style.borderRadius = extensionSettings.borderRadius + '%';
        portrait.alt = char.name;

        const nameSpan = document.createElement('span');
        const colorToApply = char.colorMode === "special" ? char.color : extensionSettings.sharedColor;
        nameSpan.style.color = sanitizeColor(colorToApply) || 'inherit';
        nameSpan.textContent = char.name;

        item.appendChild(dragHandle);
        item.appendChild(portrait);
        item.appendChild(nameSpan);

        dragHandle.addEventListener('mousedown', e => e.stopPropagation());
        item.addEventListener('click', () => showFormView(char.id));
        listEl.appendChild(item);
    });
}

function showListView() {
    document.getElementById('character-list-view').style.display = 'flex';
    document.getElementById('character-form-view').style.display = 'none';
    document.getElementById('char-search-input').value = '';
    renderCharacterList();
}

function showFormView(characterId = null) {
    characterState.editingId = characterId;
    const form = document.getElementById('character-form');
    const title = document.getElementById('form-title');
    const deleteBtn = document.getElementById('delete-char-btn');
    const portraitPreview = document.getElementById('char-portrait-preview');

    form.reset();
    if (portraitPreview) {
        portraitPreview.src = '';
        portraitPreview.style.display = 'none';
    }

    if (characterId) {
        const char = characterState.characters.find(c => c.id === characterId);
        title.textContent = 'Edit Character';
        document.getElementById('char-name').value = char.name;
        document.getElementById('char-nicknames').value = (char.nicknames || []).join(', ');
        document.getElementById('char-color').value = char.color;
        document.getElementById('char-color-mode').value = char.colorMode;
        if (portraitPreview && char.portraitUrl) {
            portraitPreview.src = sanitizeUrl(char.portraitUrl);
            portraitPreview.style.display = 'block';
        }
        deleteBtn.classList.remove('hidden');
    } else {
        title.textContent = 'Add Character';
        document.getElementById('char-color').value = extensionSettings.defaultColor;
        deleteBtn.classList.add('hidden');
    }

    document.getElementById('character-list-view').style.display = 'none';
    document.getElementById('character-form-view').style.display = 'flex';
}

async function saveCharacterForm() {
    const form = document.getElementById('character-form');
    if (!form || form.offsetParent === null) return;

    const name = document.getElementById('char-name').value;
    if (!name.trim()) return;

    const getPortraitUrl = () => {
        return new Promise((resolve) => {
            const fileInput = document.getElementById('char-portrait-file');
            const file = fileInput.files[0];
            if (!file) {
                const existingChar = characterState.characters.find(c => c.id === characterState.editingId);
                resolve(existingChar ? existingChar.portraitUrl : null);
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                if (extensionSettings.autoResizeEnabled) {
                    const resizedDataUrl = await resizeImage(e.target.result, 64, 64, 'image/png');
                    resolve(resizedDataUrl);
                } else {
                    resolve(e.target.result);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const portraitUrl = await getPortraitUrl();

    const formData = {
        name: document.getElementById('char-name').value,
        nicknames: document.getElementById('char-nicknames').value.split(',').map(n => n.trim()).filter(Boolean),
        color: document.getElementById('char-color').value,
        colorMode: document.getElementById('char-color-mode').value,
        portraitUrl: portraitUrl
    };

    if (characterState.editingId) {
        const char = characterState.characters.find(c => c.id === characterState.editingId);
        if (char) {
            Object.assign(char, formData);
        }
    } else {
        const newId = Date.now();
        characterState.characters.push({ id: newId, ...formData });
        characterState.editingId = newId;
    }

    await saveCharacters();
}

async function handleSave(event) {
    event.preventDefault();
    await saveCharacterForm();
    showListView();
}

async function handleDelete() {
    if (confirm('Are you sure you want to delete this character?')) {
        characterState.characters = characterState.characters.filter(c => c.id !== characterState.editingId);
        await saveCharacters();
        showListView();
    }
}

async function setupCharacterEditor() {
    let panel = document.getElementById('character-editor-panel');
    makePageInert();
    if (!panel) {
        panel = await injectPanel('resources/editor_character.html');

        panel.addEventListener('click', e => {
            if (e.target === panel) {
                if (extensionSettings.autoSaveEnabled) saveCharacterForm();
                closePanel('character-editor-panel', true);
            }
        });

        document.getElementById('show-add-form-btn').addEventListener('click', () => showFormView());
        document.getElementById('character-form').addEventListener('submit', handleSave);

        document.getElementById('back-to-list-btn').addEventListener('click', () => {
            if (extensionSettings.autoSaveEnabled) saveCharacterForm();
            showListView();
        });

        document.getElementById('delete-char-btn').addEventListener('click', handleDelete);

        document.getElementById('char-search-input').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredChars = characterState.characters.filter(char =>
                char.name.toLowerCase().includes(searchTerm) ||
                (char.nicknames || []).some(nick => nick.toLowerCase().includes(searchTerm))
            );
            renderCharacterList(filteredChars);
        });

        const listEl = document.getElementById('character-list');
        new Sortable(listEl, {
            animation: 150,
            handle: '.drag-handle',
            forceFallback: true,
            onEnd: async (evt) => {
                const [movedItem] = characterState.characters.splice(evt.oldIndex, 1);
                characterState.characters.splice(evt.newIndex, 0, movedItem);
                await saveCharacters();
            }
        });
    }

    await loadCharacterData();
    characterState.characters = characterData;
    showListView();
    setTimeout(() => panel.classList.add('visible'), 10);
}