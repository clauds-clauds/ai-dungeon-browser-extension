"use strict";

/**
 * **DK Run** handles the execution of the extension.
*/
class DKRun {
    static runNow() {
        DKLogger.say("Running version " + DKUtils.currentVersion() + "...");
        DKLogger.say("Adventure ID is " + DKUtils.readableAdventureID() + "...");

        // Reload all the stuff for the text effects.
        DKTextEffects.reload();

        // Link the cache update event to the handler.
        document.addEventListener(DKConfig.EVENT_CACHE_UPDATED, () => DKEvents.onCacheUpdated());

        // Create a new mutation observer to watch for changes in the DOM.
        DKGlobal.mutationObserver = new MutationObserver((mutations) => {
            // Get the current adventure ID.
            DKGlobal.adventureID = DKUtils.adventureID();

            // If there's a current adventure ID, trigger the adventure play stuff.
            if (DKGlobal.adventureID) DKEvents.onAdventurePlay();

            // Handling of entering and exiting adventures.
            if (DKGlobal.adventureID && DKGlobal.adventureID !== DKGlobal.lastAdventureID) DKEvents.onAdventureEnter();
            else if (!DKGlobal.adventureID && DKGlobal.lastAdventureID) DKEvents.onAdventureExit();
        });

        DKGlobal.mutationObserver.observe(document.body, { childList: true, subtree: true });
    }
}

DKRun.runNow();
