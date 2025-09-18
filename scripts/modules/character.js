'use strict';

async function loadCharacterData() {
    const adventureId = getAdventureId();
    if (!adventureId) {
        dataStore.characters = [];
        return;
    }
    const storageData = await chrome.storage.local.get(adventureId);
    const characters = storageData[adventureId] || [];

    characters.forEach(char => {
        if (char.portraitUrl && !char.portraitUrls) {
            char.portraitUrls = [char.portraitUrl];
            delete char.portraitUrl;
        } else if (!char.portraitUrls) {
            char.portraitUrls = [];
        }
    });

    dataStore.characters = characters;
}

async function saveCharacters() {
    const adventureId = getAdventureId();
    if (!adventureId) return;
    await chrome.storage.local.set({ [adventureId]: dataStore.characters });
}

function renderPortraitsInForm(urls = []) {
    const gallery = document.getElementById('portrait-gallery');
    gallery.innerHTML = '';
    urls.forEach(url => {
        const li = document.createElement('li');
        li.dataset.url = url;

        const img = document.createElement('img');
        img.src = sanitizeUrl(url);
        li.appendChild(img);

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-portrait-btn';
        deleteBtn.innerHTML = '<span class="material-symbols-rounded">close</span>';
        deleteBtn.onclick = () => li.remove();
        li.appendChild(deleteBtn);

        gallery.appendChild(li);
    });
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
        portrait.src = sanitizeUrl(char.portraitUrls?.[0] || '');
        portrait.style.borderRadius = dataStore.settings.borderRadius + '%';
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

        renderPortraitsInForm(char.portraitUrls);

        deleteBtn.classList.remove('hidden');
    } else {
        renderPortraitsInForm([]);
        title.textContent = 'Add Character';
        document.getElementById('char-color').value = dataStore.settings.defaultColor;
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

    const processFiles = async (files) => {
        const urls = [];
        for (const file of files) {
            const reader = new FileReader();
            const promise = new Promise(resolve => {
                reader.onload = async (e) => {
                    if (dataStore.settings.autoResizeEnabled) {
                        resolve(await resizeImage(e.target.result, 64, 64, 'image/jpeg'));
                    } else {
                        resolve(e.target.result);
                    }
                };
            });
            reader.readAsDataURL(file);
            urls.push(await promise);
        }
        return urls;
    };

    const fileInput = document.getElementById('char-portrait-file-input');
    const newPortraitUrls = await processFiles(fileInput.files);
    fileInput.value = '';

    const existingPortraitUrls = Array.from(document.querySelectorAll('#portrait-gallery li'))
        .map(li => li.dataset.url);

    const allPortraitUrls = [...existingPortraitUrls, ...newPortraitUrls];

    const formData = {
        name: document.getElementById('char-name').value,
        nicknames: document.getElementById('char-nicknames').value.split(',').map(n => n.trim()).filter(Boolean),
        color: document.getElementById('char-color').value,
        colorMode: document.getElementById('char-color-mode').value,
        portraitUrls: allPortraitUrls
    };

    if (dataStore.ui.editingCharacterId) {
        const char = dataStore.characters.find(c => c.id === dataStore.ui.editingCharacterId);
        if (char) {
            Object.assign(char, formData);
            delete char.portraitUrl;
        }
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
    makePageInert();
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

        document.getElementById('char-search-input').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredChars = dataStore.characters.filter(char =>
                char.name.toLowerCase().includes(searchTerm) ||
                (char.nicknames || []).some(nick => nick.toLowerCase().includes(searchTerm))
            );
            renderCharacterList(filteredChars);
        });

        const addPortraitBtn = document.getElementById('add-portrait-btn');
        const portraitFileInput = document.getElementById('char-portrait-file-input');

        addPortraitBtn.addEventListener('click', () => portraitFileInput.click());

        portraitFileInput.addEventListener('change', async (event) => {
            const files = Array.from(event.target.files);
            if (!files.length) return;

            const gallery = document.getElementById('portrait-gallery');

            for (const file of files) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const li = document.createElement('li');

                    const img = document.createElement('img');
                    img.src = e.target.result;
                    li.appendChild(img);

                    const deleteBtn = document.createElement('button');
                    deleteBtn.type = 'button';
                    deleteBtn.className = 'delete-portrait-btn';
                    deleteBtn.innerHTML = '<span class="material-symbols-rounded">close</span>';
                    deleteBtn.onclick = () => li.remove();
                    li.appendChild(deleteBtn);

                    gallery.appendChild(li);

                    const tempReader = new FileReader();
                    tempReader.onload = async (readEvent) => {
                        const finalUrl = dataStore.settings.autoResizeEnabled
                            ? await resizeImage(readEvent.target.result, 64, 64, 'image/jpeg')
                            : readEvent.target.result;
                        li.dataset.url = finalUrl;
                    };
                    tempReader.readAsDataURL(file);
                };
                reader.readAsDataURL(file);
            }
            portraitFileInput.value = '';
        });

        const galleryEl = document.getElementById('portrait-gallery');
        new Sortable(galleryEl, {
            animation: 150,
            ghostClass: 'sortable-ghost',
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
