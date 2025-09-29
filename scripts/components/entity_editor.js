"use strict";

class EntityEditor {
    static #initializing = false; // Fix this later, there is some kind of magic race condition going on and this is a workaround for now.
    static #currentEntity = null; // The entity which is currently being edited.

    static async tryInit(panel, entity = null) {
        if (this.#initializing) return;
        this.#initializing = true;
        Log.say("Attempting to initialize entity editor.");

        panel.innerHTML = '';

        // Inject the editor into the DOM.
        await Inject.injectable('injectables/entity_editor.html', panel);

        this.#currentEntity = entity;
        if (entity) this.#loadEntity(entity);

        // Add all the event listener stuff.
        this.#initEventListeners();
    }

    static #initEventListeners() {
        const panel = document.getElementById('editor-panel');
        if (!panel) return;

        // Save button.
        document.getElementById('editor-save-btn')?.addEventListener('click', () => {
            // If this is a newly created entity then return to the entity list after saving.
            this.#sendEntityToStorage();
        });

        // Add asset buttons.
        document.getElementById('editor-add-icon-btn')?.addEventListener('click', () => this.#triggerAssetUpload('editor-icons-list'));
        document.getElementById('editor-add-graphic-btn')?.addEventListener('click', () => this.#triggerAssetUpload('editor-graphics-list'));

        // Deleting and pinning things.
        panel.addEventListener('click', (e) => {
            const target = e.target;
            if (target.closest('.asset-action-btn.delete-btn')) {
                target.closest('.asset-item')?.remove();
            }
            if (target.closest('.asset-action-btn.pin-btn')) {
                this.#pinAsset(target.closest('.asset-action-btn.pin-btn'));
            }
        });

        // Initialize sortable lists.
        const iconList = document.getElementById('editor-icons-list');
        const graphicList = document.getElementById('editor-graphics-list');
        if (iconList) new Sortable(iconList, { animation: 150, ghostClass: 'sortable-ghost' });
        if (graphicList) new Sortable(graphicList, { animation: 150, ghostClass: 'sortable-ghost' });
        this.#initializing = false;
    }

    static #gatherEntityVariables() {
        const entityData = this.#currentEntity ? { ...this.#currentEntity } : {
            id: crypto.randomUUID(),
            adventureTag: Utils.getAdventureTag()
        };

        const elements = document.querySelectorAll('#editor-panel [entityVariable]');
        elements.forEach(element => {
            const variable = element.getAttribute('entityVariable');
            let value;

            if (element.classList.contains('sortable-asset-list')) {
                value = Array.from(element.querySelectorAll('.asset-item img')).map(img => img.src);

                // Also find the pinned item index
                const pinButtons = Array.from(element.querySelectorAll('.pin-btn'));
                const pinnedIndex = pinButtons.findIndex(btn => btn.classList.contains('active'));

                if (variable === 'icons') {
                    entityData['currentIcon'] = Math.max(0, pinnedIndex);
                } else if (variable === 'graphics') {
                    entityData['currentGraphic'] = Math.max(0, pinnedIndex);
                }

            } else if (element.id === 'editor-keywords') {
                value = element.value.split(',').map(k => k.trim()).filter(Boolean);
            } else {
                value = element.value;
            }
            entityData[variable] = value;
        });

        return entityData;
    }

    static async #sendEntityToStorage() {
        const entityData = this.#gatherEntityVariables();
        await Storage.saveEntity(entityData);
        this.#currentEntity = entityData;
        Log.say(`Saved entity ${entityData.id} to this adventure.`);
    }

    static #loadEntity(entity) {
        this.#currentEntity = entity;
        const elements = document.querySelectorAll('#editor-panel [entityVariable]');
        elements.forEach(element => {
            const variable = element.getAttribute('entityVariable');
            const value = entity ? entity[variable] : undefined;

            if (element.classList.contains('sortable-asset-list')) {
                element.innerHTML = ''; // Clear existing items
                if (Array.isArray(value)) {
                    const pinnedIndex = variable === 'icons' ? entity.currentIcon : entity.currentGraphic;
                    value.forEach((src, index) => {
                        const assetItem = this.#createAssetItem(src, index === pinnedIndex);
                        element.appendChild(assetItem);
                    });
                }
            } else if (Array.isArray(value)) {
                element.value = value.join(', ');
            } else {
                element.value = value ?? '';
            }
        });
        Log.say(entity ? `Loaded data for entity: ${entity.name}` : 'Cleared entity editor for new entry.');
    }

    static #triggerAssetUpload(listId) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = e => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = readerEvent => {
                    const list = document.getElementById(listId);
                    const assetItem = this.#createAssetItem(readerEvent.target.result);
                    list.appendChild(assetItem);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    static #createAssetItem(src, isPinned = false) {
        const item = document.createElement('div');
        item.className = 'asset-item';

        const imageContainer = document.createElement('div');
        imageContainer.className = 'asset-image-container';

        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Asset';
        imageContainer.appendChild(img);

        const actions = document.createElement('div');
        actions.className = 'asset-actions';

        const pinButton = document.createElement('button');
        pinButton.className = 'asset-action-btn pin-btn';
        if (isPinned) {
            pinButton.classList.add('active');
        }
        pinButton.title = 'Pin';

        const pinIcon = document.createElement('span');
        pinIcon.className = 'material-symbols-rounded';
        pinIcon.textContent = 'push_pin';
        pinButton.appendChild(pinIcon);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'asset-action-btn delete-btn';
        deleteButton.title = 'Delete asset';

        const deleteIcon = document.createElement('span');
        deleteIcon.className = 'material-symbols-rounded';
        deleteIcon.textContent = 'delete';
        deleteButton.appendChild(deleteIcon);

        actions.appendChild(pinButton);
        actions.appendChild(deleteButton);

        item.appendChild(imageContainer);
        item.appendChild(actions);

        return item;
    }

    /**
     * Pins or un-pins a visual asset in the list.
     * @param {*} pinButton 
     */
    static #pinAsset(pinButton) {
        // Get the sortable list which this button belongs to.
        const list = pinButton.closest('.sortable-asset-list');

        // Go over all of the buttons and un-pin them.
        list.querySelectorAll('.pin-btn.active').forEach(activeBtn => {
            if (activeBtn !== pinButton) {
                activeBtn.classList.remove('active');
            }
        });

        // Toggle the clicked button.
        pinButton.classList.toggle('active');
    }
}