"use strict";

class Menu {
    /**
     * Whether the menu is currently visible.
     */
    static #visible = false;

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

        await Inject.component('components/menu.html', backdrop);

        // await Inject.component('components/menu.html', document.body);
        this.toggleVisibility();
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