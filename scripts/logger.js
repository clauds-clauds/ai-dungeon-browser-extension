"use strict";

class DKLogger {
    static say(message, verbose = false, loud = false) {
        const color = loud ? DKConfig.COLOR_DANGER : DKConfig.COLOR_THEME;
        const prefix = "Dungeon Kit " + (loud ? 'screams' : 'says'); 

        const debugStyle = [
            'font-weight: bold',
            'color: ' + color,
        ].join(';');

        const logOutput = `%c${prefix}%c "${message}"`;

        if (!loud) console.log(logOutput, debugStyle, '');
        else console.error(logOutput, debugStyle, '');
    }

    static scream(message, verbose = false) {
        this.say(message, verbose, true);
    }
}