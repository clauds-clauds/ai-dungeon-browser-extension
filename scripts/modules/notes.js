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
        item.style.borderLeft = `5px solid ${sanitizeColor(note.color) || 'var(--c-core4, #3a4045)'}`;

        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle material-symbols-rounded';
        dragHandle.textContent = 'drag_indicator';

        const noteContent = document.createElement('div');
        noteContent.className = 'note-content';

        const noteText = document.createElement('p');
        noteText.className = 'note-text';
        noteText.textContent = note.text;

        const noteTags = document.createElement('div');
        noteTags.className = 'note-tags';
        (note.tags || []).forEach(tagText => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'note-tag';
            tagSpan.textContent = tagText;
            noteTags.appendChild(tagSpan);
        });

        noteContent.appendChild(noteText);
        noteContent.appendChild(noteTags);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-note-btn';
        deleteBtn.title = 'Delete Note';

        const deleteIcon = document.createElement('span');
        deleteIcon.className = 'material-symbols-rounded';
        deleteIcon.textContent = 'delete';
        deleteBtn.appendChild(deleteIcon);
        deleteBtn.addEventListener('click', () => deleteNote(note.id));

        item.appendChild(dragHandle);
        item.appendChild(noteContent);
        item.appendChild(deleteBtn);
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
    makePageInert();

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

    document.getElementById('new-note-color').value = extensionSettings.defaultNoteColor;
    await loadNotes();
    setTimeout(() => panel.classList.add('visible'), 10);
}