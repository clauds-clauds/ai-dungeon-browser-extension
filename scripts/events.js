"use strict";

class Events {
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
    }
}

// Start the event handling when the script is loaded.
Events.onRun();