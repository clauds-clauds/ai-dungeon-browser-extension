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

function renderCharacterList() {
    const listEl = document.getElementById('character-list');
    listEl.innerHTML = '';

    characterState.characters.forEach(char => {
        const item = document.createElement('li');
        item.innerHTML = `<img src="${char.portraitUrl || ''}"><span style="color: ${char.color};">${char.name}</span>`;
        item.addEventListener('click', () => showFormView(char.id));
        listEl.appendChild(item);
    });
}

function showListView() {
    document.getElementById('character-list-view').style.display = 'flex';
    document.getElementById('character-form-view').style.display = 'none';

    renderCharacterList();
}

function showFormView(characterId = null) {
    characterState.editingId = characterId;
    const form = document.getElementById('character-form');
    const title = document.getElementById('form-title');
    const deleteBtn = document.getElementById('delete-char-btn');

    form.reset();

    if (characterId) {
        const char = characterState.characters.find(c => c.id === characterId);
        title.textContent = 'Edit Character';
        document.getElementById('char-name').value = char.name;
        document.getElementById('char-nicknames').value = char.nicknames.join(', ');
        document.getElementById('char-color').value = char.color;
        document.getElementById('char-status').value = char.status;
        deleteBtn.classList.remove('hidden');
    } else {
        title.textContent = 'Add Character';
        document.getElementById('char-color').value = extensionSettings.defaultColor;
        deleteBtn.classList.add('hidden');
    }

    document.getElementById('character-list-view').style.display = 'none';
    document.getElementById('character-form-view').style.display = 'flex';
}

async function handleSave(event) {
    event.preventDefault();
    const file = document.getElementById('char-portrait-file').files[0];

    const processSave = async (portraitUrl) => {
        const formData = {
            name: document.getElementById('char-name').value,
            nicknames: document.getElementById('char-nicknames').value.split(',').map(n => n.trim()).filter(Boolean),
            color: document.getElementById('char-color').value,
            status: document.getElementById('char-status').value,
        };

        if (characterState.editingId) {
            const char = characterState.characters.find(c => c.id === characterState.editingId);
            Object.assign(char, formData);
            if (portraitUrl) char.portraitUrl = portraitUrl;
        } else {
            characterState.characters.push({ id: Date.now(), ...formData, portraitUrl: portraitUrl || '' });
        }

        await saveCharacters();
        showListView();
    };

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => processSave(e.target.result);
        reader.readAsDataURL(file);
    } else {
        processSave(null);
    }
}

async function handleDelete() {
    characterState.characters = characterState.characters.filter(c => c.id !== characterState.editingId);
    await saveCharacters();
    showListView();
}

function closeCharacterEditor() {
    const panel = document.getElementById('character-editor-panel');
    if (panel) panel.style.display = 'none';
}

async function setupCharacterEditor() {
    let panel = document.getElementById('character-editor-panel');

    if (!panel) {
        const editorUrl = chrome.runtime.getURL('resources/editor_character.html');
        const editorHtml = await (await fetch(editorUrl)).text();
        document.body.insertAdjacentHTML('beforeend', editorHtml);
        panel = document.getElementById('character-editor-panel');

        panel.addEventListener('click', e => { if (e.target === panel) closeCharacterEditor(); });
        document.getElementById('show-add-form-btn').addEventListener('click', () => showFormView());
        document.getElementById('back-to-list-btn').addEventListener('click', showListView);
        document.getElementById('character-form').addEventListener('submit', handleSave);
        document.getElementById('delete-char-btn').addEventListener('click', handleDelete);
    }

    await loadCharacterData();
    characterState.characters = characterData;

    showListView();
    panel.style.display = 'flex';
}