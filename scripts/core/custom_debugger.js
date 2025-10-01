"use strict";

class CustomDebugger {
    /**
     * Logs a message to the console.
     * @param {*} message - The message to log.
     * @param {*} verbose - Whether the log is verbose.
     * @param {*} loud - Whether the message should be logged as an error.
     * @returns {void}
     */
    static say(message, verbose = false, loud = false) {
        if (!Configuration.DEBUGGER_ENABLED || verbose && !Configuration.DEBUGGER_VERBOSE_ENABLED) return; // Check if debugging is enabled, if not, exit early.

        // Set the color based on the loudness of the message.
        const color = loud ? Configuration.COLOR_DANGER : Configuration.COLOR_PRIMARY;
        const prefix = "Dungeon Extension " + (loud ? 'screams' : 'says'); // Also set a prefix based on loudness.

        // Create a nice little debug style.
        const debugStyle = [
            'font-weight: bold',
            'color: ' + color,
        ].join(';');

        // Form the actual message.
        const logOutput = `%c${prefix}%c "${message}"`;

        // Print to console.
        if (!loud) console.log(logOutput, debugStyle, '');
        else console.error(logOutput, debugStyle, '');
    }

    /**
     * Logs a message to the console.
     * @param {*} message - The message to log.
     * @param {*} verbose - Whether the log is verbose.
     * @returns {void}
     */
    static scream(message, verbose = false) {
        this.say(message, verbose, true);
    }

    /**
     * Logs the current storage quota and usage to the console.
     * @returns {void}
     */
    static async sayStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const { usage, quota } = await navigator.storage.estimate();
            const usageMB = (usage / 1024 / 1024).toFixed(2);
            const quotaMB = (quota / 1024 / 1024).toFixed(2);
            this.say(`Using ${usageMB}MB of ~${quotaMB}MB.`, true);
        } else {
            this.say('Can\'t estimate storage usage.', true);
        }
    }
}