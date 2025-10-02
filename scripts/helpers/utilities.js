"use strict";

/**
 * Class for various utility functions.
 */
class Utilities {
    /**
     * Gets the current version of the extension.
     * @returns {string} The current version of the extension.
     */
    static getVersion() {
        return chrome.runtime.getManifest().version;
    }

    /**
     * Gets the adventure ID from the URL.
     * @returns {string|null} The adventure ID from the URL, or null if not found.
     */
    static getAdventureId() {
        const match = window.location.pathname.match(/adventure\/([^\/]+)/);
        return match ? match[1] : null;
    }

    /**
     * Capitalizes the first letter of a string.
     * @param {string} string - The string to capitalize.
     * @returns {string} The capitalized string.
     */
    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1)
    }

    static escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}