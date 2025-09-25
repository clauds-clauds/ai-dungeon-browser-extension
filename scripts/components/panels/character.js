'use strict';

class Character extends Panel {
    static renderPortraitEditor(char) {
        const list = document.getElementById('portrait-list-editor');
        list.innerHTML = '';
        char.portraits.forEach((p, index) => Character.addPortraitEditorItem(p, index === char.activePortraitIndex));
    }

    static addPortraitEditorItem(portraitData = {}, isActive) {
        const template = document.getElementById('portrait-editor-template');
        const clone = template.content.cloneNode(true);
        const item = clone.querySelector('li');
        item.dataset.id = portraitData.id || Date.now() + Math.random();

        const iconCard = item.querySelector('.portrait-card-icon');
        const iconImg = iconCard.querySelector('img');
        const iconInput = iconCard.querySelector('.icon-file-input');

        if (portraitData.iconUrl) {
            iconImg.src = portraitData.iconUrl;
            iconImg.style.display = 'block';
        } else {
            iconImg.style.display = 'none';
        }

        const fullCard = item.querySelector('.portrait-card-full');
        const fullImg = fullCard.querySelector('img');
        const fullInput = fullCard.querySelector('.full-file-input');

        if (portraitData.fullUrl) {
            fullImg.src = portraitData.fullUrl;
            fullImg.style.display = 'block';
        } else {
            fullImg.style.display = 'none';
        }

        const setupFileInput = (card, img, input, isIcon) => {
            card.addEventListener('click', () => input.click());
            input.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (event) => {
                    let finalUrl = event.target.result;
                    if (isIcon) {
                        finalUrl = await Utils.resizeImage(finalUrl, 64, 64, 'image/jpeg');
                    }
                    img.src = finalUrl;
                    img.style.display = 'block';
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

        if (isActive) item.classList.add('active');

        document.getElementById('portrait-list-editor').appendChild(item);
    }

    static async saveCharacters() {
        const adventureId = Utils.getAdventureId();
        if (!adventureId) return;
        await chrome.storage.local.set({ [adventureId]: Store.data.characters });
    }

    static showList(charactersToRender = Store.data.characters) {
        document.getElementById('character-list-view').style.display = 'flex';
        document.getElementById('character-form-view').style.display = 'none';
        
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
            portrait.src = Utils.sanitizeUrl(activePortrait?.iconUrl || '');
            portrait.alt = char.name;

            const nameSpan = document.createElement('span');
            const colorToApply = char.colorMode === "special" ? char.color : Store.data.settings.sharedColor;
            nameSpan.style.color = Utils.sanitizeColor(colorToApply) || 'inherit';
            nameSpan.textContent = char.name;

            item.appendChild(dragHandle);
            item.appendChild(portrait);
            item.appendChild(nameSpan);

            dragHandle.addEventListener('mousedown', e => e.stopPropagation());
            item.addEventListener('click', () => Character.showForm(char.id));
            listEl.appendChild(item);
        });
    }

    static showForm(characterId = null) {
        Store.data.ui.editingCharacterId = characterId;
        const form = document.getElementById('character-form');
        const title = document.getElementById('form-title');
        const deleteBtn = document.getElementById('delete-char-btn');

        form.reset();

        if (characterId) {
            const char = Store.data.characters.find(c => c.id === characterId);
            title.textContent = 'Edit Character';
            document.getElementById('char-name').value = char.name;
            document.getElementById('char-nicknames').value = (char.nicknames || []).join(', ');
            document.getElementById('char-color').value = char.color;
            document.getElementById('char-color-mode').value = char.colorMode;
            document.getElementById('char-pick-mode').value = char.pickMode;
            deleteBtn.classList.remove('hidden');
            Character.renderPortraitEditor(char);
        } else {
            title.textContent = 'Add Character';
            document.getElementById('char-color').value = Store.data.settings.defaultColor;
            deleteBtn.classList.add('hidden');
            document.getElementById('portrait-list-editor').innerHTML = '';
        }

        document.getElementById('character-list-view').style.display = 'none';
        document.getElementById('character-form-view').style.display = 'flex';
    }

    static async saveCharacterForm() {
        const form = document.getElementById('character-form');
        if (!form || form.offsetParent === null) return;

        const name = document.getElementById('char-name').value;
        if (!name.trim()) return;

        const portraitItems = document.querySelectorAll('#portrait-list-editor .portrait-editor-item');

        let portraits;
        if (Store.data.settings.portraitFallback && true == false) {
            portraits = Array.from(portraitItems).map(item => {
                const iconImg = item.querySelector('.portrait-card-icon img');
                const fullImg = item.querySelector('.portrait-card-full img');
                const iconSrc = iconImg.src;
                const hasValidFullImage = fullImg.naturalWidth > 0;
                return {
                    id: item.dataset.id,
                    iconUrl: iconSrc,
                    fullUrl: hasValidFullImage ? fullImg.src : iconSrc
                };
            });
        } else {
            portraits = Array.from(portraitItems).map(item => ({
                id: item.dataset.id,
                iconUrl: item.querySelector('.portrait-card-icon img').src,
                fullUrl: item.querySelector('.portrait-card-full img').src
            }));
        }

        const activeItem = document.querySelector('#portrait-list-editor .portrait-editor-item.active');
        const activePortraitIndex = activeItem ? Array.from(portraitItems).indexOf(activeItem) : 0;

        const formData = {
            name: document.getElementById('char-name').value,
            nicknames: document.getElementById('char-nicknames').value.split(',').map(n => n.trim()).filter(Boolean),
            color: document.getElementById('char-color').value,
            colorMode: document.getElementById('char-color-mode').value,
            pickMode: document.getElementById('char-pick-mode').value,
            portraits: portraits,
            activePortraitIndex: activePortraitIndex
        };

        if (Store.data.ui.editingCharacterId) {
            const char = Store.data.characters.find(c => c.id === Store.data.ui.editingCharacterId);
            if (char) Object.assign(char, formData);
        } else {
            const newId = Date.now();
            Store.data.characters.push({ id: newId, ...formData });
            Store.data.ui.editingCharacterId = newId;
        }
        await Character.saveCharacters();
    }

    static async onSaveClick(event) {
        event.preventDefault();
        await Character.saveCharacterForm();
        Character.showList();
    }

    static async onDeleteClick() {
        if (confirm('Are you sure you want to delete this character?')) {
            Store.data.characters = Store.data.characters.filter(c => c.id !== Store.data.ui.editingCharacterId);
            await Character.saveCharacters();
            Character.showList();
        }
    }

    static async show() {
        let panel = Panel.prepare('character-editor-panel');

        if (!panel) {
            Utils.printNeat('Injecting character panel.');
            panel = await Inject.panel('resources/panels/character_panel.html');

            document.getElementById('character-list-back-to-menu-btn').addEventListener('click', () => {
                Panel.close('character-editor-panel');
                setTimeout(Menu.show, Config.TIME_DELAY_SWITCH);
            });

            document.getElementById('character-form-back-to-menu-btn').addEventListener('click', () => {
                if (Store.data.settings.autoSaveEnabled) Character.saveCharacterForm();
                Panel.close('character-editor-panel');
                setTimeout(Menu.show, Config.TIME_DELAY_SWITCH);
            });

            panel.addEventListener('click', e => {
                if (e.target === panel) {
                    if (Store.data.settings.autoSaveEnabled) Character.saveCharacterForm();
                    Panel.close('character-editor-panel', true);
                }
            });

            document.getElementById('show-add-form-btn').addEventListener('click', () => Character.showForm());
            document.getElementById('character-form').addEventListener('submit', Character.onSaveClick);

            document.getElementById('back-to-list-btn').addEventListener('click', () => {
                if (Store.data.settings.autoSaveEnabled) Character.saveCharacterForm();
                Character.showList();
            });

            document.getElementById('delete-char-btn').addEventListener('click', Character.onDeleteClick);
            document.getElementById('add-new-portrait-btn').addEventListener('click', () => Character.addPortraitEditorItem({}, false));

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
                    const [movedItem] = Store.data.characters.splice(evt.oldIndex, 1);
                    Store.data.characters.splice(evt.newIndex, 0, movedItem);
                    await Character.saveCharacters();
                }
            });
        }

        document.getElementById('char-search-input').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredChars = Store.data.characters.filter(char =>
                char.name.toLowerCase().includes(searchTerm) ||
                (char.nicknames || []).some(nick => nick.toLowerCase().includes(searchTerm))
            );
            Character.showList(filteredChars);
        });

        await Store.loadCharacters();
        document.getElementById('char-search-input').value = '';
        Character.showList();
        setTimeout(() => panel.classList.add('visible'), 10);
    }
}