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
    }
}

DKRun.runNow();
