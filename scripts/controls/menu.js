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
        const backdrop = await Inject.component('components/backdrop.html', document.body);

        // Afterwards inject the actual menu.
        await Inject.component('components/menu.html', backdrop);

        // Create the sidebar functionality.
        const selectionArea = document.getElementById('de-selection');
        const buttons = document.querySelectorAll('.de-sidebar-button');

        // Inject and construct the menu content.
        await Construct.customMenuContent(selectionArea, buttons);

        // Finally fix the adventure ID.
        document.getElementById('adventure-id').textContent = Utilities.getAdventureId();

        this.#setupVariables();
        this.toggleVisibility();
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

    static toggleVisibility() {
        this.#visible = !this.#visible;

        if (this.#visible) {
            Discover.backdrop().classList.add('visible');
            Discover.extensionMenu().classList.add('visible');
        } else {
            Discover.backdrop().classList.remove('visible');
            Discover.extensionMenu().classList.remove('visible');
        }
    }
}