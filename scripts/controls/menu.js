"use strict";

class Menu {
    /**
     * Whether the menu is currently visible.
     */
    static #visible = false;
    static currentChunk = null;

    static async ping() {
        CustomDebugger.say("Pinging menu.", true);

        // Check if the menu was already injected.
        if (Discover.extensionMenu()) {
            CustomDebugger.say("Menu already injected, skipping injection.", true);
            this.toggleVisibility();
            return;
        }

        // Otherwise that means the backdrop was not injected yet, so do it now.
        const backdrop = await Page.addComponent('components/backdrop.html', document.body);

        // Afterwards inject the actual menu.
        await Page.addComponent('components/menu.html', backdrop);

        // Create the sidebar functionality.
        const selectionArea = document.getElementById('de-selection');
        const buttons = document.querySelectorAll('.de-sidebar-button');

        // Inject and construct the menu content.
        await Construct.customMenuContent(selectionArea, buttons);

        // Finally fix the adventure ID.
        document.getElementById('adventure-id').textContent = Utilities.getReadableAdventureId();

        this.#setupVariables();
        this.#setupSearch();
        this.#setupActionButtons(Discover.extensionMenu());
        this.toggleVisibility();

        // This is required, something on the host page is interfering with scroll events and calling this ensures they are properly decoupled.
        Page.decoupleScrollEvents();

        document.dispatchEvent(new CustomEvent(Configuration.EXTENSION_MENU_CREATED));
    }

    static #setupVariables() {
        const settingsControls = document.querySelectorAll('[data-variable]');

        settingsControls.forEach(control => {
            const variable = control.dataset.variable;
            const isCheckbox = control.type === 'checkbox';

            control[isCheckbox ? 'checked' : 'value'] = PersistentStorage.getSetting(variable);
            control.addEventListener('input', (event) => {
                const newValue = event.target[isCheckbox ? 'checked' : 'value'];
                PersistentStorage.saveSetting(variable, newValue);

                const linkedControls = document.querySelectorAll(`[data-variable="${variable}"]`);
                linkedControls.forEach(linkedControl => {
                    if (linkedControl !== event.target) {
                        linkedControl[isCheckbox ? 'checked' : 'value'] = newValue;
                    }
                });
            });
        });
    }

    static #setupSearch() {
        const searchInput = document.getElementById('search-input');
        const clearButton = document.getElementById('clear-search-button');
        const nuggetContainer = document.querySelector('.de-chunk-content .de-chunk-selection');

        if (!searchInput || !clearButton || !nuggetContainer) return;

        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const nuggets = nuggetContainer.querySelectorAll('.de-entity-nugget');
            const selectedCategory = document.querySelector('.de-pill[data-entity-category].selected')?.dataset.entityCategory || 'all';

            clearButton.style.display = searchTerm ? '' : 'none';

            nuggets.forEach(nugget => {
                const name = nugget.querySelector('.de-entity-nugget-name').textContent.toLowerCase();
                const category = nugget.dataset.category.toLowerCase();

                const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
                const matchesSearch = name.includes(searchTerm) || category.includes(searchTerm);

                nugget.style.display = matchesCategory && matchesSearch ? '' : 'none';
            });
        });

        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            const event = new Event('input', { bubbles: true, cancelable: true });
            searchInput.dispatchEvent(event);
        });
    }

    static isOpen() {
        return this.#visible;
    }

    static #setupActionButtons(container) {
        Page.rebindActions(container);
    }

    static reportBug() {
        CustomDebugger.say("Bug report button clicked.", true);
        window.open('https://github.com/clauds-clauds/ai-dungeon-browser-extension/issues', '_blank');
    }

    static onSidebarButtonClick() {
        const menu = Discover.extensionMenu();
        Page.decoupleScrollEvents();
        if (menu && Utilities.isMobile() && menu.classList.contains('sidebar-visible')) {
            menu.classList.remove('sidebar-visible');
        }
    }

    static foldout() {
        const menu = Discover.extensionMenu();
        if (menu) {
            menu.classList.toggle('sidebar-visible');
        }
    }

    static toggleVisibility() {
        this.#visible = !this.#visible;

        if (this.#visible) {
            Discover.backdrop().classList.add('visible');
            Discover.extensionMenu().classList.add('visible');
            Page.makeInert(Configuration.ID_EXTENSION_MENU);
        } else {
            Discover.backdrop().classList.remove('visible');
            Discover.extensionMenu().classList.remove('visible');
            Page.makeInteractive();
        }
    }
}