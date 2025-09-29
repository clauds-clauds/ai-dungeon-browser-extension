"use strict";

class Log {
    static say(message, isVerbose = false, color = Config.COLOR_WARNING, actionType = "says", toUpperCase = false) {
        if (!Config.LOG_ENABLE || (isVerbose && !Config.LOG_ENABLE_VERBOSE)) return;
        const style = [
            'font-weight: bold',
            'color: ' + color,
        ].join(';');

        const prefix = "Dungeon Extension " + actionType;
        console.log('%c' + (toUpperCase ? prefix.toUpperCase() : prefix) + '%c "' + (toUpperCase ? message.toUpperCase() : message) + '"', style, '');
    }

    static scream(message, isVerbose = false) {
        Log.say(message, isVerbose, Config.COLOR_ERROR, "screams", true);
    }
}