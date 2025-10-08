"use strict";

/**
 * **DK Events** handles event stuff.
*/
class DKEvents {
    static onInterfaceEnter() {

    }

    static onInterfaceExit() {

    }

    static onAdventureEnter() {
        DKLogger.say(`Entering adventure ${DKGlobal.adventureID}...`);
        DKGlobal.lastAdventureID = DKGlobal.adventureID;
    }

    static onAdventurePlay() {

    }

    static onAdventureExit() {
        DKLogger.say(`Exiting adventure ${DKGlobal.lastAdventureID}...`);
        DKGlobal.lastAdventureID = null;
    }

    static onCacheUpdated () {

    }
}
