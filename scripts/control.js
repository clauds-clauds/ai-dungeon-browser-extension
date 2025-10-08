"use strict";

class DKControl {
    static controlName = "Strange Control";
    static isHot = false;

    /**
     * Invalidates whatever the control has or does.
    */
    static invalidate() {
        DKLogger.say(`Invalidating ${this.controlName}...`, true);
    }

    /**
     * Validates whatever the control has or does.
    */
    static validate() {
        DKLogger.say(`Validating ${this.controlName}...`, true);
    }

    /**
     * Reloads stuff from the control, often expensive logic.
    */
    static reload() {
        DKLogger.say(`Reloading ${this.controlName}...`, true);
    }

    /**
     * Refreshes the control, typically to update the UI.
    */
    static refresh() {
        DKLogger.say(`Refreshing ${this.controlName}...`, true);
    }

    /**
     * Warms up the control to prepare stuff.
    */
    static warmup() {
        if (this.isHot) return;
        DKLogger.say(`Warming up ${this.controlName}...`, true);
    }
}
