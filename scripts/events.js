"use strict";

class Events {
    /**
     * The ID of the previous adventure, used to detect changes.
     */
    static #previousAdventureId = null;

    /**
     * Called when the adventure changes.
     * @param {string} currentAdventureId
     * @returns {void}
     */
    static onAdventureChange(currentAdventureId) {
        CustomDebugger.say(`Loaded adventure ${currentAdventureId}.`, true);
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
        document.addEventListener('storage-cache-updated', () => {
            this.onPersistentStorageModified();
        });

        // Create an observer which listens for all the changes.
        const mutationObserver = new MutationObserver((mutations) => {
            // Get the ID of the current adventure.
            const adventureId = Utilities.getAdventureId();

            // Check if the adventure ID has changed.
            if(adventureId && adventureId !== this.#previousAdventureId) {
                this.onAdventureChange(adventureId);
            } else if (!adventureId && this.#previousAdventureId) {
                this.onAdventureExit();
            }
        });

        // Start observing for changes.
        mutationObserver.observe(document.body, { childList: true, subtree: true });
    }
}

// Start the event handling when the script is loaded.
Events.onRun();