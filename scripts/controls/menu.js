"use strict";

class Menu {
    /**
     * Whether the menu is currently visible.
     */
    static #visible = false;
    static currentPanel = null;

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

        await this.#addPanelsToSelection(selectionArea, buttons);

        this.toggleVisibility();
    }

    static async #addPanelsToSelection(selectionArea, panelButtons) {
        // Inject all panels first.
        for (const button of panelButtons) {
            const panel = await Inject.component(`components/panels/${button.dataset.panel}_panel.html`, selectionArea);
            panel.dataset.panel = button.dataset.panel;
        }

        panelButtons.forEach(button => {
            button.addEventListener('click', async () => {
                panelButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');

                const panelName = button.dataset.panel;
                const panels = selectionArea.querySelectorAll('[data-panel]');

                // Hide all panels, then show the one that matches the button.
                panels.forEach(p => {
                    if (p.dataset.panel === panelName) {
                        p.classList.add('selected');
                    } else {
                        p.classList.remove('selected');
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