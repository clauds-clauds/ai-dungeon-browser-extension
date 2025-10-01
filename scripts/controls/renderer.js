"use strict";

class Renderer {
    static #nuggetContainer = null;
    static #isInitialized = false;
    static #categoryIcons = {
        character: 'person',
        race: 'sword_rose',
        location: 'explore',
        faction: 'castle',
        custom: 'category'
    };

    static async ping(category) {
        CustomDebugger.say(`Pinging with ${category}`, true);

        if (!this.#isInitialized) {
            await this.#initialize();
        }

        const nuggets = this.#nuggetContainer.querySelectorAll('.de-entity-nugget');
        if (category === 'all') {
            nuggets.forEach(nugget => nugget.style.display = '');
        } else {
            nuggets.forEach(nugget => {
                nugget.style.display = nugget.dataset.category === category ? '' : 'none';
            });
        }
    }

    static async #initialize() {
        this.#nuggetContainer = document.querySelector('.de-chunk-content .de-snippet-area');
        if (!this.#nuggetContainer) return;

        this.#nuggetContainer.innerHTML = '<div class="de-entity-nugget-list"></div>';
        const list = this.#nuggetContainer.querySelector('.de-entity-nugget-list');

        new Sortable(list, {
            animation: 150,
            ghostClass: 'sortable-ghost'
        });

        const entities = PersistentStorage.cache.entities;
        if (entities.length === 0) {
            // You can add a placeholder message here if you want.
            return;
        }

        for (const entity of entities) {
            await this.#createNugget(entity, list);
        }

        Menu.rebindActions(list);
        this.#isInitialized = true;
    }

    static async #createNugget(entity, parent) {
        const nugget = await Inject.component('components/nuggets/entity_nugget.html', parent);
        if (!nugget) return;

        nugget.dataset.entityId = entity.id;
        nugget.dataset.category = entity.category;

        // Set name and category
        nugget.querySelector('.de-entity-nugget-name').textContent = entity.name || 'Unnamed Entity';
        nugget.querySelector('.de-entity-nugget-category-name').textContent = entity.category || 'No Category';
        nugget.querySelector('.de-entity-nugget-category-icon').textContent = this.#categoryIcons[entity.category] || 'help';

        // Set icon
        const iconContainer = nugget.querySelector('.de-entity-nugget-icon');
        const icon = entity.icons?.find(i => i.isPinned) || entity.icons?.[0];

        if (icon?.url) {
            const img = document.createElement('img');
            img.src = icon.url;
            iconContainer.innerHTML = '';
            iconContainer.appendChild(img);
        } else {
            iconContainer.innerHTML = `<span class="material-symbols-rounded">${this.#categoryIcons[entity.category] || 'image'}</span>`;
        }
    }
}