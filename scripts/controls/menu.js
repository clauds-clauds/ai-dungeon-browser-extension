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
        this.#setupActionButtons(Discover.extensionMenu());
        this.toggleVisibility();

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

    static #setupActionButtons(container) {
        this.rebindActions(container);
    }

    static rebindActions(container) {
        const actionButtons = container.querySelectorAll('[data-action]');

        actionButtons.forEach(button => {
            const action = button.dataset.action;
            const [className, methodName] = action.split('.');

            if (!className || !methodName) {
                console.error(`Invalid action format: ${action}`);
                return;
            }

            // Avoid re-adding listeners
            if (button.dataset.actionBound) return;
            button.dataset.actionBound = 'true';

            const targetClass = ActionMap[className];
            if (typeof targetClass?.[methodName] === 'function') {
                button.addEventListener('click', (event) => targetClass[methodName](event));
            } else {
                console.error(`Action not found: ${action}`);
            }
        });
    }

    static test() {
        CustomDebugger.say("Menu test action triggered.", true);
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