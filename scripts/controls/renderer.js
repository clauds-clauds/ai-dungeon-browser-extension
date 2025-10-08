"use strict";

class Renderer {
    static #nuggetContainer = null;
    static #isInitialized = false;

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

    static async refresh() {
        if (!Discover.extensionMenu()) return;
        this.#isInitialized = false;
        if (this.#nuggetContainer) {
            this.#nuggetContainer.innerHTML = '';
        }
        const selectedCategory = document.querySelector('.de-pill[data-entity-category].selected')?.dataset.entityCategory || 'all';
        await this.ping(selectedCategory);
    }

    static async #initialize() {
        this.#nuggetContainer = document.querySelector('.de-chunk-content .de-chunk-selection');
        if (!this.#nuggetContainer) return;

        this.#nuggetContainer.innerHTML = '<div class="de-entity-nugget-list"></div>';
        const list = this.#nuggetContainer.querySelector('.de-entity-nugget-list');

        if (!Utilities.isMobile()) {
            new Sortable(list, {
                animation: 150,
                ghostClass: 'sortable-ghost'
            });
        }

        const entities = PersistentStorage.cache.entities;

        if (entities.length === 0) return;
        for (const entity of entities) await Construct.entityNugget(entity, list);

        Bind.actions(list);
        this.#isInitialized = true;
    }
}