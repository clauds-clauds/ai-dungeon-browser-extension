'use strict';

let allAdventureNotes = [];

async function loadNotes() {
    const adventureId = getAdventureId();
    if (!adventureId) return;

    const key = `notes_${adventureId}`;
    const data = await chrome.storage.local.get(key);
    allAdventureNotes = data[key] || [];
    renderNotes();
}

async function saveNotes() {
    const adventureId = getAdventureId();
    if (!adventureId) return;

    const key = `notes_${adventureId}`;
    await chrome.storage.local.set({ [key]: allAdventureNotes });
}

function renderNotes() {
    const listEl = document.getElementById('notes-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    allAdventureNotes.forEach((note) => {
        const item = document.createElement('li');
        item.dataset.id = note.id;
        item.style.borderLeft = `5px solid ${note.color || 'var(--c-core4, #3a4045)'}`; // If this ever gets wonky it's because Lat figured they'd change the CSS to screw this extension (in particular) over.

        const tagsHTML = (note.tags || []).map(tag => `<span class="note-tag">${tag}</span>`).join('');

        // This can probably be moves somewhere less garbage.
        item.innerHTML = `
            <span class="drag-handle material-symbols-outlined">drag_indicator</span>
            <div class="note-content">
                <p class="note-text">${note.text}</p>
                <div class="note-tags">${tagsHTML}</div>
            </div>
            <button class="delete-note-btn" title="Delete Note">
                <span class="material-symbols-outlined">delete</span>
            </button>
        `;

        item.querySelector('.delete-note-btn').addEventListener('click', () => deleteNote(note.id));
        listEl.appendChild(item);
    });
}

async function addNote(event) {
    event.preventDefault();
    const input = document.getElementById('new-note-input');
    const colorInput = document.getElementById('new-note-color');
    const tagsInput = document.getElementById('new-note-tags');
    const text = input.value.trim();

    if (text) {
        const newNote = {
            id: Date.now(),
            text: text,
            color: colorInput.value,
            tags: tagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean)
        };

        allAdventureNotes.unshift(newNote);
        input.value = '';
        tagsInput.value = '';

        await saveNotes();
        renderNotes();
    }
}

async function deleteNote(id) {
    allAdventureNotes = allAdventureNotes.filter(note => note.id !== id);
    await saveNotes();
    renderNotes();
}

async function setupNotesEditor() {
    let panel = document.getElementById('notes-editor-panel');

    const settingsData = await chrome.storage.local.get('extensionSettings');
    const currentSettings = { defaultNoteColor: '#3a4045', ...settingsData.extensionSettings };

    if (!panel) {
        const editorUrl = chrome.runtime.getURL('resources/editor_notes.html');
        const editorHtml = await (await fetch(editorUrl)).text();
        document.body.insertAdjacentHTML('beforeend', editorHtml);
        panel = document.getElementById('notes-editor-panel');

        panel.addEventListener('click', e => { if (e.target === panel) closePanel('notes-editor-panel'); });
        document.getElementById('add-note-form').addEventListener('submit', addNote);

        const listEl = document.getElementById('notes-list');
        new Sortable(listEl, {
            animation: 150,
            handle: '.drag-handle',
            forceFallback: true,
            onEnd: async (evt) => {
                const [movedItem] = allAdventureNotes.splice(evt.oldIndex, 1);
                allAdventureNotes.splice(evt.newIndex, 0, movedItem);

                await saveNotes();
            }
        });
    }

    document.getElementById('new-note-color').value = currentSettings.defaultNoteColor;
    await loadNotes();
    setTimeout(() => panel.classList.add('visible'), 10);
}