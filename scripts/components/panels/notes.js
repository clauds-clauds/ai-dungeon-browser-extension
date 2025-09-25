'use strict';

class Notes extends Panel {
    static async loadNotes() {
        const adventureId = Utils.getAdventureId();
        if (!adventureId) return;

        const key = `notes_${adventureId}`;
        const data = await chrome.storage.local.get(key);
        Store.data.notes = data[key] || [];
        Notes.renderNotes();
    }

    static async saveNotes() {
        const adventureId = Utils.getAdventureId();
        if (!adventureId) return;

        const key = `notes_${adventureId}`;
        await chrome.storage.local.set({ [key]: Store.data.notes });
    }

    static renderNotes() {
        const listEl = document.getElementById('notes-list');
        if (!listEl) return;
        listEl.innerHTML = '';

        Store.data.notes.forEach((note) => {
            const item = document.createElement('li');
            item.dataset.id = note.id;
            item.style.borderLeft = `5px solid ${Utils.sanitizeColor(note.color) || 'var(--c-core4, #3a4045)'}`;

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
            deleteBtn.addEventListener('click', () => Notes.deleteNote(note.id));

            item.appendChild(dragHandle);
            item.appendChild(noteContent);
            item.appendChild(deleteBtn);
            listEl.appendChild(item);
        });
    }

    static async addNote(event) {
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

            Store.data.notes.unshift(newNote);
            input.value = '';
            tagsInput.value = '';

            await Notes.saveNotes();
            Notes.renderNotes();
        }
    }

    static async deleteNote(id) {
        Store.data.notes = Store.data.notes.filter(note => note.id !== id);
        await Notes.saveNotes();
        Notes.renderNotes();
    }

    static async show() {
        let panel = Panel.prepare('notes-editor-panel');

        if (!panel) {
            Utils.printNeat('Injecting notes panel.');
            panel = await Inject.panel('resources/panels/notes_panel.html');

            document.getElementById('notes-back-to-menu-btn').addEventListener('click', () => {
                Panel.close('notes-editor-panel');
                setTimeout(Menu.show, Config.TIME_DELAY_SWITCH);
            });

            panel.addEventListener('click', e => { if (e.target === panel) Panel.close('notes-editor-panel'); });
            document.getElementById('add-note-form').addEventListener('submit', Notes.addNote);

            const listEl = document.getElementById('notes-list');
            new Sortable(listEl, {
                animation: 150,
                handle: '.drag-handle',
                forceFallback: true,
                onEnd: async (evt) => {
                    const [movedItem] = Store.data.notes.splice(evt.oldIndex, 1);
                    Store.data.notes.splice(evt.newIndex, 0, movedItem);
                    await Notes.saveNotes();
                }
            });
        }

        document.getElementById('new-note-color').value = Store.data.settings.defaultNoteColor;
        await Notes.loadNotes();
        setTimeout(() => panel.classList.add('visible'), 10);
    }
}
