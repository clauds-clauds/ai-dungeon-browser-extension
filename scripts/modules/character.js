'use strict';

function renderPortraitEditor(char) {
    const list = document.getElementById('portrait-list-editor');
    list.innerHTML = '';
    char.portraits.forEach((p, index) => addPortraitEditorItem(p, index === char.activePortraitIndex));
}

function addPortraitEditorItem(portraitData = {}, isActive = false) {
    const template = document.getElementById('portrait-editor-template');
    const clone = template.content.cloneNode(true);
    const item = clone.querySelector('li');
    const id = portraitData.id || Date.now() + Math.random();
    item.dataset.id = id;

    if (isActive) item.classList.add('active');

    const iconCard = item.querySelector('.portrait-card-icon');
    const iconImg = iconCard.querySelector('img');
    const iconInput = iconCard.querySelector('.icon-file-input');
    if (portraitData.iconUrl) iconImg.src = portraitData.iconUrl;

    const fullCard = item.querySelector('.portrait-card-full');
    const fullImg = fullCard.querySelector('img');
    const fullInput = fullCard.querySelector('.full-file-input');
    if (portraitData.fullUrl) fullImg.src = portraitData.fullUrl;

    const setupFileInput = (card, img, input, isIcon) => {
        card.addEventListener('click', () => input.click());
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                let finalUrl = event.target.result;
                if (isIcon) {
                    finalUrl = await resizeImage(finalUrl, 64, 64, 'image/jpeg');
                }
                img.src = finalUrl;
            };
            reader.readAsDataURL(file);
            input.value = '';
        });
    };

    setupFileInput(iconCard, iconImg, iconInput, true);
    setupFileInput(fullCard, fullImg, fullInput, false);

    item.querySelector('.delete-portrait-btn').addEventListener('click', () => item.remove());
    item.querySelector('.set-active-portrait-btn').addEventListener('click', () => {
        document.querySelectorAll('.portrait-editor-item.active').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
    });

    document.getElementById('portrait-list-editor').appendChild(item);
}

async function loadCharacterData() {
    const adventureId = getAdventureId();
    if (!adventureId) {
        dataStore.characters = [];
        return;
    }
    const storageData = await chrome.storage.local.get(adventureId);
    let characters = storageData[adventureId] || [];

    characters = characters.map(char => {
        if (!char.portraits || typeof char.portraits[0] === 'string' || !char.portraits[0]?.iconUrl) {
            const oldPortraits = char.portraits || char.portraitUrls || (char.portraitUrl ? [char.portraitUrl] : []);
            char.portraits = oldPortraits.map(p => {
                const url = typeof p === 'string' ? p : (p.thumbnail || p.full);
                return {
                    id: Date.now() + Math.random(),
                    iconUrl: url,
                    fullUrl: url
                };
            });
        }
        if (typeof char.activePortraitIndex !== 'number' || char.activePortraitIndex >= char.portraits.length) {
            char.activePortraitIndex = 0;
        }
        delete char.portraitUrl;
        delete char.portraitUrls;
        return char;
    });
    dataStore.characters = characters;
}

async function saveCharacters() {
    const adventureId = getAdventureId();
    if (!adventureId) return;
    await chrome.storage.local.set({ [adventureId]: dataStore.characters });
}

function renderCharacterList(charactersToRender = dataStore.characters) {
    const listEl = document.getElementById('character-list');
    listEl.innerHTML = '';

    charactersToRender.forEach(char => {
        const item = document.createElement('li');
        item.dataset.id = char.id;

        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle material-symbols-rounded';
        dragHandle.textContent = 'drag_indicator';

        const portrait = document.createElement('img');
        const activePortrait = char.portraits[char.activePortraitIndex] || char.portraits[0];
        portrait.src = sanitizeUrl(activePortrait?.iconUrl || '');
        portrait.alt = char.name;

        const nameSpan = document.createElement('span');
        const colorToApply = char.colorMode === "special" ? char.color : dataStore.settings.sharedColor;
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
    dataStore.ui.editingCharacterId = characterId;
    const form = document.getElementById('character-form');
    const title = document.getElementById('form-title');
    const deleteBtn = document.getElementById('delete-char-btn');

    form.reset();

    if (characterId) {
        const char = dataStore.characters.find(c => c.id === characterId);
        title.textContent = 'Edit Character';
        document.getElementById('char-name').value = char.name;
        document.getElementById('char-nicknames').value = (char.nicknames || []).join(', ');
        document.getElementById('char-color').value = char.color;
        document.getElementById('char-color-mode').value = char.colorMode;
        deleteBtn.classList.remove('hidden');
        renderPortraitEditor(char);
    } else {
        title.textContent = 'Add Character';
        document.getElementById('char-color').value = dataStore.settings.defaultColor;
        deleteBtn.classList.add('hidden');
        document.getElementById('portrait-list-editor').innerHTML = '';
    }

    document.getElementById('character-list-view').style.display = 'none';
    document.getElementById('character-form-view').style.display = 'flex';
}

async function saveCharacterForm() {
    const form = document.getElementById('character-form');
    if (!form || form.offsetParent === null) return;

    const name = document.getElementById('char-name').value;
    if (!name.trim()) return;

    const portraitItems = document.querySelectorAll('#portrait-list-editor .portrait-editor-item');
    const portraits = Array.from(portraitItems).map(item => ({
        id: item.dataset.id,
        iconUrl: item.querySelector('.portrait-card-icon img').src,
        fullUrl: item.querySelector('.portrait-card-full img').src || item.querySelector('.portrait-card-icon img').src
    }));

    const activeItem = document.querySelector('#portrait-list-editor .portrait-editor-item.active');
    const activePortraitIndex = activeItem ? Array.from(portraitItems).indexOf(activeItem) : 0;

    const formData = {
        name: document.getElementById('char-name').value,
        nicknames: document.getElementById('char-nicknames').value.split(',').map(n => n.trim()).filter(Boolean),
        color: document.getElementById('char-color').value,
        colorMode: document.getElementById('char-color-mode').value,
        portraits: portraits,
        activePortraitIndex: activePortraitIndex
    };

    if (dataStore.ui.editingCharacterId) {
        const char = dataStore.characters.find(c => c.id === dataStore.ui.editingCharacterId);
        if (char) Object.assign(char, formData);
    } else {
        const newId = Date.now();
        dataStore.characters.push({ id: newId, ...formData });
        dataStore.ui.editingCharacterId = newId;
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
        dataStore.characters = dataStore.characters.filter(c => c.id !== dataStore.ui.editingCharacterId);
        await saveCharacters();
        showListView();
    }
}

async function setupCharacterEditor() {
    let panel = document.getElementById('character-editor-panel');
    makePageInert('character-editor-panel');
    if (!panel) {
        panel = await injectPanel('resources/editor_character.html');

        panel.addEventListener('click', e => {
            if (e.target === panel) {
                if (dataStore.settings.autoSaveEnabled) saveCharacterForm();
                closePanel('character-editor-panel', true);
            }
        });

        document.getElementById('show-add-form-btn').addEventListener('click', () => showFormView());
        document.getElementById('character-form').addEventListener('submit', handleSave);

        document.getElementById('back-to-list-btn').addEventListener('click', () => {
            if (dataStore.settings.autoSaveEnabled) saveCharacterForm();
            showListView();
        });

        document.getElementById('delete-char-btn').addEventListener('click', handleDelete);
        document.getElementById('add-new-portrait-btn').addEventListener('click', () => addPortraitEditorItem({}, false));

        document.getElementById('char-search-input').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredChars = dataStore.characters.filter(char =>
                char.name.toLowerCase().includes(searchTerm) ||
                (char.nicknames || []).some(nick => nick.toLowerCase().includes(searchTerm))
            );
            renderCharacterList(filteredChars);
        });

        const editorListEl = document.getElementById('portrait-list-editor');
        new Sortable(editorListEl, {
            animation: 150,
            handle: '.drag-handle',
            forceFallback: true,
        });

        const listEl = document.getElementById('character-list');
        new Sortable(listEl, {
            animation: 150,
            handle: '.drag-handle',
            forceFallback: true,
            onEnd: async (evt) => {
                const [movedItem] = dataStore.characters.splice(evt.oldIndex, 1);
                dataStore.characters.splice(evt.newIndex, 0, movedItem);
                await saveCharacters();
            }
        });
    }

    await loadCharacterData();
    showListView();
    setTimeout(() => panel.classList.add('visible'), 10);
}