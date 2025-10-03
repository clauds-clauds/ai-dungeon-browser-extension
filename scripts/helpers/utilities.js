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

    static getReadableAdventureId() {
        return this.getAdventureId() || 'N/A';
    }

    /**
     * Capitalizes the first letter of a string.
     * @param {string} string - The string to capitalize.
     * @returns {string} The capitalized string.
     */
    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1)
    }

    /**
     * Strips special characters from a string for use in a regular expression.
     * @param {String} str 
     * @returns {String} The escaped string.
     */
    static escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    static download(fileName, url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static async promptForJSON() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json,.json';
            input.onchange = (event) => {
                const file = event.target.files[0];
                if (!file) {
                    resolve(null);
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => resolve(null);
                reader.readAsText(file);
            };
            input.click();
        });
    }
}