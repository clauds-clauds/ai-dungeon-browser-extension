"use strict";

class Events {
    /**
     * The ID of the previous adventure, used to detect changes.
     */
    static #previousAdventureId = null;

    static onCustomMenuButtonClick() {
        CustomDebugger.say("Custom menu button clicked.", true);
        Menu.ping();
    }

    /**
     * Called when the adventure changes.
     * @param {string} currentAdventureId
     * @returns {void}
     */
    static onAdventureChange(currentAdventureId) {
        CustomDebugger.say(`Loaded adventure ${currentAdventureId}.`, true);
        PersistentStorage.ping(currentAdventureId);
        this.#previousAdventureId = currentAdventureId;
    }

    /**
     * Called when the adventure is exited.
     * @returns {void}
     */
    static onAdventureExit() {
        CustomDebugger.say(`Left adventure ${this.#previousAdventureId}.`, true);
        this.#previousAdventureId = null;
    }

    /**
     * Called when the persistent storage is modified.
     * @returns {void}
     */
    static onPersistentStorageModified() {
        CustomDebugger.say("Persistent storage modified.", true);
        Renderer.refresh();
        Page.injectCustomSettings();

        setTimeout(() => {
            TextEffects.ping(true);
        }, 100);
    }

    /**
     * Called when the extension starts running.
     * @returns {void}
     */
    static onRun() {
        // Print out the current version when the extension starts running.
        CustomDebugger.say("Running version " + Utilities.getVersion() + ".");
        CustomDebugger.sayStorageQuota();

        // Inject some stuff.
        Inject.materialSymbols();

        // Ping some other stuff.
        TextEffects.ping(true);
        Tooltip.ping();

        // Listen for changes in the database.
        Dexie.on('storagemutated', () => {
            this.onPersistentStorageModified();
        });

        // Listen for changes in in-memory cache.
        document.addEventListener(Configuration.EVENT_CACHE_UPDATED, () => {
            this.onPersistentStorageModified();
        });

        // Listen for the extension menu creation.
        document.addEventListener(Configuration.EXTENSION_MENU_CREATED, () => {
            
        });

        // Create an observer which listens for all the changes.
        const mutationObserver = new MutationObserver((mutations) => {
            // Get the ID of the current adventure.
            const adventureId = Utilities.getAdventureId();

            // If loaded into an adventure, then try to inject the custom button.
            if(adventureId) Inject.customMenuButton();

            // Check if the adventure ID has changed.
            if(adventureId && adventureId !== this.#previousAdventureId) {
                this.onAdventureChange(adventureId);
            } else if (!adventureId && this.#previousAdventureId) {
                this.onAdventureExit();
            }

            // Ping the text effects to update any new elements.
            TextEffects.ping();
        });

        // Start observing for changes.
        mutationObserver.observe(document.body, { childList: true, subtree: true });
    }
}

// Start the event handling when the script is loaded.
Events.onRun();