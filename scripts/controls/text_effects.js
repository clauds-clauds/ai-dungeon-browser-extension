"use strict";

class TextEffects {
    static ping(hardRefresh = false) {
        CustomDebugger.say("Pinging text effects" + (hardRefresh ? " with hard refresh." : "."), true);
    }
}