"use strict";

class Editor {
    static #currentEntity = {};

    static #gatherEntityData() {
        const entityData = {
            id: this.#currentEntity.id,
            adventureId: Utilities.getAdventureId()
        };
        const fields = document.querySelectorAll('[data-entity-variable]');

        fields.forEach(field => {
            const key = field.dataset.entityVariable;
            let value = field.value;
            if (field.type === 'checkbox') {
                value = field.checked;
            } else if (key === 'triggers') {
                value = value.split(',').map(s => s.trim()).filter(Boolean);
            }
            entityData[key] = value;
        });

        entityData.icons = this.#getMediaFromList('entity-icons-list');
        entityData.graphics = this.#getMediaFromList('entity-graphics-list');

        return entityData;
    }

    static #getMediaFromList(listId) {
        const list = document.getElementById(listId);
        return Array.from(list.querySelectorAll('.entity-media-item')).map(item => ({
            url: item.dataset.url,
            isPinned: item.classList.contains('pinned')
        }));
    }

    static forwardToStorage() {
        CustomDebugger.say("Forwarding entity to storage.", true);
        const entity = this.#gatherEntityData();
        PersistentStorage.saveEntity(entity);
    }

    static addIcon() {
        this.#addMediaFromFile('entity-icons-list');
    }

    static addGraphic() {
        this.#addMediaFromFile('entity-graphics-list');
    }

    static #addMediaFromFile(listId) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = readerEvent => {
                const url = readerEvent.target.result;
                this.#addMediaItem(listId, url, file.name);
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }

    static #addMediaItem(listId, url, name = 'New Asset') {
        const list = document.getElementById(listId);
        const template = document.getElementById('entity-media-item-template');
        const clone = template.content.cloneNode(true);
        const item = clone.querySelector('.entity-media-item');
        const thumb = clone.querySelector('.entity-media-thumb');
        const title = clone.querySelector('.entity-media-title');

        item.dataset.url = url;
        title.textContent = name.substring(0, name.lastIndexOf('.')) || name;

        if (url.startsWith('data:image')) {
            const img = new Image();
            img.src = url;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            thumb.innerHTML = '';
            thumb.appendChild(img);
        }

        this.#setupMediaItemActions(item, listId);
        list.querySelector('.entity-media-empty')?.remove();
        list.appendChild(item);
    }

    static #setupMediaItemActions(item, listId) {
        const pinButton = item.querySelector('[data-action="pin"]');
        const deleteButton = item.querySelector('[data-action="delete"]');

        pinButton.addEventListener('click', () => {
            const list = document.getElementById(listId);
            list.querySelectorAll('.entity-media-item').forEach(el => el.classList.remove('pinned'));
            item.classList.add('pinned');
        });

        deleteButton.addEventListener('click', () => {
            item.remove();
        });
    }
}